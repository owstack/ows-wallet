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
  //     source: ['build' | <url>]
  //     catalogUpgrades: <obj>
  //     collections: [{
  //       name: <string>,
  //       schema: <obj>
  //       reconcile: (optional, default true) <boolean>
  //       upgradeOp: (optional, default 'assign') ['merge' | 'assign']
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
  // source - the originating source of the upgrade data (i.e., was it included in build or was it downloaded from a URL)
  //
  // catalogUpgrades - a catalog that should be reconciled with the catalog in storage. If no catalog exists in storage
  // then this catalog is stored.
  //
  // collections - a description of catalog collections; key names and schema expected at the key.
  //   name - the name of the collection (an object key in the collection)
  //   schema - an object defining the JSON schema for a collection entry
  //   reconcile - if false then no entries will be removed even if the source does not include them
  //   upgradeOp - the upgrade operation to peform on collection entries
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
    var _lastSavedAppVersion; // Cache this to allow reconcile() and update() to write changes if needed.

    _config.catalogUpdates = {};

    // Retreive the catalog from storage, upgrade and reconcile it if there are upgrades specified in the config.
    // Reconciliation only occurs on catalog construction.
    // Note: The order of upgrade() and then reconcile() is important (merge vs. assign).
    var requireSave = false;

    get().then(function() {
      return upgrade();

    }).then(function(save) {
      requireSave = requireSave || save;
      return reconcile();

    }).then(function(save) {
      requireSave = requireSave || save;

      if (requireSave) {
        return set();
      }
      //cb();
      return;

    }).then(function() {
      // The catalog upgrades are no longer needed.
      delete _config.catalogUpgrades;

      cb(null, self);

    }).catch(function(err) {
      cb(err);

    });

    /**
     * Priviledged methods
     */

    // Upgrade the current catalog by applying the specified catalog upgrades.
    // Existing entries are upgraded if version numbers are higher. New entries are added.
    // Any invalid entries are rejected and will not be saved.
    this.upgrade = function(catalogUpgrades, cb) {
      cb = cb || function(){};

      _config.catalogUpgrades = catalogUpgrades;      
      upgrade.then(function() {
        // The catalog upgrades are no longer needed.
        delete _config.catalogUpgrades;

        cb();
      }).catch(function(err) {
        cb(err);
      });
    };

    // Save the whole catalog.
    this.save = function(cb) {
      cb = cb || function(){};

      // Only the private copy of the catalog is saved; copy public values to private.
      _catalog = {};
      _catalog = lodash.pickBy(this, function(value, key) {
        return typeof value != 'function';
      });

      set().then(function() {
        cb();
      }).catch(function(err) {
        cb(err);
      });
    };

    // Save a list of collection entries. 'ids' is an array of entries or a single entry.
    this.saveByCollection = function(collectionName, ids, cb) {
      cb = cb || function(){};

      if (!Array.isArray(ids)) {
        ids = [ids];
      }
      _config.catalogUpdates[collectionName] = lodash.pick(this[collectionName], ids);

      update().then(function() {
        cb();
      }).catch(function(err) {
        cb(err);
      });
    };

    // Updates one or more entries 'header.updated' value with the current date/time.
    this.timestampById = function(collectionName, ids, cb) {
      cb = cb || function(){};

      if (!Array.isArray(ids)) {
        ids = [ids];
      }
      _config.catalogUpdates[collectionName] = lodash.pick(this[collectionName], ids);

      var now = new Date().getTime();
      lodash.forEach(_config.catalogUpdates[collectionName], function(entry) {
        entry.header.updated = now;
      });

      update().then(function() {
        cb();
      }).catch(function(err) {
        cb(err);
      });
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
    function get() {
      return new Promise(function(resolve, reject) {
        _config.storage.get(function(err, storedCatalog) {
          if (err) {
            return reject(err);
          }

          if (storedCatalog) {
            storedCatalog = JSON.parse(storedCatalog);
            lodash.assign(_catalog, storedCatalog);
            $log.debug('Catalog read: ', storedCatalog);
          }
          // Expose a copy of the catalog publicly.
          lodash.assign(self, lodash.cloneDeep(_catalog));

          // Cache for testing against.
          _lastSavedAppVersion = _catalog.lastSavedAppVersion;

          resolve();
        });
      });
    };

    function reconcile() {
      return new Promise(function(resolve, reject) {
        var requireSave = false;

        // Check and reconcile _catalog entries.
        if (!lodash.isEmpty(_config.catalogUpgrades)) {

          // Upgrades may come from a build process or from a runtime download process.
          // Upgrades coming from a build process must reconcile the catalog to allow for catalog entries
          // to be removed due to omitting them in the build process.
          // If an entries exists in our stored catalog but does not exist in the upgrades then it will be
          // deleted from our stored catalog.

          var reconciliations = [];
          if (lodash.get(_config, 'source') == 'build') {
            reconciliations = reconcileCatalog(_config.catalogUpgrades);
          }

          requireSave = (reconciliations.length > 0);
        }

        resolve(requireSave);
      });
    };

    function upgrade() {
      return new Promise(function(resolve, reject) {
        var requireSave = false;

        // Check and upgrade _catalog entries.
        if (!lodash.isEmpty(_config.catalogUpgrades)) {

          // Process normal version upgrades.
          var upgrades = upgradeCatalog(_config.catalogUpgrades);

          requireSave = (upgrades.length > 0);
        }

        resolve(requireSave);
      });
    };

    // Apply updates to the the private copy of our catalog and save the catalog to the file system.
    function update() {
      return new Promise(function(resolve, reject) {
        lodash.merge(_catalog, _config.catalogUpdates);

        set().then(function() {
          resolve();
        }).catch(function(err) {
          reject(err);
        });
      });
    };

    // Save the private copy of our catalog to the file system.
    function set() {
      return new Promise(function(resolve, reject) {
        // Before saving, validate schema and reject any invalid entries.
        rejectInvalid(_catalog);

        _catalog.lastSavedAppVersion = appConfig.version;

        _config.storage.set(JSON.stringify(_catalog), function(err) {
          if (err) {
            return reject(err);
          }

          // Expose the saved catalog publicly.
          lodash.assign(self, lodash.cloneDeep(_catalog));
          resolve();
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
          $log.debug('id = ' + rejected[i].id + '\nreason = ' + JSON.stringify(rejected[i].reason));
        }
      }

      jsonValidatorService.clean();
      return rejected;
    };

    // Reconcile the stored catalog entries with the specified catalog upgrades.
    // Remove entries from our stored catalog that do not exist in the upgrades list.
    function reconcileCatalog(catalogUpgrades) {
      // This method mutates _catalog by performing various reconciliation tasks.
      var reconciliations = [];
      var exemptStrings = ['lastSavedAppVersion'];

      // Catalog Strings
      //
      // All catalog strings are reconciled (catalog strings can only be added through the build upgrade process).
      var strings = lodash.filter(Object.keys(_catalog), function(k) {
        return (typeof _catalog[k] == 'string' && exemptStrings.indexOf(k) < 0);
      });

      lodash.forEach(strings, function(s) {
        // If the catalog string is not in the upgrades then delete it from our stored catalog.
        if (!catalogUpgrades[s]) {
          delete _catalog[s];

          reconciliations.push({
            collection: 'root',
            entry: s,
            action: 'delete'
          });
        }
      });

      // Catalog Collections
      //
      // Get a list of the collections in our stored catalog.
      var collections = lodash.filter(Object.keys(_catalog), function(k) {
        return (typeof _catalog[k] == 'object');
      });

      lodash.forEach(collections, function(collection) {

        // Do not reconcile collections that opt out. Default value is true.
        var reconcile;
        var col = lodash.find(_config.collections, function(c) {
          return c.name == collection;
        });

        if (col) {
          reconcile = col.reconcile;
        }

        if (lodash.isUndefined(reconcile)) {
          reconcile = true;
        }

        if (!reconcile) {
          return;
        }

        Object.keys(_catalog[collection]).forEach(function(id) {

          // If the catalog entry source stated in our stored catalog is 'build' and the entry does not exist in 
          // the upgrades then delete the entry from our stored catalog.
          if (_catalog[collection][id].source == 'build' && (!catalogUpgrades[collection] || !catalogUpgrades[collection][id])) {
            delete _catalog[collection][id];

            reconciliations.push({
              collection: collection,
              entry: id,
              action: 'delete'
            });
          }
        });
      });

      if (reconciliations.length > 0) {
        $log.debug(_config.name + ' reconciliations:');
        for (var i=0; i < reconciliations.length; i++) {
          var msg = 'entry=' + reconciliations[i].collection + '/' + reconciliations[i].entry + ' action=' + reconciliations[i].action;
          $log.debug(msg);
        }
      } else {
        $log.debug(_config.name + ': no reconciliations');        
      }

      return reconciliations;
    };

    // Upgrade the _catalog using the specified catalog.
    function upgradeCatalog(catalogUpgrades) {
      // No upgrades during startup unless the app version has changed.
      if (_config.startup && _lastSavedAppVersion == appConfig.version && !appConfig.isDevelopmentMode) {
        $log.debug(_config.name + ': no upgrades');
        _config.startup = false;
        return [];
      }

      // This method mutates _catalog by performing various upgrade tasks.
      var upgrades = [];
      var now = new Date().getTime();

      // Catalog Strings
      //
      // Upgrade catalog strings.
      lodash.forEach(_config.strings, function(str) {
        if (_catalog[str] != catalogUpgrades[str]) {
          upgrades.push({
            collection: 'root',
            entry: str,
            action: (_catalog[str] ? 'replace' : 'add')
          });

          _catalog[str] = catalogUpgrades[str];
        }
      });

      // Catalog Collections
      //
      // Upgrade each collection in the catalog.
      lodash.forEach(_config.collections, function(collection) {
        // Ensure the catalog contains an entry for each collection, log upgrade if it is new.
        if (lodash.isUndefined(_catalog[collection.name])) {
          // Add a new collection.
          upgrades.push({
            collection: collection.name,
            entry: '',
            action: 'add'
          });
        }
        _catalog[collection.name] = _catalog[collection.name] || {};

        // Set the upgrade operation for this collection. Default is 'replace'.
        var opts = {
          upgradeOp: collection.upgradeOp || 'replace'
        };

        Object.keys(catalogUpgrades[collection.name]).forEach(function(id) {
          var entry = {};
          var originalEntry = {};
          if (_catalog[collection.name]) {
            entry = _catalog[collection.name][id];
            originalEntry = lodash.cloneDeep(_catalog[collection.name][id]);
          }

          var candidateEntry = catalogUpgrades[collection.name][id];

          if (entry) {
            // Cannot upgrade entries without a version id.
            if (!entry.header.version) {
              return;
            }

            // Upgrade existing entry only for higher version numbers.
            var currentVersion = entry.header.version;
            if ((semverCompare(candidateEntry.header.version, currentVersion) > 0) || appConfig.isDevelopmentMode) {

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
                  $log.warn('Unknown upgrade operation in ' + _config.name + ': ' + opts.upgradeOp);
                break;
              };

              entry.header.updated = now;
              entry.header.created = originalEntry.header.created; // Preserve created timestamp through upgrade.

              // Update the catalog.
              _catalog[collection.name][id] = entry;

              upgrades.push({
                collection: collection.name,
                entry: id,
                action: 'upgrade:' + opts.upgradeOp,
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
              collection: collection.name,
              entry: id,
              action: 'add'
            });
          }
        });

      });

      if (upgrades.length > 0) {
        $log.debug(_config.name + ' upgrades:');
        for (var i=0; i < upgrades.length; i++) {
          var msg = 'entry=' + upgrades[i].collection + '/' + upgrades[i].entry + ' action=' + upgrades[i].action;
          if (upgrades[i].to) {
            msg += ' From=' + upgrades[i].from + ' To=' + upgrades[i].to;
          }
          $log.debug(msg);
        }
      } else {
        $log.debug(_config.name + ': no upgrades');
      }

      return upgrades;
    };

    function createFnName(prefix, str) {
      return lodash.camelCase(prefix + '-' + str);
    };

    // See https://www.npmjs.com/package/semver-compare
    // a > b, return 1
    // a < b, return -1
    // a == b, return 0
    function semverCompare (a, b) {
      var pa = a.split('.');
      var pb = b.split('.');
      for (var i = 0; i < 3; i++) {
        var na = Number(pa[i]);
        var nb = Number(pb[i]);
        if (na > nb) return 1;
        if (nb > na) return -1;
        if (!isNaN(na) && isNaN(nb)) return 1;
        if (isNaN(na) && !isNaN(nb)) return -1;
      }
      return 0;
    };
  };

  /**
   * Public functions
   */

  UpgradableCatalog.supportsWriting = function() {
    return storageService.fileStorageAvailable();
  }

  UpgradableCatalog.getStorageRoot = function() {
    return storageService.getApplicationDirectory();
  };

  UpgradableCatalog.inherit = function(obj) {
    // Assign UpgradableCatalog public functions.
    Object.getOwnPropertyNames(UpgradableCatalog).filter(function (p) {
      if (typeof UpgradableCatalog[p] === 'function') {
        obj[p] = UpgradableCatalog[p];
      }
    });
  };

  return UpgradableCatalog;
});
