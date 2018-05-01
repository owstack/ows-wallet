'use strict';

angular.module('owsWalletApp.pluginServices').factory('pluginService', function($log, lodash, PluginCatalog, PluginState, appletService, apiService) {
	var root = {};

  // Read the plugin catalog and reconcile any upgrades or changes. Store the changed catalog if necessary.
  // Read plugin state.
  // Initialize the applet service with context (applets and state).
  // Initialize the service delegate with context (services and state).
  // Initialize the plugin api.
  // 
  root.init = function(cb) {
    $log.info('Initializing plugin service');

    if (!PluginCatalog.supportsWriting()) {
      var err = 'Fatal: Plugin service initilization - device does not provide storage for plugins';
      $rootScope.$emit('Local/DeviceError', err);
      return;
    }

    PluginCatalog.getInstance(function(err, catalog) {
      if (err) {
        $log.debug('Error reading plugin catalog');
        $rootScope.$emit('Local/DeviceError', err);
        return;
      }

      PluginState.getInstance(function(err, state) {
        if (err) {
          $log.debug('Error reading plugin state');
          $rootScope.$emit('Local/DeviceError', err);
          return;
        }

        initAppletContext(catalog, state, function() {
          initServiceContext(catalog, state, function() {
            apiService.init(cb);
          });
        });
      });
    });
  };

  root.finalize = function() {
    $log.info('Finalizing plugin service');
    appletService.finalize();
    // TODO - finalize services
  };

  function initAppletContext(catalog, state, cb) {
    var applets = lodash.pickBy(catalog.plugins, function(plugin) {
      return plugin.header.kind.includes('applet');
    });

    var context = {
      applets: applets,
      state: state
    };

    appletService.init(context, cb);
  };

  function initServiceContext(catalog, state, cb) {
    var services = lodash.pickBy(catalog.plugins, function(plugin) {
      return plugin.header.kind.includes('service');
    });

    var context = {
      services: services,
      state: state
    };

    // TODO
    cb();
  };

  return root;
});
