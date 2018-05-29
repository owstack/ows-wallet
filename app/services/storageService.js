'use strict';
angular.module('owsWalletApp.services').factory('storageService', function($log, $timeout, lodash, Profile, fileStorageService, localStorageService, platformInfoService) {

  var root = {};
  var storage;

  // Check for File System API support.
  window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
  var fileSystemAPISupported = (typeof window.requestFileSystem != 'undefined');

  // File storage is not supported for writing according to
  // https://github.com/apache/cordova-plugin-file/#supported-platforms
  var shouldUseFileStorage = platformInfoService.isCordova;

  if (shouldUseFileStorage) {
    $log.info('Using: FileStorage');
    storage = fileStorageService;
  } else {
    $log.info('Using: LocalStorage');
    storage = localStorageService;
  }

  root.fileStorageAvailable = function() {
    return fileSystemAPISupported;
  };

  root.getApplicationDirectory = function() {
    if (shouldUseFileStorage) {
      return fileStorageService.getAppDir();
    } else {
      return '';
    }
  };

  root.createProfile = function(profile, cb) {
    storage.create('profile', profile.toObj(), cb);
  };

  root.storeProfile = function(profile, cb) {
    storage.set('profile', profile.toObj(), cb);
  };

  root.getProfile = function(cb) {
    storage.get('profile', function(err, str) {
      if (err || !str) {
        return cb(err);
      }

      var p, err;
      try {
        p = Profile.fromString(str);
      } catch (e) {
        $log.error('Could not read profile:', e);
        err = new Error('Could not read profile:' + p);
      }
      return cb(err, p);
    });
  };

  root.deleteProfile = function(cb) {
    storage.remove('profile', cb);
  };

  root.setFeedbackInfo = function(feedbackValues, cb) {
    storage.set('feedback', feedbackValues, cb);
  };

  root.getFeedbackInfo = function(cb) {
    storage.get('feedback', cb);
  };

  root.getLastAddress = function(walletId, cb) {
    storage.get('lastAddress-' + walletId, cb);
  };

  root.storeLastAddress = function(walletId, address, cb) {
    storage.set('lastAddress-' + walletId, address, cb);
  };

  root.clearLastAddress = function(walletId, cb) {
    storage.remove('lastAddress-' + walletId, cb);
  };

  root.setBackupFlag = function(walletId, cb) {
    storage.set('backup-' + walletId, Date.now(), cb);
  };

  root.getBackupFlag = function(walletId, cb) {
    storage.get('backup-' + walletId, cb);
  };

  root.clearBackupFlag = function(walletId, cb) {
    storage.remove('backup-' + walletId, cb);
  };

  root.getConfig = function(cb) {
    storage.get('config', cb);
  };

  root.storeConfig = function(val, cb) {
    storage.set('config', val, cb);
  };

  root.clearConfig = function(cb) {
    storage.remove('config', cb);
  };

  root.getTipWalletReadyAccepted = function(cb) {
    storage.get('tipWalletReady', cb);
  };

  root.setTipWalletReadyAccepted = function(val, cb) {
    storage.set('tipWalletReady', val, cb);
  };

  root.setHideBalanceFlag = function(walletId, val, cb) {
    storage.set('hideBalance-' + walletId, val, cb);
  };

  root.getHideBalanceFlag = function(walletId, cb) {
    storage.get('hideBalance-' + walletId, cb);
  };

  root.setAddressbook = function(addressbook, cb) {
    storage.set('addressbook', addressbook, cb);
  };

  root.getAddressbook = function(cb) {
    storage.get('addressbook', cb);
  };

  root.removeAddressbook = function(cb) {
    storage.remove('addressbook', cb);
  };

  root.setLastCurrencyUsed = function(lastCurrencyUsed, networkURI, cb) {
    storage.set('lastCurrencyUsed-' + networkURI, lastCurrencyUsed, cb)
  };

  root.getLastCurrencyUsed = function(networkURI, cb) {
    storage.get('lastCurrencyUsed-' + networkURI, cb)
  };

  root.setTxHistory = function(txs, walletId, cb) {
    try {
      storage.set('txsHistory-' + walletId, txs, cb);
    } catch (e) {
      $log.error('Error saving tx History. Size:' + txs.length);
      $log.error(e);
      return cb(e);
    }
  }

  root.getTxHistory = function(walletId, cb) {
    storage.get('txsHistory-' + walletId, cb);
  }

  root.removeTxHistory = function(walletId, cb) {
    storage.remove('txsHistory-' + walletId, cb);
  }

  root.setBalanceCache = function(walletId, data, cb) {
    storage.set('balanceCache-' + walletId, data, cb);
  };

  root.getBalanceCache = function(walletId, cb) {
    storage.get('balanceCache-' + walletId, cb);
  };

  root.removeBalanceCache = function(walletId, cb) {
    storage.remove('balanceCache-' + walletId, cb);
  };

  root.setAppIdentity = function(networkURI, data, cb) {
    storage.set('appIdentity-' + networkURI, data, cb);
  };

  root.getAppIdentity = function(networkURI, cb) {
    storage.get('appIdentity-' + networkURI, function(err, data) {
      if (err) return cb(err);
      cb(err, JSON.parse(data || '{}'));
    });
  };

  root.removeAppIdentity = function(networkURI, cb) {
    storage.remove('appIdentity-' + networkURI, cb);
  };

  root.removeAllWalletData = function(walletId, cb) {
    root.clearLastAddress(walletId, function(err) {
      if (err) return cb(err);
      root.removeTxHistory(walletId, function(err) {
        if (err) return cb(err);
        root.clearBackupFlag(walletId, function(err) {
          return cb(err);
        });
      });
    });
  };

  root.setTxConfirmNotification = function(txid, val, cb) {
    storage.set('txConfirmNotif-' + txid, val, cb);
  };

  root.getTxConfirmNotification = function(txid, cb) {
    storage.get('txConfirmNotif-' + txid, cb);
  };

  root.removeTxConfirmNotification = function(txid, cb) {
    storage.remove('txConfirmNotif-' + txid, cb);
  };

  // Theme catalog service requires fileStorageService.
  root.getThemeCatalog = function(cb) {
    if (!fileSystemAPISupported) {
      throw new Error('storageService#getThemeCatalog called when storage service does not support it');
    }
    fileStorageService.get('themeCatalog', cb);
  };

  root.storeThemeCatalog = function(val, cb) {
    if (!fileSystemAPISupported) {
      throw new Error('storageService#storeThemeCatalog called when storage service does not support it');
    }
    fileStorageService.set('themeCatalog', val, cb);
  };

  root.clearThemeCatalog = function(cb) {
    if (!fileSystemAPISupported) {
      throw new Error('storageService#clearThemeCatalog called when storage service does not support it');
    }
    fileStorageService.remove('themeCatalog', cb);
  };

  // Plugin catalog service requires fileStorageService.
  root.getPluginCatalog = function(cb) {
    if (!fileSystemAPISupported) {
      throw new Error('storageService#getPluginCatalog called when storage service does not support it');
    }
    fileStorageService.get('pluginCatalog', cb);
  };

  root.storePluginCatalog = function(val, cb) {
    if (!fileSystemAPISupported) {
      throw new Error('storageService#storePluginCatalog called when storage service does not support it');
    }
    fileStorageService.set('pluginCatalog', val, cb);
  };

  root.clearPluginCatalog = function(cb) {
    if (!fileSystemAPISupported) {
      throw new Error('storageService#clearPluginCatalog called when storage service does not support it');
    }
    fileStorageService.remove('pluginCatalog', cb);
  };

  // Plugin state requires fileStorageService.
  root.getPluginState = function(cb) {
    if (!fileSystemAPISupported) {
      throw new Error('storageService#getPluginState called when storage service does not support it');
    }
    fileStorageService.get('pluginState', cb);
  };

  root.storePluginState = function(val, cb) {
    if (!fileSystemAPISupported) {
      throw new Error('storageService#storePluginState called when storage service does not support it');
    }
    fileStorageService.set('pluginState', val, cb);
  };

  // KV storage service requires fileStorageService.
  // Each unique key creates a new file.  It is the responsibility of the caller manage storage and
  // to remove files (keys) no longer needed.
  root.getValueByKey = function(key, cb) {
    if (!fileSystemAPISupported) {
      throw new Error('storageService#getValueByKey called when storage service does not support it');
    }
    fileStorageService.get(key, cb);
  };

  root.storeValueByKey = function(key, val, cb) {
    if (!fileSystemAPISupported) {
      throw new Error('storageService#storeValueByKey called when storage service does not support it');
    }
    fileStorageService.set(key, val, cb);
  };

  root.removeValueByKey = function(key, cb) {
    if (!fileSystemAPISupported) {
      throw new Error('storageService#removeValueByKey called when storage service does not support it');
    }
    fileStorageService.remove(key, cb);
  };

  return root;
});
