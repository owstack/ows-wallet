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
   * Static methods
   */

  UpgradableCatalog.inheritStaticMethods(PluginCatalog);

  PluginCatalog.getInstance = function(cb) {
    if (!_instance) {
      createInstance(function(err, catalog) {
        _instance = catalog;
        cb(err, _instance);
      });
    }
    return _instance;
  };

  return PluginCatalog;
});
