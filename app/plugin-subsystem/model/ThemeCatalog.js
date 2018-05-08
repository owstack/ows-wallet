'use strict';
angular.module('owsWalletApp.pluginModel').factory('ThemeCatalog', function (UpgradableCatalog, storageService, themeCatalog, themeSchema, skinSchema) {

  var _instance;

  /**
   * Constructor (See https://medium.com/opinionated-angularjs/angular-model-objects-with-javascript-classes-2e6a067c73bc#.970bxmciz)
   */

  function ThemeCatalog() {
    throw new Error('ThemeCatalog is a singleton, use getInstance()');
  };

  function createInstance(cb) {
    var config = {
      startup: true,
      source: 'build',
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

  /**
   * Static methods
   */

  UpgradableCatalog.inheritStaticMethods(ThemeCatalog);

  ThemeCatalog.getInstance = function(cb) {
    if (!_instance) {
      createInstance(function(err, catalog) {
        _instance = catalog;
        cb(err, _instance);
      });
    }
    return _instance;
  };

  return ThemeCatalog;
});
