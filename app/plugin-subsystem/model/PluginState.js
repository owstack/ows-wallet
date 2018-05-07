'use strict';
angular.module('owsWalletApp.pluginModel').factory('PluginState', function (Constants, UpgradableCatalog, storageService, appletEnvironmentStateSchema, appletCategoryStateSchema, appletStateSchema, appConfig) {

  var _instance;

  /**
   * Constructor (See https://medium.com/opinionated-angularjs/angular-model-objects-with-javascript-classes-2e6a067c73bc#.970bxmciz)
   */

  function PluginState() {
    throw new Error('PluginState is a singleton, use getInstance()');
  };

  function createInstance(obj, cb) {
    var initialState = {
      environment: {
        default: obj.getAppletEnvironmentStateTemplate()
      },
      applet: [],
      appletCategory: []
    };

    var config = {
      startup: true,
      name: 'PluginState',
      catalogUpgrades: initialState,
      strings: [],
      collections: [{
        name: 'environment',
        schema: appletEnvironmentStateSchema
      }, {
        name: 'applet',
        schema: appletStateSchema
      }, {
        name: 'appletCategory',
        schema: appletCategoryStateSchema
      }],
      storage: {
        get: storageService.getPluginState,
        set: storageService.storePluginState
      }
    };

    return new UpgradableCatalog(config, cb);
  };

  /**
   * Static methods
   */

  UpgradableCatalog.inheritStaticMethods(PluginState);

  PluginState.getInstance = function(cb) {
    if (!_instance) {
      createInstance(this, function(err, catalog) {
        _instance = catalog;
        cb(err, _instance);
      });
    }
    return _instance;
  };

  PluginState.getAppletEnvironmentStateTemplate = function() {
    return {
      'header': {
        'created': '',
        'updated': '',
        'version': appConfig.version
      },
      'applet': {
        'presentation': Constants.APPLET_PRESENTATION_DEFAULT
      },
      'appletCategory': {
        'presentation': Constants.APPLET_CATEGORY_PRESENTATION_DEFAULT
      }
    };
  };

  PluginState.getAppletStateTemplate = function() {
    return {
      'header': {
        'created': '',
        'updated': '',
        'version': appConfig.version
      },
      'preferences': {
        'visible': true,
        'category': '',
        'layout': {
          'categoryList': {},
          'grid': {},
          'list': {}
        }
      }
    };
  };

  PluginState.getAppletCategoryStateTemplate = function() {
    return {
      'header': {
        'created': '',
        'updated': '',
        'version': appConfig.version
      },
      'preferences': {
        'visible': true,
        'layout': {
          'list': {}
        }
      }
    };
  };

  return PluginState;
});
