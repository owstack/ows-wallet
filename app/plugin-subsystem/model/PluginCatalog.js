'use strict';
angular.module('owsWalletApp.pluginModel').factory('PluginCatalog', function (UpgradableCatalog, storageService, pluginCatalog, pluginSchema) {

  var _instance;

  /**
   * Constructor (See https://medium.com/opinionated-angularjs/angular-model-objects-with-javascript-classes-2e6a067c73bc#.970bxmciz)
   */

  function PluginCatalog() {
    throw new Error('PluginCatalog is a singleton, use getInstance()');
  };

  function createInstance(cb) {
    var config = {
      startup: true,
      source: 'build',
      name: 'PluginCatalog',
      catalogUpgrades: pluginCatalog,
      strings: [],
      collections: [{
        name: 'plugins',
        schema: pluginSchema
      }],
      storage: {
        get: storageService.getPluginCatalog,
        set: storageService.storePluginCatalog
      }
    };

    return new UpgradableCatalog(config, cb);
  };

  /**
   * Public functions
   */

  UpgradableCatalog.inherit(PluginCatalog);

  PluginCatalog.create = function() {
    return new Promise(function(resolve, reject) {
      if (!_instance) {
        createInstance(function(err, catalog) {
          if (err) {
            return reject(err);
          }
          _instance = catalog;
          resolve(_instance);
        });
      }
    });
  };

  PluginCatalog.getInstance = function() {
    if (!_instance) {
      throw new Error('PluginState.getInstance() called before creation');
    }
    return _instance;
  };

  return PluginCatalog;
});
