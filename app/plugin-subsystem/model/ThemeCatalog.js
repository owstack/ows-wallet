'use strict';
angular.module('owsWalletApp.pluginModel').factory('ThemeCatalog', function (UpgradableCatalog, storageService, themeCatalog, themeSchema, skinSchema) {

  var _instance;

  // Constructor
  //
  function ThemeCatalog() {
    throw new Error('ThemeCatalog is a singleton, use getInstance()');
  };

  function createInstance(cb) {
    var config = {
      startup: true,
      name: 'ThemeCatalog',
      catalogUpgrades: themeCatalog,
      strings: [
        'defaultThemeId'
      ],
      collections: [{
        name: 'themes',
        schema: themeSchema
      }, {
        name: 'skins',
        schema: skinSchema
      }],
      storage: {
        get: storageService.getThemeCatalog,
        set: storageService.storeThemeCatalog
      }
    };

    return new UpgradableCatalog(config, cb);
  };

  // Static methods
  //
  ThemeCatalog.getInstance = function(cb) {
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
  UpgradableCatalog.inheritStaticMethods(ThemeCatalog);

  return ThemeCatalog;
});
