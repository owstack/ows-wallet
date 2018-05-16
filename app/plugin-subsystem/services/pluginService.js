'use strict';

angular.module('owsWalletApp.pluginServices').factory('pluginService', function($rootScope, $log, lodash, PluginCatalog, PluginState, appletService, servletService, apiService, pluginSessionService) {
	var root = {};

  // Read the plugin catalog and reconcile any upgrades or changes. Store the changed catalog if necessary.
  // Read plugin state.
  // Initialize the applet and servlet services with context (applets and state).
  // Initialize the plugin api.
  // 
  root.init = function() {
    return new Promise(function(resolve, reject) {
      $log.info('Initializing plugin service');

      if (!PluginCatalog.supportsWriting()) {
        $log.error('Plugin service initilization - device does not provide storage for plugins');
        return;
      }

      var context = {};

      PluginCatalog.create().then(function(catalog) {
        context.catalog = catalog;
        return PluginState.create();

      }).then(function(state) {
        context.state = state;

        // Remove states for plugins no longer in the plugin catalog.
        PluginState.clean();
        return;

      }).then(function() {
        return initAppletContext(context);

      }).then(function() {
        return initServletContext(context);

      }).then(function() {
        apiService.init();
        resolve();

      }).catch(function(error) {
        $log.error('Error initializing plugin service: ' + error);
        reject();

      });
    });
  };

  root.finalize = function() {
    $log.info('Finalizing plugin service');
    appletService.finalize();
    servletService.finalize();
    pluginSessionService.finalize();
    // TODO - finalize services
  };

  function initAppletContext(ctx) {
    var applets = lodash.pickBy(ctx.catalog.plugins, function(plugin) {
      return plugin.header.kind == 'applet';
    });

    var context = {
      applets: applets,
      state: ctx.state
    };

    return appletService.init(context);
  };

  function initServletContext(ctx) {
    var servlets = lodash.pickBy(ctx.catalog.plugins, function(plugin) {
      return plugin.header.kind == 'servlet';
    });

    var context = {
      servlets: servlets,
      state: ctx.state
    };

    return servletService.init(context);
  };

  return root;
});
