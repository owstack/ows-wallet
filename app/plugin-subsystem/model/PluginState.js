'use strict';
angular.module('owsWalletApp.pluginModel').factory('PluginState', function ($log, lodash, Constants, UpgradableCatalog, storageService, appletEnvironmentStateSchema, appletCategoryStateSchema, appletStateSchema, servletStateSchema, appConfig, PluginCatalog) {

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
      appletCategory: [],
      servlet: []
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
      }, {
        name: 'servlet',
        schema: servletStateSchema,
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
   * Public functions
   */

  UpgradableCatalog.inherit(PluginState);

  PluginState.create = function() {
    var self = this;
    return new Promise(function(resolve, reject) {
      if (!_instance) {
        createInstance(self, function(err, catalog) {
          if (err) {
            return reject(err);
          }
          _instance = catalog;
          resolve(_instance);
        });
      }
    });
  };

  PluginState.getInstance = function() {
    if (!_instance) {
      throw new Error('PluginState.getInstance() called before creation');
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

  PluginState.getData = function(pluginId, cb) {
    storageService.getValueByKey(pluginId, function(err, data) {
      if (data) {
        data = JSON.parse(data);
      } else {
        data = {};
      }
      $log.debug('Plugin data read (' + pluginId + '):', data);
      return cb(err, data);
    });
  };

  PluginState.setData = function(pluginId, newData, cb) {
    storageService.getValueByKey(pluginId, function(err, oldData) {
      oldData = oldData || {};
      if (lodash.isString(oldData)) {
        if (oldData.length == 0)
          oldData = '{}';
        oldData = JSON.parse(oldData);
      }
      if (lodash.isString(newData)) {
        newData = JSON.parse(newData);
      }
      var data = oldData;
      lodash.merge(data, newData);
      storageService.storeValueByKey(pluginId, JSON.stringify(data), function(err) {
        if (err) {
          return cb(err);
        }
        auditOperation(pluginId, cb);
      });
    });
  };

  PluginState.removeData = function(pluginId, dataKey, cb) {
    storageService.getValueByKey(pluginId, function(err, oldData) {
      oldData = oldData || {};
      if (lodash.isString(oldData)) {
        if (oldData.length == 0) {
          oldData = '{}';
        }
        oldData = JSON.parse(oldData);
      }
      var data = oldData;
      delete data[dataKey];
      storageService.storeValueByKey(pluginId, JSON.stringify(data), function(err) {
        if (err) {
          return cb(err);
        }
        auditOperation(pluginId, cb);
      });
    });
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

  PluginState.getServletStateTemplate = function() {
    return {
      'header': {
        'created': '',
        'updated': '',
        'version': appConfig.version
      },
      'preferences': {
      }
    };
  };

  /**
   * Private functions
   */

  function auditOperation(pluginId, cb) {
    switch (PluginCatalog.getInstance().plugins[pluginId].header.kind) {
      case 'applet': return PluginState.getInstance().timestampApplet(pluginId, cb); break;
      case 'servlet': return PluginState.getInstance().timestampServlet(pluginId, cb); break;
    }
  };

  return PluginState;
});
