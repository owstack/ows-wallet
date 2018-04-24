'use strict';
angular.module('owsWalletApp.pluginModel').factory('ThemeCatalog', function ($log, lodash, themeCatalog, storageService, appConfig, themeSchema, skinSchema, jsonValidatorService) {

  var _instance;

  // Constructor
  //
  function ThemeCatalog() {
    throw new Error('ThemeCatalog is a singleton class, call create()');
  };

  // Static methods
  //
  ThemeCatalog.create = function(cb) {
    var self = this;
    get(function(err, catalog) {
      lodash.assign(self, catalog);
      _instance = self;
      cb(err, _instance);
    });
  };

  ThemeCatalog.getInstance = function() {
    if (!_instance) {
      throw new Error('ThemeCatalog has not been created, call constructor before getInstance()');
    }
    return _instance;
  };

  ThemeCatalog.supportsWriting = function() {
    return storageService.fileStorageAvailable();
  }

  ThemeCatalog.getStorageRoot = function() {
    return storageService.getApplicationDirectory();
  };

  // Public methods
  //
  ThemeCatalog.prototype.checkEntry = function(id) {
    // Throws exception if not found.
    this.getEntry(id);
  };

  ThemeCatalog.prototype.getEntry = function(id) {
    if (!this.themes[id]) {
      throw new Error('Could not find theme catalog entry with id \'' + id + '\'');
    }
    return this.themes[id];
  };

  ThemeCatalog.prototype.getThemes = function() {
    return this.themes;
  };

  // Private methods
  //
  function get(cb) {
    storageService.getThemeCatalog(function(err, storedCatalog) {
      if (storedCatalog) {
        var catalogCache = JSON.parse(storedCatalog);
        $log.debug('Theme catalog read:', catalogCache);

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
        $log.debug('Initializing theme catalog from app configuration');
        return set(themeCatalog, cb);
      }
    });
  };

  function set(newCat, cb, opts) {
    opts = opts || {};
    var catalog = {
      lastSavedAppVersion: appConfig.version
    };

    storageService.getThemeCatalog(function(err, oldCat) {
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

      storageService.storeThemeCatalog(JSON.stringify(catalog), function(err) {
        cb(err, catalog);
      });
    });
  };

  function rejectInvalid(catalog) {
    // This method mutates catalog by removing invalid entries.
    var rejected = [];

    Object.keys(catalog.themes).forEach(function(id) {
      var result = jsonValidatorService.validate(catalog.themes[id], themeSchema);
      if (!lodash.isEmpty(result)) {
        delete catalog.themes[id];
        rejected.push({
          id: id,
          reason: result
        });
      }
    });

    Object.keys(catalog.skins).forEach(function(id) {
      var result = jsonValidatorService.validate(catalog.skins[id], skinSchema);
      if (!lodash.isEmpty(result)) {
        delete catalog.skins[id];
        rejected.push({
          id: id,
          reason: result
        });
      }
    });

    if (rejected.length > 0) {
      $log.debug('The following items were rejected by the ThemeCatalog as being invalid:');
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

    // Upgrade existing themes.
    Object.keys(catalog.themes).forEach(function(id) {
      // Upgrade only for higher version numbers.
      if (themeCatalog.themes[id] && (themeCatalog.themes[id].header.version.localeCompare(catalog.themes[id].header.version) > 0)) {
        // Replace the catalog version with the new version.
        catalog.themes[id] = themeCatalog.themes[id];

        upgrades.push({
          id: id,
          action: 'upgrade',
          to: themeCatalog.themes[id].header.version,
          from: catalog.themes[id].header.version
        });
      }
    });

    // Add new themes.
    Object.keys(themeCatalog.themes).forEach(function(id) {
      if (catalog.themes[id] === undefined) {
        catalog.themes[id] = themeCatalog.themes[id];

        upgrades.push({
          id: id,
          action: 'add'
        });
      }
    });

    // Upgrade existing skins.
    Object.keys(catalog.skins).forEach(function(id) {
      // Upgrade only for higher version numbers.
      if (themeCatalog.skins[id] && (themeCatalog.skins[id].header.version.localeCompare(catalog.skins[id].header.version) > 0)) {
        // Replace the catalog version with the new version.
        catalog.skins[id] = themeCatalog.skins[id];

        upgrades.push({
          id: id,
          action: 'upgrade',
          to: themeCatalog.skins[id].header.version,
          from: catalog.skins[id].header.version
        });
      }
    });

    // Add new skins.
    Object.keys(themeCatalog.skins).forEach(function(id) {
      if (catalog.skins[id] === undefined) {
        catalog.skins[id] = themeCatalog.skins[id];

        upgrades.push({
          id: id,
          action: 'add'
        });
      }
    });

    if (upgrades.length > 0) {
      $log.debug('The following items were upgrades by the ThemeCatalog:');
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

  return ThemeCatalog;
});
