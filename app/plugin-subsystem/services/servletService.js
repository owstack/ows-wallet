'use strict';

angular.module('owsWalletApp.pluginServices').factory('servletService', function($rootScope, $log, lodash, pluginSessionService, Servlet, PluginState) {

  var root = {};

  var servletsWithStateCache = [];
  var ctx;

  // Servlet state preferences
  var defaultServletPreferences = {
  };

  /**
   * Service state
   */

  // Set our context (plugins and state), init sub-services, and construct (get) all servlets.
  root.init = function(context) {
    return new Promise(function(resolve, reject) {
      $log.debug('Initializing servlet service');

      ctx = context;

      root.getServletsWithState({}, function(servlets) {
        $log.debug('Servlet service initialized');
        resolve();
      });
    });
  };

  root.finalize = function() {
    // Close any currently running servlets.
    var activeSession = pluginSessionService.getActiveSession();
    if (!lodash.isUndefined(activeSession)) {
      doCloseServlet(activeSession.id);
    }
  };

  root.startServlets = function(session, opts) {
    opts = opts || {};

    // Go through all plugin dependencies and start plugins that are servlets.
    session.plugin.dependencies = session.plugin.dependencies || {};
    var servletIds = Object.keys(session.plugin.dependencies);

    if (servletIds.length > 0) {
      $log.debug('Starting dependent servlets for ' + session.plugin.header.kind + ' \'' + session.plugin.header.name + '\'');
    }

    lodash.forEach(servletIds, function(id) {
      var start = true;
      if (opts.startMode) {
        // Default start mode is 'auto'.
        var pluginStartMode = lodash.get(session.plugin.dependencies[id], 'options.startMode', 'auto');
        start = (opts.startMode == pluginStartMode);
      }
  
      if (start) {
        var servlet = root.getServletWithStateById(id);

        // If the plugin id resolved a servlet then start it. Add the session for the servlet as a dependent of the owner.
        if (servlet) {
          startServlet(servlet).then(function(servletSession) {
            session.addDependent(servletSession);
          });
        } else {
          $log.debug('Servlet not found \'' + id + '\'');
        }
      }
    });
  };

  root.shutdownServlets = function(session) {
    // Need to process shutdowns for all session servlets before the session is destroyed.
    return new Promise(function(resolve, reject) {
      $log.debug('Shutting down servlets for ' + session.plugin.header.kind + ' \'' + session.plugin.header.name + '\'');

      // Go through all session dependencies and shutdown each.
      var dependentSessions = session.getDependents('servlet');

      lodash.forEach(dependentSessions, function(servletSessionId) {

        // TODO - this needs to be fixed, we're not filtering on kind of session..
        var servletSession = pluginSessionService.getSession(servletSessionId);
        shutdownServlet(servletSession).then(function() {
          session.removeDependent(servletSessionId);
        });
      });
      resolve();
    });
  };

  /**
   * Queries
   */

  root.getServletWithStateById = function(servletId) {
    var servlets = root.getServletsWithStateSync({
      id: servletId
    });
    return servlets[0];
  };

  root.getServletsWithStateSync = function(filter) {
    return filterServlets(servletsWithStateCache, filter);
  };

  // Return servlets after applying persistent state. Result may be filtered.
  // filter: {
  //   id: servlet id,
  // }
  root.getServletsWithState = function(filter, callback) {
    filter = filter || {};

    // Get all of the servlets.
    getServlets().then(function(servlets) {
      var state = ctx.state;
      var decoratedServlets;

      var ids = [];
      var now = new Date().getTime();

      // Find and add the servlet preferences to each servlet object.
      decoratedServlets = lodash.map(servlets, function(servlet) {
        state.servlet = state.servlet || {};

        var servletState = state.servlet[servlet.header.id] || {};
        if (lodash.isEmpty(servletState)) {
          servletState = PluginState.getServletStateTemplate();
          servletState.header.created = now;
          servletState.header.updated = now;

          state.servlet[servlet.header.id] = servletState;
          ids.push(servlet.header.id);
        }

        // Apply preferences from servlet state or set default value.
        //
        servlet.preferences = lodash.cloneDeep(defaultServletPreferences);
        lodash.merge(servlet.preferences, servletState.preferences);

        return servlet;
      });

      if (ids.length > 0) {
        state.saveServlet(ids, function(err) {
          if (err) {
            $rootScope.$emit('Local/DeviceError', err);
            return;
          }
        });
      }

      var filteredServlets = filterServlets(lodash.cloneDeep(decoratedServlets), filter);

      cacheServletsWithState(decoratedServlets);
      callback(filteredServlets);

    }).catch(function handleErrors(error) {
      $log.error('Failed to get servlets: ' + error);
      callback();
    });
  };

  /**
   * State
   */

  root.updateServletState = function(servlets, opts, callback) {
    opts = opts || {};
    callback = callback || function(){};

    var state = ctx.state;

    // Build the servlet state object for each servlet.
    var newState = lodash.map(servlets, function(servlet) {
      var oldState = state.servlet[servlet.header.id];

      var s = lodash.cloneDeep(oldState) || PluginState.getServletStateTemplate();
      s.preferences = servlet.preferences;

      var now = new Date().getTime();
      if (lodash.isUndefined(oldState)) {
        s.header.created = now;
        s.header.updated = now;
      } else if (lodash.isEqual(s.preferences, oldState.preferences)) {
        s.header.updated = now;
      }

      return s;
    });

    state.save(function(err) {
      if (err) {
        $rootScope.$emit('Local/DeviceError', err);
        return;
      }

      // Repopulate the servlet cache.
      root.getServletsWithState({}, function(servlets) {
        callback();
      });
    });
  };

  /**
   * Private functions
   */

  // Return a promise for the collection of all available servlets.
  function getServlets() {
    return new Promise(function (resolve, reject) {

      var servlets = lodash.map(ctx.servlets, function(servlet) {
        return new Servlet(servlet);
      });

      resolve(servlets);

    }).catch(function(err) {
      $log.error('Could not get servlets: ' + err);
    });
  };

  function cacheServletsWithState(servlets) {
    servletsWithStateCache = lodash.cloneDeep(servlets);
    $rootScope.$emit('Local/ServletsWithStateUpdated', servletsWithStateCache);
    $log.debug('Servlets cached: ' + servlets.length);
  };

  function updateServletEnvironmentState(envId, environment, callback) {
    callback = callback || function(){};
    var state = ctx.state;

    var now = new Date().getTime();
    environment.header.upated = now;
    lodash.merge(state.environment[envId], environment);

    state.save(function(err) {
      if (err) {
        $rootScope.$emit('Local/DeviceError', err);
        return;
      }
      callback();
    });
  };

  function filterServlets(servlets, filter) {
    if (!lodash.isEmpty(filter)) {
      // Servlet id filter - choose only the servlet with the specified id.
      var servletIdFilter = filter.id || {};

      if (!lodash.isEmpty(servletIdFilter)) {
        servlets = lodash.filter(servlets, function(servlet) {
          return servletIdFilter == servlet.header.id;
        });
      }

      // Kind filter - remove servlets that do not match the desired kind.
      var kindFilter = filter.kind || {};

      if (!lodash.isEmpty(kindFilter)) {
        servlets = lodash.filter(servlets, function(servlet) {
          return servlet.header.kind == kindFilter;
        });
      }
    }
    return servlets;
  };

  function startServlet(servlet) {
    return new Promise(function(resolve, reject) {
      $log.info('Starting servlet: ' + servlet.header.name);

      // Create a session, container, and show the servlet.
      pluginSessionService.createSession(servlet, function(session) {
        $rootScope.$emit('$pre.beforeEnter', servlet);

        servlet.start(session);
        pluginSessionService.activateSession(session.id);
        resolve(session);
      });
    });
  };

  function shutdownServlet(session) {
    return new Promise(function(resolve, reject) {
      var servlet = session.plugin;
      $log.info('Shutting down servlet: ' + servlet.header.name);

      $rootScope.$emit('$pre.beforeLeave', servlet);

      servlet.shutdown();
      servlet.finalize(function(session) {
        pluginSessionService.destroySession(session.id, function() {
          resolve();
        });
      });
    });
  };

  return root;
});
