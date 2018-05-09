'use strict';
angular.module('owsWalletApp.pluginModel').factory('PluginState', function ($log, Constants, UpgradableCatalog, storageService, appletEnvironmentStateSchema, appletCategoryStateSchema, appletStateSchema, appConfig, PluginCatalog) {

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

    // This catalog should not reconcile differences with catalog upgrades.
    // Use merge upgrades in order to preserve the state data.
    var config = {
      startup: true,
      source: 'build',
      name: 'PluginState',
      catalogUpgrades: initialState,
      strings: [],
      collections: [{
        name: 'environment',
        schema: appletEnvironmentStateSchema,
        reconcile: false,
        upgradeOp: 'merge'
      }, {
        name: 'applet',
        schema: appletStateSchema,
        reconcile: false,
        upgradeOp: 'merge'
      }, {
        name: 'appletCategory',
        schema: appletCategoryStateSchema,
        reconcile: false,
        upgradeOp: 'merge'
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

  // Remove states and data for applets not in our catalog.
  PluginState.clean = function() {
    var appletStates = PluginState.getInstance().applet;
    var plugins = PluginCatalog.getInstance().plugins;
    var requiresSave = false;
    
    Object.keys(appletStates).forEach(function(id) {
      if (!plugins[id]) {

        // Remove the state information.
        delete appletStates[id];

        // Remove the applet data file.
        storageService.removeValueByKey(id, function(err) {
          $log.debug('Could not remove applet data storage for ' + id + ': ' + err);
        });

        requiresSave = true;
      }
    });

    if (requiresSave) {
      PluginState.getInstance().save();
    }
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
