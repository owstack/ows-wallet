'use strict';

angular.module('owsWalletApp.pluginServices').factory('pluginService', function($log, lodash, PluginCatalog, PluginStates, appletService, apiService) {
	var root = {};

  // Read the plugin catalog and reconcile any upgrades or changes. Store the changed catalog if necessary.
  // Read plugin states.
  // Initialize the applet service with context (applets and states).
  // Initialize the service delegate with context (services and states).
  // Initialize the plugin api.
  // 
  root.init = function(cb) {
    $log.info('Initializing plugin service');

    if (!PluginCatalog.supportsWriting()) {
      var err = 'Fatal: Plugin service initilization - device does not provide storage for plugins';
      $rootScope.$emit('Local/DeviceError', err);
      return;
    }

    PluginCatalog.create(function(err, catalog) {
      if (err) {
        $log.debug('Error reading plugin catalog');
        $rootScope.$emit('Local/DeviceError', err);
        return;
      }

      PluginStates.create(function(err, states) {
        if (err) {
          $log.debug('Error reading plugin states');
          $rootScope.$emit('Local/DeviceError', err);
          return;
        }

        initAppletContext(catalog, states, function() {
          initServiceContext(catalog, states, function() {
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

  function initAppletContext(catalog, states, cb) {
    var applets = lodash.pickBy(catalog.plugins, function(plugin) {
      return plugin.header.kind.includes('applet');
    });

    var context = {
      applets: applets,
      states: states
    };

    appletService.init(context, cb);
  };

  function initServiceContext(catalog, states, cb) {
    var services = lodash.pickBy(catalog.plugins, function(plugin) {
      return plugin.header.kind.includes('service');
    });

    var context = {
      services: services,
      states: states
    };

    // TODO
    cb();
  };

  return root;
});
