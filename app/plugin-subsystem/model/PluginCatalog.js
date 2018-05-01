'use strict';
angular.module('owsWalletApp.pluginModel').factory('PluginCatalog', function (UpgradableCatalog, storageService, pluginCatalog, pluginSchema) {

  var _instance;

  // Constructor
  //
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

  // Static methods
  //
  PluginCatalog.getInstance = function(cb) {
    if (!_instance) {
      createInstance(function(err, catalog) {
        _instance = catalog;
        cb(err, _instance);
      });
    }
    return _instance;
  };

  // Static methods
  //
  UpgradableCatalog.inheritStaticMethods(PluginCatalog);

  return PluginCatalog;
});
