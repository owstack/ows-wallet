'use strict';

angular.module('owsWalletApp.services').factory('configService', function(storageService, lodash, $log, $timeout, $rootScope, networkService, appConfig) {
  var root = {};

  var defaultConfig = {
    // Wallet limits
    limits: {
      totalCopayers: 10,
      mPlusN: 100
    },

    // Wallet default config
    wallet: {
      requiredCopayers: 2,
      totalCopayers: 3,
      spendUnconfirmed: false,
      reconnectDelay: 5000,
      idleDurationMin: 4,
      settings: {}
    },

    // User preferences
    walletPreferences: {
    },

    currencyNetworks: networkService.defaultConfig(),

    lock: {
      method: null,
      value: null,
      bannedUntil: null
    },

    recentTransactions: {
      enabled: true
    },

    featureWeight: {
      value: 0
    },

    hideApplets: {
      enabled: false
    },

    advancedKeypad: {
      enabled: false
    },

    release: {
      url: appConfig.gitHubRepoApiLatestReleases
    },

    pushNotificationsEnabled: true,

    confirmedTxsNotifications: {
      enabled: true
    },

    emailNotifications: {
      enabled: false
    },

    log: {
      filter: 'debug'
    },

    appNavigation: {
      scheme: appConfig.appNavigationScheme
    },

    theme: {
      id: null
    },

    view: {
      themeGalleryLayout: 'grid',
      appletGalleryLayout: 'grid',
      skinGalleryLayout: 'grid',
    },

    experiments: {
      showMenu: false,
      walletLayout: {
        enabled: false
      }
    }
  };

  var configCache = null;

  root.getSync = function() {
    if (!configCache)
      throw new Error('configService#getSync called when cache is not initialized');

    return configCache;
  };

  root._queue = [];
  root.whenAvailable = function(cb) {
    if (!configCache) {
      root._queue.push(cb);
      return;
    }
    return cb(configCache);
  };

  root.get = function(cb) {
    storageService.getConfig(function(err, localConfig) {
      if (localConfig) {
        configCache = JSON.parse(localConfig);

        // To avoid migration problems...
        if (!configCache.currencyNetworks) {
          configCache.currencyNetworks = defaultConfig.currencyNetworks;
        } else {
          // Ensures new networks are added
          lodash.merge(configCache.currencyNetworks, defaultConfig.currencyNetworks);
        }

        if (!configCache.wallet) {
          configCache.wallet = defaultConfig.wallet;
        }
        if (!configCache.hideApplets) {
          configCache.hideApplets = defaultConfig.hideApplets;
        }
        if (!configCache.advancedKeypad) {
          configCache.advancedKeypad = defaultConfig.advancedKeypad;
        }
        if (!configCache.recentTransactions) {
          configCache.recentTransactions = defaultConfig.recentTransactions;
        }
        if (!configCache.featureWeight) {
          configCache.featureWeight = defaultConfig.featureWeight;
        }
        if (!configCache.pushNotifications) {
          configCache.pushNotifications = defaultConfig.pushNotifications;
        }
        if (!configCache.walletPreferences) {
          configCache.walletPreferences = defaultConfig.walletPreferences;
        }
        if (!configCache.appNavigation) {
          configCache.appNavigation = defaultConfig.appNavigation;
        }
        if (!configCache.experiments) {
          configCache.experiments = defaultConfig.experiments;
        }

      } else {
        configCache = lodash.clone(defaultConfig);
      };

      $log.debug('Preferences read:', configCache)

      lodash.each(root._queue, function(x) {
        $timeout(function() {
          return x(configCache);
        }, 1);
      });
      root._queue = [];

      return cb(err, configCache);
    });
  };

  root.set = function(newOpts, cb) {
    var config = lodash.cloneDeep(defaultConfig);
    storageService.getConfig(function(err, oldOpts) {
      oldOpts = oldOpts || {};

      if (lodash.isString(oldOpts)) {
        oldOpts = JSON.parse(oldOpts);
      }
      if (lodash.isString(config)) {
        config = JSON.parse(config);
      }
      if (lodash.isString(newOpts)) {
        newOpts = JSON.parse(newOpts);
      }

      lodash.merge(config, oldOpts, newOpts);
      configCache = config;

      $rootScope.$emit('Local/SettingsUpdated');

      storageService.storeConfig(JSON.stringify(config), cb);
    });
  };

  root.reset = function(cb) {
    configCache = lodash.clone(defaultConfig);
    storageService.removeConfig(cb);
  };

  root.getDefaults = function() {
    return lodash.clone(defaultConfig);
  };


  return root;
});
