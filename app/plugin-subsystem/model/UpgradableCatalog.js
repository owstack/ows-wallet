'use strict';
angular.module('owsWalletApp.pluginModel').factory('UpgradableCatalog', function ($log, lodash, appConfig, storageService, jsonValidatorService) {

  // Stores, retrieves, validates, and updates a catalog object with the following schema.
  //
  // catalog: {
  //   str1: '',
  //   str2: '',
  //   collectionName1: {
  //     id1: {
  //       header: {
  //         created: <number>,
  //         updated: <number>
  //       }
  //     },
  //     id2: {
  //       header: {
  //         created: <number>,
  //         updated: <number>
  //       }
  //     },
  //     ...
  //   },
  //   collectionName2: {
  //     id1: {
  //       header: {
  //         created: <number>,
  //         updated: <number>
  //       }
  //     },
  //     id2: {
  //       header: {
  //         created: <number>,
  //         updated: <number>
  //       }
  //     }
  //   },
  //   ...
  // }

  // Constructor
  //
  // obj should have the following schema.
  //
  // obj = {
  //   config: {
  //     startup: <boolean>,
  //     catalogUpgrades: <obj>
  //     collections: [{
  //       name: <string>,
  //       schema: <obj>
  //     }],
  //     storage: {
  //       get: <function>,
  //       set: <function>
  //     }
  //   }
  // }
  //
  // where,
  //
  // startup - shoukd be set true if calling for the first time (e.g., from a constructor).
  //
  // catalogUpgrades - a catalog that should be reconciled with the catalog in storage. If no catalog exists in storage
  // then this catalog is stored.
  //
  // colletions - a description of catalog collections; key names and schema expected at the key.
  //
  // storage - a getter and setter for catalog persistence. Function signature:
  //   fn(cb), where cb is a callback with the form fn(err, catalog)
  //
  // Catalog upgrades occur when the input catalog collection entry has a higher version number

  /**
   * Constructor (See https://medium.com/opinionated-angularjs/angular-model-objects-with-javascript-classes-2e6a067c73bc#.970bxmciz)
   */

  function UpgradableCatalog(config, cb) {
    var self = this;

    var _config = config;
    var _catalog = {};

    _config.catalogUpdates = {};

    // Retreive the catalog from storage and upgrade it if there are upgrades specified in the config.
    get(function(err) {
      upgrade(function(err) {
        cb(err, self);
      });
    });

    /**
     * Priviledged methods
     */

    // Upgrade the current catalog by applying the specified catalog upgrades.
    // Existing entries are upgraded if version numbers are higher. New entries are added.
    // Any invalid entries are rejected and will not be saved.
    this.upgrade = function(catalogUpgrades, cb) {
      _config.catalogUpgrades = catalogUpgrades;      
      upgrade(cb);
    };

    // Save the whole catalog.
    this.save = function(cb) {
      _config.catalogUpdates = {};
      _config.catalogUpdates = lodash.pickBy(this, function(value, key) {
        return typeof value != 'function';
      });

      set(cb);
    };

    // Save a list of collection entries. 'ids' is an array of entries or a single entry.
    this.saveByCollection = function(collectionName, ids, cb) {
      if (!Array.isArray(ids)) {
        ids = [ids];
      }
      _config.catalogUpdates[collectionName] = lodash.pick(this[collectionName], ids);

      update(cb);
    };

    // Updates one or more entries 'header.updated' value with the current date/time.
    this.timestampById = function(collectionName, ids, cb) {
      if (!Array.isArray(ids)) {
        ids = [ids];
      }
      _config.catalogUpdates[collectionName] = lodash.pick(this[collectionName], ids);

      var now = new Date().getTime();
      lodash.forEach(_config.catalogUpdates[collectionName], function(entry) {
        entry.header.updated = now;
      });

      update(cb);
    };

    // Create convenience functions for each catalog collection.
    // 
    // ids = A single string id or an array of id strings in the applet collection.
    var fname;
    lodash.forEach(_config.collections, function(collection) {

      // save<collection-name>
      fname = createFnName('save', collection.name);
      self[fname] = function(ids, cb) {
        self.saveByCollection(collection.name, ids, cb);
      };

      // timestamp<collection-name>
      fname = createFnName('timestamp', collection.name);
      self[fname] = function(ids, cb) {
        self.timestampById(collection.name, ids, cb);
      };

    });

    /**
     * Private methods
     */

    // Retrieve the catalog from the file system and set our private copy.
    function get(cb) {
      _config.storage.get(function(err, storedCatalog) {
        if (storedCatalog) {
          storedCatalog = JSON.parse(storedCatalog);
          lodash.assign(_catalog, storedCatalog);
          $log.debug('Catalog read: ', storedCatalog);
        }
        // Expose a copy of the catalog publicly.
        lodash.assign(self, lodash.cloneDeep(_catalog));

        return cb(err);
      });
    };

    function upgrade(cb) {
      // Check and upgrade _catalog entries.
      if (!lodash.isEmpty(_config.catalogUpgrades)) {
        var upgrades = upgradeCatalog(_config.catalogUpgrades);

        // The catalog upgrades are no longer needed.
        delete _config.catalogUpgrades;

        if (upgrades.length > 0) {
          return set(cb);
        }
      }

      // Nothing to do.
      return cb();
    };

    // Apply updates to the the private copy of our catalog and save the catalog to the file system.
    function update(cb) {
      lodash.merge(_catalog, _config.catalogUpdates);
      return set(cb);
    };

    // Save the private copy of our catalog to the file system.
    function set(cb, opts) {
      opts = opts || {};

      var newCat = _catalog;
      var catalog = {
        lastSavedAppVersion: appConfig.version
      };

      _config.storage.get(function(err, oldCat) {
        if (lodash.isString(oldCat)) {
          if (oldCat.length == 0)
            oldCat = '{}';
          oldCat = JSON.parse(oldCat);
        }
        if (opts.replace) {
          lodash.assign(catalog, oldCat, newCat);
        } else {
          lodash.merge(catalog, oldCat, newCat);
        }

        // Before saving, validate schema and reject any invalid entries.
        rejectInvalid(catalog);

        _config.storage.set(JSON.stringify(catalog), function(err) {
          // Assign the saved catalog to our private copy and expose publicly.
          lodash.assign(_catalog, catalog);
          lodash.assign(self, lodash.cloneDeep(_catalog));
          cb(err);
        });
      });
    };

    function rejectInvalid(catalog) {
      // This method mutates catalog by removing invalid entries.
      var rejected = [];

      lodash.forEach(_config.collections, function(collection) {
        if (!catalog[collection.name]) {
          return; // Skip empty collections
        }

        Object.keys(catalog[collection.name]).forEach(function(id) {
          var entry = catalog[collection.name][id];
          var result = jsonValidatorService.validate(catalog[collection.name][id], collection.schema);
          if (!lodash.isEmpty(result)) {
            delete catalog[collection.name][id];
            rejected.push({
              id: id,
              reason: result
            });
          }
        });

      });

      if (rejected.length > 0) {
        $log.debug('Invalid catalog entries in ' + _config.name + ' (thrown out): ');
        for (var i=0; i < rejected.length; i++) {
          $log.debug('id = ' + rejected[i].id + '\nreason = ' + rejected[i].reason);
        }
      }

      jsonValidatorService.clean();
      return rejected;
    };

    // Upgrade the _catalog using the specified catalog.
    function upgradeCatalog(catalogUpgrades, opts) {
      opts = opts || {
        upgradeOp: 'replace'
      };

      // No upgrades during startup unless the app version has changed.
      if (_config.startup && _catalog.lastSavedAppVersion == appConfig.version) {
        _config.startup = false;
        return [];
      }

      // This method mutates _catalog by performing various upgrade tasks.
      var upgrades = [];
      var now = new Date().getTime();

      // Upgrade catalog strings.
      lodash.forEach(_config.strings, function(str) {
        if (catalogUpgrades[str]) {
          upgrades.push({
            id: str,
            action: (_catalog[str] ? 'replace' : 'add')
          });

          _catalog[str] = catalogUpgrades[str];
        }
      });

      // Upgrade each collection in the catalog.
      lodash.forEach(_config.collections, function(collection) {
        // Ensure the catalog contains an entry for each collection, even if it is empty.
        _catalog[collection.name] = _catalog[collection.name] || {};

        Object.keys(catalogUpgrades[collection.name]).forEach(function(id) {
          var entry = _catalog[collection.name] && _catalog[collection.name][id];
          var candidateEntry = catalogUpgrades[collection.name][id];

          if (entry) {
            // Cannot upgrade entries without a version id.
            if (!entry.header.version) {
              return;
            }

            // Upgrade existing entry only for higher version numbers.
            var currentVersion = entry.header.version;
            if (entry && (candidateEntry.header.version.localeCompare(currentVersion) > 0)) {
              switch (opts.upgradeOp) {
                case 'replace':
                  // Replace the catalog entry with the new entry.
                  entry = candidateEntry;
                break;

                case 'merge':
                  // Merge the catalog entry with the new entry.
                  lodash.merge(entry, candidateEntry);
                break;

                default:
                  $log.error('Unknown upgrade operation in ' + _config.name + ': ' + opts.upgradeOp);
                break;
              };

              entry.header.updated = now;

              upgrades.push({
                id: id,
                action: 'upgrade: ' + opts.upgradeOp,
                to: entry.header.version,
                from: currentVersion
              });
            }
          } else {
            // Add new entry.
            _catalog[collection.name][id] = candidateEntry;
            _catalog[collection.name][id].header.created = now;
            _catalog[collection.name][id].header.updated = now;

            upgrades.push({
              id: id,
              action: 'add'
            });
          }
        });

      });

      if (upgrades.length > 0) {
        $log.debug(_config.name + ' upgrades:');
        for (var i=0; i < upgrades.length; i++) {
          var msg = 'id = ' + upgrades[i].id + ', action = ' + upgrades[i].action;
          if (upgrades[i].to) {
            msg += ', From = ' + upgrades[i].from + '\nTo = ' + upgrades[i].to;
          }
          $log.debug(msg);
        }
      }

      return upgrades;
    };

    function createFnName(prefix, string) {
      return prefix + string.charAt(0).toUpperCase() + string.slice(1);
    };

  };

  /**
   * Static methodsß
   */

  UpgradableCatalog.supportsWriting = function() {
    return storageService.fileStorageAvailable();
  }

  UpgradableCatalog.getStorageRoot = function() {
    return storageService.getApplicationDirectory();
  };

  UpgradableCatalog.inheritStaticMethods = function(obj) {
    // Assign UpgradableCatalog static methods.
    Object.getOwnPropertyNames(UpgradableCatalog).filter(function (p) {
      if (typeof UpgradableCatalog[p] === 'function') {
        obj[p] = UpgradableCatalog[p];
      }
    });
  };

  return UpgradableCatalog;
});
