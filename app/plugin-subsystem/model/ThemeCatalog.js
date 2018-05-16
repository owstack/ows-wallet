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
   * Public functions
   */

  UpgradableCatalog.inherit(ThemeCatalog);

  ThemeCatalog.create = function() {
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

  ThemeCatalog.getInstance = function() {
    if (!_instance) {
      throw new Error('ThemeCatalog.getInstance() called before creation');
    }
    return _instance;
  };

  return ThemeCatalog;
});
