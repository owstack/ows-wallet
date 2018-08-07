'use strict';

angular.module('owsWalletApp.pluginServices').factory('pluginService', function($rootScope, $log, lodash, PluginCatalog, PluginState, appletService, servletService, apiService, pluginSessionService) {
	var root = {};

  $rootScope.$on('Local/IncomingAppURL', function(e, data) {
    // Broadcast as an event to all plugins.
    root.broadcastEvent({
      name: 'incoming-data',
      data: data
    });
  });

  // Read the plugin catalog and reconcile any upgrades or changes. Store the changed catalog if necessary.
  // Read plugin state.
  // Initialize the applet and servlet services with context (applets and state).
  // Initialize the plugin api.
  // 
  root.init = function() {
    return new Promise(function(resolve, reject) {
      $log.debug('Initializing plugin service');

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
    $log.debug('Finalizing plugin service');
    appletService.finalize();
    servletService.finalize();
    pluginSessionService.finalize();
    // TODO - finalize services
  };

  root.getPluginsWithStateByIdSync = function(pluginId) {
    var filter = [{
      key: 'header.id',
      value: pluginId
    }];

    var plugins = root.getPluginsWithStateSync(filter);
    return plugins[0];
  };

  root.getPluginsWithStateSync = function(filter) {
    var plugins = root.getAppletsWithStateSync(filter);
    plugins = lodash.concat(plugins, root.getServletsWithStateSync(filter));
    return plugins;
  };

  root.getAppletsWithStateSync = function(filter) {
    return appletService.getAppletsWithStateSync(filter);
  };

  root.getServletsWithStateSync = function(filter) {
    return servletService.getServletsWithStateSync(filter);
  };

  // Get each of the parent plugins for the single provided plugin.
  root.getParentPluginsFor = function(plugin, opts) {
    opts = opts || {};

    var plugins = root.getPluginsWithStateSync();

    return lodash.filter(plugins, function(p) {
      // It's a parent if the dependency name and version match mine.
      if (p.dependencies && p.dependencies[plugin.header.id]) {

        if (!opts.ignoreVersion) {
          return (getVersion(p.dependencies[plugin.header.id]) == plugin.header.version);
        }
        return true;
      }
      return false;
    });
  };

  // Get each of the dependent plugins for the single provided plugin.
  root.getDependentPluginsOf = function(plugin, opts) {
    opts = opts || {};

    var dependents = [];
    if (!plugin.dependencies) {
      return dependents;
    }

    // Go through each of the input plugin dependencies and fetch the dependent plugin by id and version.
    lodash.forEach(Object.keys(plugin.dependencies), function(id) {
      var filter = [{
        key: 'header.id',
        value: id
      }];

      if (!opts.ignoreVersion) {
        filter.push({
          key: 'header.version',
          value: getVersion(plugin.dependencies[id])
        });
      }

      var dependent = root.getPluginsWithStateSync(filter)[0];
      if (dependent) {
        dependents.push(dependent);
      }
    });
    return dependents;
  };

  // Get each of the parent plugins for a each plugin in the provided list of plugins.
  root.getParents = function(plugins) {
    // listParents = [{
    //   my: {},         // subject plugin
    //   plugins: []     // parent plugins
    // }]
    //
    var listParents = [];
    lodash.forEach(plugins, function(plugin) {

      // Look at each installation of this plugin and get a list of it's parents.
      var parents = root.getParentPluginsFor(plugin);
      if (parents.length > 0) {
        listParents.push({
          my: plugin,
          plugins: parents
        });
      }
    });
    return listParents;
  };

  // Get each of the dependent plugins for a each plugin in the provided list of plugins.
  root.getDependents = function(plugins) {
    // listDependents = [{
    //   my: {},         // subject plugin
    //   plugins: []     // dependent plugins
    // }]
    //
    var listDependents = [];
    lodash.forEach(plugins, function(plugin) {
      var dependents = root.getDependentPluginsOf(plugin);
      if (dependents.length > 0) {
        listDependents.push({
          my: plugin,
          plugins: dependents
        });
      }
    });
    return listDependents;
  };

  // Send event to all plugin sessions.
  root.broadcastEvent = function(event) {
    pluginSessionService.broadcastEvent(event);
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

  function getVersion(dependency) {
    // Get version from package version id.
    // Remove any special characters in the semver string.
    return Object.values(dependency.package)[0].replace(/[^\d\.]/gi, '');
  };

  return root;
});
