'use strict';
angular.module('owsWalletApp.pluginModel').factory('PluginCatalog', function ($log, lodash, pluginCatalog, storageService, appConfig, pluginSchema, jsonValidatorService) {

  var _instance;

  // Constructor
  //
  function PluginCatalog(cb) {
    var self = this;
    get(function(err, catalog) {
      lodash.assign(self, catalog);
      _instance = self;
      cb(err, _instance);
    });
  };

  // Static methods
  //
  PluginCatalog.getInstance = function() {
    if (!_instance) {
      throw new Error('PluginCatalog has not been created, call constructor before getInstance()');
    }
    return _instance;
  };

  PluginCatalog.supportsWriting = function() {
    return storageService.fileStorageAvailable();
  }

  PluginCatalog.getStorageRoot = function() {
    return storageService.getApplicationDirectory();
  };

  // Public methods
  //
  PluginCatalog.prototype.checkEntry = function(id) {
    // Throws exception if not found.
    this.getEntry(id);
  };

  PluginCatalog.prototype.getEntry = function(id) {
    if (!this.plugins[id]) {
      throw new Error('Could not find plugin with id \'' + id + '\'');
    }
    return this.plugins[id];
  };

  PluginCatalog.prototype.getUIPlugins = function() {
    return lodash.filter(Object.keys(this.plugins), function(id) {
      return this.plugins[id].type == 'ui';
    });
  };

  PluginCatalog.prototype.getServiceApi = function(id) {
    return this.getEntry(id).serviceApi;
  };

  // Private methods
  //
  function get(cb) {
    storageService.getPluginCatalog(function(err, storedCatalog) {
      if (storedCatalog) {
        var catalogCache = JSON.parse(storedCatalog);
        $log.debug('Plugin catalog read:', catalogCache);

        // Check the existing catalog and upgrade if needed.  Detect a revision in the app to
        // force a possible need to upgrade.
        if (catalogCache.lastSavedAppVersion != appConfig.version) {
          var upgrades = upgradeCatalog(catalogCache);
          if (upgrades.length > 0) {
            return set(catalogCache, cb, {replace: true});
          }
        }

        return cb(err, catalogCache);

      } else {
        $log.debug('Initializing plugin catalog from app configuration');
        return set(pluginCatalog, cb);
      }
    });
  };

  function set(newCat, cb, opts) {
    opts = opts || {};
    var catalog = {
      lastSavedAppVersion: appConfig.version
    };

    storageService.getPluginCatalog(function(err, oldCat) {
      if (lodash.isString(oldCat)) {
        if (oldCat.length == 0)
          oldCat = '{}';
        oldCat = JSON.parse(oldCat);
      }
      if (lodash.isString(catalog)) {
        catalog = JSON.parse(catalog);
      }
      if (lodash.isString(newCat)) {
        newCat = JSON.parse(newCat);
      }
      if (opts.replace) {
        lodash.assign(catalog, oldCat, newCat);
      } else {
        lodash.merge(catalog, oldCat, newCat);
      }

      // Before saving, validate schema and reject any invalid entries.
      rejectInvalid(catalog);

      storageService.storePluginCatalog(JSON.stringify(catalog), function(err) {
        cb(err, catalog);
      });
    });
  };

  function rejectInvalid(catalog) {
    // This method mutates catalog by removing invalid entries.
    var rejected = [];

    Object.keys(catalog.plugins).forEach(function(id) {
      var result = jsonValidatorService.validate(catalog.plugins[id], pluginSchema);
      if (!lodash.isEmpty(result)) {
        delete catalog.plugins[id];
        rejected.push({
          id: id,
          reason: result
        });
      }
    });

    if (rejected.length > 0) {
      $log.debug('The following items were rejected by the PluginCatalog as being invalid:');
      for (var i=0; i < rejected.length; i++) {
        $log.debug('id = ' + rejected[i].id + '\nreason = ' + rejected[i].reason);
      }
    }

    jsonValidatorService.clean();
    return rejected;
  };

  function upgradeCatalog(catalog) {
    // This method mutates catalog by performing various upgrade tasks.
    var upgrades = [];

    // Upgrade existing plugins.
    Object.keys(catalog.plugins).forEach(function(id) {
      // Upgrade only for higher version numbers.
      if (pluginCatalog.plugins[id] && (pluginCatalog.plugins[id].header.version.localeCompare(catalog.plugins[id].header.version) > 0)) {
        // Replace the catalog version with the new version.
        catalog.plugins[id] = pluginCatalog.plugins[id];

        upgrades.push({
          id: id,
          action: 'upgrade',
          to: pluginCatalog.plugins[id].header.version,
          from: catalog.plugins[id].header.version
        });
      }
    });

    // Add new plugins.
    Object.keys(pluginCatalog.plugins).forEach(function(id) {
      if (catalog.plugins[id] === undefined) {
        catalog.plugins[id] = pluginCatalog.plugins[id];

        upgrades.push({
          id: id,
          action: 'add'
        });
      }
    });

    if (upgrades.length > 0) {
      $log.debug('The following items were upgrades by the PluginCatalog:');
      for (var i=0; i < upgrades.length; i++) {
        var msg = 'id = ' + upgrades[i].id + '\naction = ' + upgrades[i].action;
        if (upgrades[i].to) {
          msg += '\nFrom = ' + upgrades[i].from + '\nTo = ' + upgrades[i].to;
        }
        $log.debug(msg);
      }
    }

    return upgrades;
  };

  return PluginCatalog;
});
