'use strict';

angular.module('owsWalletApp.pluginServices').factory('pluginService', function($log, lodash, PluginCatalog, PluginStates, appletService) {
	var root = {};

  root.init = function(cb) {
    $log.info('Initializing plugin service');

    if (!PluginCatalog.supportsWriting()) {
      var err = 'Fatal: Plugin service initilization - device does not provide storage for plugins';
      $rootScope.$emit('Local/DeviceError', err);
      return;
    }

    new PluginCatalog(function(err, catalog) {
      if (err) {
        $log.debug('Error reading plugin catalog');
        $rootScope.$emit('Local/DeviceError', err);
        return;
      }

      new PluginStates(function(err, states) {
        if (err) {
          $log.debug('Error reading plugin states');
          $rootScope.$emit('Local/DeviceError', err);
          return;
        }

        createAppletContext(catalog, states, cb);
      });
    });
  };

  root.finalize = function() {
    $log.info('Finalizing plugin service');
    appletService.finalize();
  };

  function createAppletContext(catalog, states, cb) {
    var applets = lodash.pickBy(catalog.plugins, function(plugin) {
      return plugin.header.kind.includes('applet');
    });

    var context = {
      applets: applets,
      states: states
    };

    appletService.init(context, cb);
  };

  return root;
});
