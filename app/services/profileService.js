'use strict';
angular.module('owsWalletApp.services').factory('profileService', function($rootScope, $timeout, $log, lodash, storageService, configService, gettextCatalog, errorService, uxLanguageService, platformInfoService, txFormatService, appConfig, networkService, walletService, uiService, addressBookService, Profile) {

  var root = {};

  var isCordova = platformInfoService.isCordova;
  var isIOS = platformInfoService.isIOS;
  var UPDATE_PERIOD = 15;

  var usePushNotifications = isCordova;
  var validationLock = false;
  var availableCallbacks = [];

  var profile = null;
  var isBound = false;
  var wallets = []; // Decorated version of wallet

  /*
   * Public functions
   */

  root.whenAvailable = function(cb) {
    if (!isBound) {
      availableCallbacks.push(cb);
      return;
    }
    return cb();
  };

  root.createProfile = function(cb) {
    $log.info('Creating profile');
    var defaults = configService.getDefaults();

    var p = Profile.create();
    storageService.createProfile(p, function(err) {
      if (err) {
        return cb(err);
      }
      bindProfile(p, function(err) {
        // ignore NONAGREEDDISCLAIMER
        if (err && err.toString().match('NONAGREEDDISCLAIMER')) {
          return cb();
        }
        return cb(err);
      });
    });
  };

  root.loadAndBindProfile = function(cb) {
    // Initialize configService.
    configService.get(function(err) {
      if (err) {
        $rootScope.$emit('Local/DeviceError', err);
        return cb(err);
      }

      storageService.getProfile(function(err, profile) {
        if (err) {
          $rootScope.$emit('Local/DeviceError', err);
          return cb(err);
        }
        if (!profile) {
          return cb(new Error('NOPROFILE: No profile'));
        } else {
          $log.debug('Profile read');
          return bindProfile(profile, cb);
        }
      });
    });
  };

  root.storeProfileIfDirty = function(cb) {
    if (profile.dirty) {
      storageService.storeProfile(profile, function(err) {
        $log.debug('Saved modified Profile');
        if (cb) {
          return cb(err);
        }
      });
    } else {
      if (cb) {
        return cb();
      }
    };
  };

  root.setDisclaimerAccepted = function(cb) {
    profile.disclaimerAccepted = true;
    storageService.storeProfile(profile, function(err) {
      return cb(err);
    });
  };

  root.isDisclaimerAccepted = function(cb) {
    var disclaimerAccepted = profile && profile.disclaimerAccepted;
    return cb(disclaimerAccepted);
  };

  root.updateCredentials = function(credentials, cb) {
    profile.updateWallet(credentials);
    storageService.storeProfile(profile, cb);
  };

  // create and store a wallet
  root.createWallet = function(opts, cb) {
    doCreateWallet(opts, function(err, walletClient, secret) {
      if (err) {
        return cb(err);
      }

      addAndBindWalletClient(walletClient, {
        walletService: opts.walletService
      }, cb);
    });
  };

  root.createDefaultWallet = function(networkName, cb) {
    var defaults = configService.getDefaults();
    networkName = networkName || defaults.networkPreferences.defaultNetworkName;

    var opts = {};
    opts.m = 1;
    opts.n = 1;
    opts.network = networkService.getNetworkByName(networkName);
    opts.walletService = defaults.networkPreferences[networkName].walletService;

    root.createWallet(opts, cb);
  };

  root.getWallet = function(walletId) {
    return wallets[walletId];
  };

  root.getWallets = function(opts, cb) {
    if (opts && !lodash.isObject(opts)) {
      throw "bad argument";
    }
    opts = opts || {};

    var ret = lodash.values(wallets);

    // Short circuit
    if (ret.length == 0) {
      if (cb) {
        cb(ret);
      } else {
        return ret;          
      }
    }

    if (opts.networkName) {
      ret = lodash.filter(ret, function(w) {
        return (w.networkName == opts.networkName);
      });
    }

    if (opts.network) {
      ret = lodash.filter(ret, function(w) {
        return (w.network == opts.network);
      });
    }

    if (opts.n) {
      ret = lodash.filter(ret, function(w) {
        return (w.credentials.n == opts.n);
      });
    }

    if (opts.m) {
      ret = lodash.filter(ret, function(w) {
        return (w.credentials.m == opts.m);
      });
    }

    if (opts.hasFunds) {
      ret = lodash.filter(ret, function(w) {
        if (!w.status) {
          return;
        }
        return (w.status.availableBalanceSat > 0);
      });
    }

    if (opts.minAmount) {
      ret = lodash.filter(ret, function(w) {
        if (!w.status) {
          return;
        }
        return (w.status.availableBalanceSat > opts.minAmount);
      });
    }

    if (opts.onlyComplete) {
      ret = lodash.filter(ret, function(w) {
        return w.isComplete();
      });
    }

    // Add cached balance async
    lodash.each(ret, function(w) {
      addLastKnownBalance(w, function() {});
    });

    ret = lodash.sortBy(ret, [
      function(w) {
        return w.isComplete();
      }, 'createdOn'
    ]);

    // Async calls
    if (cb) {
      // Get status for all wallets
      if (opts.status) {
        var i = 0;
        lodash.each(ret, function(w) {
          walletService.getStatus(w, {}, function(err, status) {
            if (err && !status) {
              $log.error(err);
            }
            w.status = status;

            if (++i == ret.length) {
              return cb(ret);
            }
          });
        });
      }

    } else {
      return ret;
    }
  };

  // Check to see if at least one wallet has funds.
  root.hasFunds = function(opts, cb) {
    opts = opts || {};
    opts.networkName = opts.networkName || null;
    var hasFunds = false;

    lodash.each(Object.keys(wallets), function(walletId) {
      walletService.getStatus(wallets[walletId], {}, function(err, status) {
        if (err && !status) {
          $log.error(err);

        } else if (status.availableBalanceAtomic > 0) {

          if (opts.networkName == null || (opts.networkName && opts.networkName == wallets[walletId].networkName)) {
            hasFunds = true;
            return false; // Break out of loop
          }
        }
      });
    });
    cb(hasFunds);
  };

  root.setBackupFlag = function(walletId) {
    storageService.setBackupFlag(walletId, function(err) {
      if (err) {
        $log.error(err);
      }
      $log.debug('Backup flag stored');
      wallets[walletId].needsBackup = false;
    });
  };

  root.setLastKnownBalance = function(wid, balance, cb) {
    storageService.setBalanceCache(wid, {
      balance: balance,
      updatedOn: Math.floor(Date.now() / 1000),
    }, cb);
  };

  root.toggleHideBalanceFlag = function(walletId, cb) {
    wallets[walletId].balanceHidden = !wallets[walletId].balanceHidden;
    storageService.setHideBalanceFlag(walletId, wallets[walletId].balanceHidden.toString(), cb);
  };

  root.deleteWalletClient = function(walletClient, cb) {
    var walletId = walletClient.credentials.walletId;

    var config = configService.getSync();

    $log.debug('Deleting Wallet:', walletClient.credentials.walletName);
    walletClient.removeAllListeners();

    profile.deleteWallet(walletId);

    delete wallets[walletId];

    storageService.removeAllWalletData(walletId, function(err) {
      if (err) {
        $log.error(err);
      }
    });

    storageService.storeProfile(profile, function(err) {
      if (err) {
        return cb(err);
      }
      return cb();
    });
  };

  // joins and stores a wallet
  root.joinWallet = function(opts, cb) {
    var config = configService.getSync();
    var walletClient = networkService.walletClient({
      currency: opts.network.currency,
      walletServiceUrl: opts.walletService.url
    });

    $log.debug('Joining Wallet:', opts);

    try {
      var walletData = walletClient.parseSecret(opts.secret);

      // check if exist
      if (lodash.find(profile.credentials, {
          'walletId': walletData.walletId
        })) {
        return cb(gettextCatalog.getString('Cannot join the same wallet more that once from the same device.'));
      }
    } catch (ex) {
      $log.debug(ex);
      return cb(gettextCatalog.getString('Bad wallet invitation.'));
    }

    $log.debug('Joining Wallet:', opts);

    seedWallet(opts, function(err, walletClient) {
      if (err) {
        return cb(err);
      }

      walletClient.joinWallet(opts.secret, opts.myName || 'me', {}, function(err) {
        if (err) {
          return errorService.cb(err, gettextCatalog.getString('Could not join wallet.'), cb);
        }
        addAndBindWalletClient(walletClient, {
          walletService: opts.walletService
        }, cb);
      });
    });
  };

  root.getNetworkFromJoinSecret = function(secret, cb) {
    var network;

    // Find the network for the specified secret.
    lodash.forEach(networkService.getNetworks(), function(n) {
      try {
        // Parsing without exception provides a network match.
        var walletClient = networkService.walletClient({
          currency: n.currency
        });
        var walletData = walletClient.parseSecret(secret);

        network = networkService.getNetworkByName(walletData.networkName);
        return false;
      } catch (ex) {
        // Not a match keep trying.
      };
    });

    if (!network) {
      return cb(gettextCatalog.getString('Bad wallet invitation.'));
    }
    return cb(null, network);
  };

  root.importWallet = function(str, opts, cb) {
    // The serialized wallet (str) is wallet credentials plus other meta-data attributes.
    var credentials = JSON.parse(str);
    var metaData = {
      addressBook: credentials.addressBook
    };

    var walletClient = networkService.walletClient({
      currency: credentials.currency,
      walletServiceUrl: opts.walletService.url
    });

    $log.info('Importing Wallet:', opts);

    try {
      if (credentials.xPrivKey && credentials.xPrivKeyEncrypted) {
        $log.warn('Found both encrypted and decrypted key. Deleting the encrypted key.');
        delete credentials.xPrivKeyEncrypted;
        delete credentials.mnemonicEncrypted;
      }

      walletClient.import(JSON.stringify(credentials));
    } catch (err) {
      $log.error(err);
      return cb(gettextCatalog.getString('Could not import. Check input file and spending password.'));
    }

    if (!credentials.n) {
      return cb('Backup format not recognized.');
    }

    addAndBindWalletClient(walletClient, {
      walletService: opts.walletService
    }, function(err, walletId) {
      if (err) {
        return cb(err);
      }
      setMetaData(metaData, function(err) {
        if (err) {
          $log.error(err);
        }
        return cb(null, walletClient);
      });
    });
  };

  root.importExtendedPrivateKey = function(xPrivKey, opts, cb) {
    // Note - opts.walletService should be set according to network.
    var walletClient = networkService.walletClient({
      currency: opts.network.currency,
      walletServiceUrl: opts.walletService.url
    });

    $log.info('Importing Wallet xPrivKey');

    walletClient.importFromExtendedPrivateKey(xPrivKey, opts, function(err) {
      if (err) {
        if (err instanceof networkService.errors.NOT_AUTHORIZED) {
          return cb(err);
        }

        return errorService.cb(err, gettextCatalog.getString('Could not import.'), cb);
      }

      addAndBindWalletClient(walletClient, {
        walletService: opts.walletService
      }, cb);
    });
  };

  root.importMnemonic = function(words, opts, cb) {
    var walletClient = networkService.walletClient({
      currency: opts.network.currency,
      walletServiceUrl: opts.walletService.url
    });

    $log.info('Importing Wallet Mnemonic');

    words = normalizeMnemonic(words);
    walletClient.importFromMnemonic(words, {
      networkName: opts.networkName,
      passphrase: opts.passphrase,
      entropySourcePath: opts.entropySourcePath,
      derivationStrategy: opts.derivationStrategy || 'BIP44',
      account: opts.account || 0,
    }, function(err) {
      if (err) {
        if (err instanceof networkService.errors.NOT_AUTHORIZED) {
          return cb(err);
        }

        return errorService.cb(err, gettextCatalog.getString('Could not import.'), cb);
      }

      addAndBindWalletClient(walletClient, {
        walletService: opts.walletService
      }, cb);
    });
  };

  root.importExtendedPublicKey = function(opts, cb) {
    var walletClient = networkService.walletClient({
      currency: opts.network.currency,
      walletServiceUrl: opts.walletService.url
    });

    $log.info('Importing Wallet XPubKey');

    walletClient.importFromExtendedPublicKey(opts.extendedPublicKey, opts.externalSource, opts.entropySource, {
      account: opts.account || 0,
      derivationStrategy: opts.derivationStrategy || 'BIP44',
    }, function(err) {
      if (err) {
        // in HW wallets, req key is always the same. They can't addAccess.
        if (err instanceof networkService.errors.NOT_AUTHORIZED) {
          err.name = 'WALLET_DOES_NOT_EXIST';
        }

        return errorService.cb(err, gettextCatalog.getString('Could not import.'), cb);
      }

      addAndBindWalletClient(walletClient, {
        walletService: opts.walletService
      }, cb);
    });
  };

  root.getNotifications = function(opts, cb) {
    opts = opts || {};

    var TIME_STAMP = 60 * 60 * 6;
    var MAX = 30;

    var typeFilter = {
      'NewOutgoingTx': 1,
      'NewIncomingTx': 1
    };

    var w = root.getWallets();
    if (lodash.isEmpty(w)) {
      return cb();
    }

    var l = w.length,
      j = 0,
      notifications = [];


    function isActivityCached(wallet) {
      return wallet.cachedActivity && wallet.cachedActivity.isValid;
    };


    function updateNotifications(wallet, cb2) {
      if (isActivityCached(wallet) && !opts.force) {
        return cb2();
      }

      wallet.getNotifications({
        timeSpan: TIME_STAMP,
        includeOwn: true,
      }, function(err, n) {
        if (err) {
          return cb2(err);
        }

        wallet.cachedActivity = {
          n: n.slice(-MAX),
          isValid: true,
        };

        return cb2();
      });
    };

    function process(notifications, networkName) {
      if (!notifications) {
        return [];
      }

      var shown = lodash.sortBy(notifications, 'createdOn').reverse();

      shown = shown.splice(0, opts.limit || MAX);

      lodash.each(shown, function(notification) {
        notification.txpId = notification.data ? notification.data.txProposalId : null;
        notification.txid = notification.data ? notification.data.txid : null;
        notification.types = [notification.type];

        if (notification.data && notification.data.amount) {
          notification.amountStr = txFormatService.formatAmountStr(networkName, notification.data.amount);
        }

        notification.action = function() {
          // TODO-AJP: ?
          // $state.go($rootScope.sref('wallet'), {
          //   walletId: notification.walletId,
          //   txpId: notification.txpId,
          //   txid: notification.txid,
          // });
        };
      });

      var finale = []; // shown; // GROUPING DISABLED!
      var prev;

      // Item grouping... DISABLED.

      // REMOVE (if we want 1-to-1 notification) ????
      lodash.each(shown, function(notification) {
        if (prev && prev.walletId === notification.walletId && prev.txpId && prev.txpId === notification.txpId && prev.creatorId && prev.creatorId === notification.creatorId) {
          prev.types.push(notification.type);
          prev.data = lodash.assign(prev.data, notification.data);
          prev.txid = prev.txid || notification.txid;
          prev.amountStr = prev.amountStr || notification.amountStr;
          prev.creatorName = prev.creatorName || notification.creatorName;
        } else {
          finale.push(notification);
          prev = notification;
        }
      });

      lodash.each(finale, function(notification) {
        var walletClient = networkService.walletClient({
          currency: notification.wallet.currency
        });

        if (notification.data && notification.data.message && notification.wallet && notification.wallet.credentials.sharedEncryptingKey) {
          // TODO-AJP: => Wallet Client
          notification.message = walletClient.utils.decryptMessage(notification.data.message, notification.wallet.credentials.sharedEncryptingKey);
        }
      });

      return finale;
    };

    lodash.each(w, function(wallet) {
      updateNotifications(wallet, function(err) {
        j++;
        if (err) {
          $log.error('Error updating notifications:' + err);
        } else {

          var n;

          n = lodash.filter(wallet.cachedActivity.n, function(n) {
            return typeFilter[n.type];
          });

          var idToName = {};
          if (wallet.cachedStatus) {
            lodash.each(wallet.cachedStatus.wallet.copayers, function(c) {
              idToName[c.id] = c.name;
            });
          }

          lodash.each(n, function(x) {
            x.wallet = wallet;
            if (x.creatorId && wallet.cachedStatus) {
              x.creatorName = idToName[x.creatorId];
            };
          });

          notifications.push(n);
        }
        if (j == l) {
          notifications = lodash.sortBy(notifications, 'createdOn');
          notifications = lodash.compact(lodash.flatten(notifications)).slice(0, MAX);
          var total = notifications.length;
          return cb(null, process(notifications, wallet.networkName), total);
        };
      });
    });
  };

  root.getTxps = function(opts, cb) {
    var MAX = 100;
    opts = opts || {};

    var w = root.getWallets();
    if (lodash.isEmpty(w)) {
      return cb();
    }

    var txps = [];

    lodash.each(w, function(x) {
      if (x.pendingTxps) {
        txps = txps.concat(x.pendingTxps);
      }
    });
    var n = txps.length;
    txps = lodash.sortBy(txps, 'pendingForUs', 'createdOn');
    txps = lodash.compact(lodash.flatten(txps)).slice(0, opts.limit || MAX);
    return cb(null, txps, n);
  };

  /*
   * Private functions
   */

  function requiresBackup(wallet) {
    if (wallet.isPrivKeyExternal() ||
      !wallet.credentials.mnemonic) {
      return false;
    }
    return true;
  };

  function needsBackup(wallet, cb) {
    if (!requiresBackup(wallet)) {
      return cb(false);
    }

    storageService.getBackupFlag(wallet.credentials.walletId, function(err, val) {
      if (err) {
        $log.error(err);
      }
      if (val) {
        return cb(false);
      }
      return cb(true);
    });
  };

  function balanceIsHidden(wallet, cb) {
    storageService.getHideBalanceFlag(wallet.credentials.walletId, function(err, shouldHideBalance) {
      if (err) {
        $log.error(err);
      }
      var hideBalance = (shouldHideBalance == 'true') ? true : false;
      return cb(hideBalance);
    });
  };

  function updateWalletSettings(wallet) {
    configService.whenAvailable(function(config) {
      var defaults = configService.getDefaults();
      var prefs = walletService.getPreferences(wallet.id);

      wallet.usingCustomWalletService = prefs.walletService && (prefs.walletService.url != defaults.networkPreferences[defaults.networkPreferences.defaultNetworkName].walletService.url);
      wallet.name = prefs.alias || wallet.credentials.walletName;
      wallet.color = prefs.color || uiService.getDefaultWalletColor();
      wallet.background = prefs.background || uiService.getDefaultWalletBackground(wallet.color);
      wallet.layout = prefs.layout || uiService.getDefaultWalletLayout();
      wallet.email = config.emailNotifications.email;
    });
  };

  var throttledWalletServiceEvent = lodash.throttle(function(n, wallet) {
    newWalletServiceEvent(n, wallet);
  }, 10000);

  function newWalletServiceEvent(n, wallet) {
    if (wallet.cachedStatus) {
      wallet.cachedStatus.isValid = false;
    }

    if (wallet.completeHistory) {
      wallet.completeHistory.isValid = false;
    }

    if (wallet.cachedActivity) {
      wallet.cachedActivity.isValid = false;
    }

    if (wallet.cachedTxps) {
      wallet.cachedTxps.isValid = false;
    }

    $rootScope.$emit('walletServiceEvent', wallet.id, n.type, n);
  };

  function shouldSkipValidation(walletId) {
    return profile.isChecked(platformInfoService.ua, walletId) || isIOS;
  };

  function getWalletServiceUrl(credentials) {
    var config = configService.getSync();
    var defaults = configService.getDefaults();
    var networkName = credentials.networkName;
    var walletServicePreference = walletService.getPreferences(credentials.walletId).walletService;
    if (walletServicePreference) {
      return walletService.getPreferences(credentials.walletId).walletService.url;
    } else {
      return defaults.networkPreferences[networkName].walletService.url;
    }
  };

  function seedWallet(opts, cb) {
    var config = configService.getSync();
    opts = opts || {};
    var walletClient = networkService.walletClient({
      currency: opts.network.currency,
      walletServiceUrl: opts.walletService.url
    });

    if (opts.mnemonic) {
      try {
        opts.mnemonic = normalizeMnemonic(opts.mnemonic);
        walletClient.seedFromMnemonic(opts.mnemonic, {
          networkName: opts.network.name,
          passphrase: opts.passphrase,
          account: opts.account || 0,
          derivationStrategy: opts.derivationStrategy || 'BIP44',
        });

      } catch (ex) {
        $log.error(ex);
        return cb(gettextCatalog.getString('Could not create: Invalid wallet recovery phrase.'));
      }
    } else if (opts.extendedPrivateKey) {
      try {
        walletClient.seedFromExtendedPrivateKey(opts.extendedPrivateKey);
      } catch (ex) {
        $log.error(ex);
        return cb(gettextCatalog.getString('Could not create using the specified extended private key.'));
      }
    } else if (opts.extendedPublicKey) {
      try {
        walletClient.seedFromExtendedPublicKey(opts.extendedPublicKey, opts.externalSource, opts.entropySource, {
          account: opts.account || 0,
          derivationStrategy: opts.derivationStrategy || 'BIP44',
        });
        walletClient.credentials.hwInfo = opts.hwInfo;
      } catch (ex) {
        $log.error("Could not create wallet from Extended Public Key Arg:", ex, opts);
        return cb(gettextCatalog.getString('Could not create using the specified extended public key.'));
      }
    } else {
      var lang = uxLanguageService.getCurrentLanguage();
      try {
        walletClient.seedFromRandomWithMnemonic({
          networkName: opts.network.name,
          passphrase: opts.passphrase,
          language: lang,
          account: 0,
        });
      } catch (e) {
        $log.error('Error creating recovery phrase: ' + e.message);
        if (e.message.indexOf('language') > 0) {
          $log.info('Using default language for recovery phrase');
          walletClient.seedFromRandomWithMnemonic({
            networkName: opts.network.name,
            passphrase: opts.passphrase,
            account: 0,
          });
        } else {
          return cb(e);
        }
      }
    }

    return cb(null, walletClient);
  };

  // Creates a wallet on the walletService
  function doCreateWallet(opts, cb) {
    var showOpts = lodash.clone(opts);
    if (showOpts.extendedPrivateKey) {
      showOpts.extendedPrivateKey = '[hidden]';
    }
    if (showOpts.mnemonic) {
      showOpts.mnemonic = '[hidden]';
    }

    $log.debug('Creating Wallet:', showOpts);
    
    $timeout(function() {
      seedWallet(opts, function(err, walletClient) {
        if (err) {
          return cb(err);
        }

        var name = opts.name || gettextCatalog.getString('Personal Wallet');
        var myName = opts.myName || gettextCatalog.getString('me');

        walletClient.createWallet(name, myName, opts.m, opts.n, {
          networkName: opts.network.name,
          singleAddress: opts.singleAddress,
          walletPrivKey: opts.walletPrivKey,
        }, function(err, secret) {
          if (err) {
            return errorService.cb(err, gettextCatalog.getString('Error creating wallet.'), cb);
          }
          return cb(null, walletClient, secret);
        });
      });
    }, 50);
  };

  // Adds and bind a new wallet client to the profile
  function addAndBindWalletClient(walletClient, opts, cb) {
    if (!walletClient || !walletClient.credentials) {
      return cb(gettextCatalog.getString('Could not access wallet.'));
    }

    var walletId = walletClient.credentials.walletId

    if (!profile.addWallet(JSON.parse(walletClient.export()))) {
      return cb(gettextCatalog.getString("Wallet already in {{appName}}.", {
        appName: appConfig.nameCase
      }));
    }

    var skipKeyValidation = shouldSkipValidation(walletId);
    if (!skipKeyValidation) {
      runValidation(walletClient);
    }

    bindWalletClient(walletClient);

    function saveWalletServicePreference(cb) {
      var defaults = configService.getDefaults();
      var defaultWalletService = defaults.networkPreferences[walletClient.networkName].walletService;
      var walletService = opts.walletService || defaultWalletService;

      // Don't save the default
      if (walletService.url != defaultWalletService.url) {
        walletService.setPreference(walletId, 'walletService', walletService, function() {
          if (err) {
            $log.error(err);
          }
          return cb();
        });
      } else {
        return cb();
      }
    };

    saveWalletServicePreference(function() {
      storageService.storeProfile(profile, function(err) {
        return cb(err, walletClient);
      });
    });
  };

  // Adds a wallet client to profileService
  function bindWalletClient(wallet, opts) {
    var opts = opts || {};
    var walletId = wallet.credentials.walletId;

    if ((wallets[walletId] && wallets[walletId].started) && !opts.force) {
      return false;
    }

    // INIT WALLET VIEWMODEL
    wallet.id = walletId;
    wallet.started = true;
    wallet.doNotVerifyPayPro = false;
    wallet.currency = wallet.credentials.currency;
    wallet.networkName = wallet.credentials.networkName;
    wallet.copayerId = wallet.credentials.copayerId;
    wallet.m = wallet.credentials.m;
    wallet.n = wallet.credentials.n;

    updateWalletSettings(wallet);

    wallets[walletId] = wallet;

    needsBackup(wallet, function(val) {
      wallet.needsBackup = val;
    });

    balanceIsHidden(wallet, function(val) {
      wallet.balanceHidden = val;
    });

    wallet.removeAllListeners();

    wallet.on('report', function(n) {
      $log.info('Wallet Client Report (' + wallet.networkName + '):' + n);
    });

    wallet.on('notification', function(n) {
      $log.debug('Wallet Client Notification (' + wallet.networkName + '):', n);
      newWalletServiceEvent(n, wallet);
    });

    wallet.on('walletCompleted', function() {
      $log.debug('Wallet completed (' + wallet.networkName + ')');

      root.updateCredentials(JSON.parse(wallet.export()), function() {
        $rootScope.$emit('Local/WalletCompleted', walletId);
      });
    });

    wallet.initialize({
      notificationIncludeOwn: true
    }, function(err) {
      if (err) {
        $log.error('Could not init notifications err:', err);
        return;
      }
      wallet.setNotificationsInterval(UPDATE_PERIOD);
      wallet.openWallet(function(err) {
        if (wallet.status !== true) {
          $log.debug('Wallet + ' + walletId + ' status:' + wallet.status)
        }
      });
    });

    $rootScope.$on('Local/SettingsUpdated', function(e, walletId) {
      if (!walletId || walletId == wallet.id) {
        $log.debug('Updating settings for wallet:' + wallet.id);
        updateWalletSettings(wallet);
      }
    });

    return true;
  };    

  function runValidation(walletClient, delay, retryDelay) {
    delay = delay || 500;
    retryDelay = retryDelay || 50;

    if (validationLock) {
      return $timeout(function() {
        $log.debug('ValidatingWallet Locked: Retrying in: ' + retryDelay);
        return runValidation(walletClient, delay, retryDelay);
      }, retryDelay);
    }
    validationLock = true;

    // IOS devices are already checked
    var skipDeviceValidation = isIOS || profile.isDeviceChecked(platformInfoService.ua);
    var walletId = walletClient.credentials.walletId;

    $log.debug('ValidatingWallet: ' + walletId + ' skip Device:' + skipDeviceValidation);
    $timeout(function() {
      walletClient.validateKeyDerivation({
        skipDeviceValidation: skipDeviceValidation,
      }, function(err, isOK) {
        validationLock = false;

        $log.debug('ValidatingWallet End:  ' + walletId + ' isOK:' + isOK);
        if (isOK) {
          profile.setChecked(platformInfoService.ua, walletId);
        } else {
          $log.error('Key Derivation failed for wallet:' + walletId);
          storageService.clearLastAddress(walletId, function() {});
        }

        root.storeProfileIfDirty();
      });
    }, delay);
  };

  function bindProfile(p, cb) {
    profile = p;

    function bindWallets(cb) {
      var l = profile.credentials.length;
      var i = 0,
        totalBound = 0;

      if (!l) {
        return cb();
      }

      lodash.each(profile.credentials, function(credentials) {
        bindWallet(credentials, function(err, bound) {
          i++;
          totalBound += bound;
          if (i == l) {
            $log.info('Bound ' + totalBound + ' out of ' + l + ' wallets');
            return cb();
          }
        });
      });
    };

    bindWallets(function() {
      isBound = true;

      lodash.each(availableCallbacks, function(x) {
        $timeout(function() {
          return x();
        }, 1);
      });
      availableCallbacks = [];

      root.isDisclaimerAccepted(function(val) {
        if (!val) {
          return cb(new Error('NONAGREEDDISCLAIMER: Non agreed disclaimer'));
        }
        return cb();
      });
    });
  };

  // Used when reading wallets from the profile
  function bindWallet(credentials, cb) {
    if (!credentials.walletId || !credentials.m) {
      return cb('bindWallet should receive credentials JSON');
    }

    // Create the wallet client
    var walletClient = networkService.walletClient({
      currency: credentials.currency,
      walletServiceUrl: getWalletServiceUrl(credentials),
      credentials: JSON.stringify(credentials)
    });

    var skipKeyValidation = shouldSkipValidation(credentials.walletId);
    if (!skipKeyValidation) {
      runValidation(walletClient, 500);
    }

    $log.info('Binding wallet:' + credentials.walletId + ' Validating?:' + !skipKeyValidation);
    return cb(null, bindWalletClient(walletClient));
  };

  function setMetaData(data, cb) {
    if (data.addressBook) {
      addressBookService.list(function(err, localAddressBook) {
        if (err) {
          $log.error(err);
        }
        var mergeAddressBook = data.addressBook.concat(localAddressBook);
        addressBookService.setAddressbook(mergeAddressBook, function(err, ab) {
          if (err) {
            return cb(err);
          }
          return cb(null);
        });
      });    
    }
  };

  function normalizeMnemonic(words) {
    if (!words || !words.indexOf) {
      return words;
    }
    var isJA = words.indexOf('\u3000') > -1;
    var wordList = words.split(/[\u3000\s]+/);

    return wordList.join(isJA ? '\u3000' : ' ');
  };

  function getLastKnownBalance(wid, cb) {
    storageService.getBalanceCache(wid, cb);
  };

  function addLastKnownBalance(wallet, cb) {
    var now = Math.floor(Date.now() / 1000);
    var showRange = 600; // 10min;

    getLastKnownBalance(wallet.id, function(err, data) {
      if (data) {
        data = JSON.parse(data);
        wallet.cachedBalance = data.balance;
        wallet.cachedBalanceUpdatedOn = (data.updatedOn < now - showRange) ? data.updatedOn : null;
      }
      return cb();
    });
  };

  return root;
});
