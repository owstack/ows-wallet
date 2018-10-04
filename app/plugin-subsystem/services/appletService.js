'use strict';

angular.module('owsWalletApp.pluginServices').factory('appletService', function($rootScope, $log, $ionicModal, $state, $timeout, lodash, Applet, Constants, PluginState, pluginSessionService, themeService, popupService, gettextCatalog, servletService, scannerModalService) {

  var root = {};

  var appletsWithStateCache = [];
  var activeCategory = {};
  var ctx;

  // The template for the internal applet category object.
  var appletCategorySchema = {
    header: {
      name: '',
      count: 0
    },
    preferences: {
      visible: true,
      layout: {}
    },
    view: {
      iconBackground: ''
    }
  };

  // Applet state preferences
  var defaultAppletPreferences = {
    visible: true, // Whether or not the applet is displayed in the UI.
    category: 'Unknown' // The user assigned category (defaults to store category or unknown).
  };

  /**
   * Service state
   */

  // Set our context (plugins and state), init sub-services, and construct (get) all applets.
  root.init = function(context) {
    return new Promise(function(resolve, reject) {
      $log.debug('Initializing applet service');

      ctx = context;
      publishAppletServices();

      root.getAppletsWithState({}, function(applets) {
        $log.debug('Applet service initialized');

        lodash.forEach(applets, function(applet) {
          var pluginStartMode = lodash.get(applet, 'launch.options.startMode');
          if (pluginStartMode == 'cache') {
            doOpenApplet(applet);
          }
        });

        resolve();
      });
    });
  };

  root.finalize = function() {
    // Close any currently running applet.
    var activeSession = pluginSessionService.getActiveSession();
    if (!lodash.isUndefined(activeSession) && activeSession.isForApplet()) {
      doCloseApplet(activeSession.id);
    }
  };

  /**
   * Queries
   */

  root.getAppletWithStateById = function(appletId) {
    var filter = [{
      key: 'header.id',
      value: appletId
    }];

    var applets = root.getAppletsWithStateSync(filter);
    return applets[0];
  };

  root.getAppletsWithStateSync = function(filter) {
    return filterApplets(appletsWithStateCache, filter);
  };

  // Return applets after applying persistent state. Result may be filtered.
  // filter: [{
  //   key: <applet-property-path>,
  //   value: <value-to-filter>
  // }]
  root.getAppletsWithState = function(filter, callback) {
    filter = filter || [];

    // Get all of the applets.
    getApplets().then(function(applets) {
      var state = ctx.state;
      var decoratedApplets;

      var ids = [];
      var now = new Date().getTime();

      // Find and add the applet layout and preferences to each applet object.
      decoratedApplets = lodash.map(applets, function(applet) {
        state.applet = state.applet || {};

        var appletState = state.applet[applet.header.id] || {};
        if (lodash.isEmpty(appletState)) {
          appletState = PluginState.getAppletStateTemplate();
          appletState.header.created = now;
          appletState.header.updated = now;

          state.applet[applet.header.id] = appletState;
          ids.push(applet.header.id);
        }

        // Apply layout.
        switch (state.environment[Constants.ENVIRONMENT_ID].applet.presentation) {
          case Constants.PRESENTATION_CATEGORIES:
            applet.layout = appletState.preferences.layout.categoryList || {};
          break;

          case Constants.PRESENTATION_GRID:
            applet.layout = appletState.preferences.layout.grid || {};
          break;

          case Constants.PRESENTATION_LIST:
            applet.layout = appletState.preferences.layout.list || {};
          break;

          default:
            $log.warn('Invalid applet layout \'' + appletState.presentation.layout + '\'');
          break;
        }

        // Apply preferences from applet state or set default value.
        //
        // User assigned category defaults to store category or default value assigned here.
        appletState.preferences.category =
          appletState.preferences.category ||
          applet.store.category.primary ||
          defaultAppletPreferences.category;

        applet.preferences = lodash.cloneDeep(defaultAppletPreferences);
        lodash.merge(applet.preferences, appletState.preferences);

        return applet;
      });

      if (ids.length > 0) {
        state.saveApplet(ids, function(err) {
          if (err) {
            $rootScope.$emit('Local/DeviceError', err);
            return;
          }
        });
      }

      var filteredApplets = filterApplets(lodash.cloneDeep(decoratedApplets), filter);

      cacheAppletsWithState(decoratedApplets);
      callback(filteredApplets);

    }).catch(function handleErrors(error) {
      $log.error('Failed to get applets: ' + error);
      callback();
    });
  };

  /**
   * Environment
   */

  root.setAppletPresentation = function (presentation, callback) {
    var state = ctx.state;
    state.environment.default.applet.presentation = presentation;
    // Only one environment exists (default).
    updateAppletEnvironmentState(Constants.ENVIRONMENT_ID, state.environment, callback);
  };

  root.setAppletCategoryPresentation = function (presentation, callback) {
    var state = ctx.state;
    state.environment.default.appletCategory.presentation = presentation;
    // Only one environment exists (default).
    updateAppletEnvironmentState(Constants.ENVIRONMENT_ID, state.environment, callback);
  };

  /**
   * State
   */

  root.updateAppletState = function(applets, opts, callback) {
    opts = opts || {};
    callback = callback || function(){};

    var state = ctx.state;

    // Build the applet state object for each applet.
    var newState = lodash.map(applets, function(applet) {
      var oldState = state.applet[applet.header.id];

      var s = lodash.cloneDeep(oldState) || PluginState.getAppletStateTemplate();
      s.preferences = applet.preferences;

      switch(opts.presentation) {
        case Constants.PRESENTATION_CATEGORIES:
          state.preferences.layout.categoryList = applet.layout;
          break;
        case Constants.PRESENTATION_GRID:
          state.preferences.layout.grid = applet.layout;
          break;
        case Constants.PRESENTATION_LIST:
          state.preferences.layout.list = applet.layout;
          break;
      };

      var now = new Date().getTime();
      if (lodash.isUndefined(oldState)) {
        s.header.created = now;
        s.header.updated = now;
      } else if (!lodash.isEqual(s.preferences, oldState.preferences)) {
        s.header.updated = now;
      }

      return s;
    });

    state.save(function(err) {
      if (err) {
        $rootScope.$emit('Local/DeviceError', err);
        return;
      }

      // Repopulate the applet cache.
      root.getAppletsWithState({}, function(applets) {
        callback();
      });
    });
  };

  /**
   * Applet interaction
   */

  // Callback returns the new session object.
  root.openApplet = function(id, callback) {
    // Check for an existing applet session.
    var appletId = resolveAppletId(id);
    var session = pluginSessionService.getSessionForPlugin(appletId);

    if (session) {
      if (callback) {
        callback(session);
      }
    } else {
      doOpenApplet(root.getAppletWithStateById(appletId), callback);
    }
  };

  root.showApplet = function(sessionId) {
    var session = pluginSessionService.getSession(sessionId);
    var applet = session.plugin;
    applet.show();
  };

  root.hideApplet = function(sessionId) {
    var session = pluginSessionService.getSession(sessionId);
    var applet = session.plugin;
    applet.hide();
  };

  root.enterApplet = function(sessionId) {
    var session = pluginSessionService.getSession(sessionId);
    var applet = session.plugin;
    applet.enter();
  };

  root.leaveApplet = function(sessionId) {
    var session = pluginSessionService.getSession(sessionId);
    var applet = session.plugin;
    applet.leave();
  };

  root.closeApplet = function(sessionId, opts) {
    opts = opts || {};
    if (opts.confirm) {
      confirmCloseApplet(sessionId);
    } else {
      doCloseApplet(sessionId);
    }
  };

  root.hideSplash = function(sessionId) {
    $rootScope.$emit('Local/AppletHideSplash', sessionId);
  };

  root.scanQrCode = function(sessionId) {
    // Return a promise for the result, or an error.
    return scannerModalService.scan(sessionId);
  };

  /**
   * Category
   */

  root.createAppletCategory = function(name, callback) {
    var iconPath = themeService.getCurrentTheme().uri + 'img/category-icons/';
    var category = lodash.cloneDeep(appletCategorySchema);
    category.header.name = name;
    category.preferences.layout.list = {position:{'0':9999,'1':9999}};
    category.view.iconBackground = 'url(' + iconPath + name.replace(/[^a-zA-Z0-9]/g, "") + '.png) center / cover no-repeat rgba(0,0,0,0)';

    root.updateAppletCategoryState([category], function() {
      callback(root.getAppletCategoriesWithState({name: name}));
    });
  };

  root.getActiveCategory = function() {
    return activeCategory;
  };

  root.setActiveCategory = function(category) {
    activeCategory = category;
    $rootScope.$emit('Local/AppletCategoryUpdated', category);
  };

  root.setActiveCategoryByName = function(categoryName) {
    var categories = root.getAppletCategoriesWithState({
      name: categoryName
    });
    if (categories.length >= 0) {
      root.setActiveCategory(categories[0]);
    } else {
      $log.warn('Could not set active category to \'' + categoryName + '\', category name not found');
    }
  };

  root.clearActiveCategory = function() {
    activeCategory = {};
    $rootScope.$emit('Local/AppletCategoryCleared');
  };

  // Return the collection of all in-use applet categories.
  root.getAppletCategoriesWithState = function(filter) {
    filter = filter || [];
    var state = ctx.state;
    var iconPath = themeService.getCurrentTheme().uri + 'img/category-icons/';

    // Get all of the visible applets.
    var filter = [{
      key: 'applet.preferences.visible',
      value: true
    }];
    var applets = root.getAppletsWithStateSync(filter);

    // Create a set of categories from applets.
    var categories = lodash.map(applets, function(applet) {
      var categoryName = applet.preferences.category;
      var categoryState = state.category[categoryName] || {};

      var category = lodash.cloneDeep(appletCategorySchema);
      category.header.name = categoryName;
      category.preferences.layout = categoryState.preferences.layout;

      // Try to use an icon for the category, use default icon otherwise.
      var iconBackground = 'url(\'' + iconPath + categoryName.replace(/[^a-zA-Z0-9]/g, "") + '.png\') center / cover no-repeat';
      iconBackground += ', url(\'' + iconPath + 'default.png\') center / cover no-repeat rgba(0,0,0,0)';

      category.view.iconBackground = iconBackground;
      return category;
    });

    // Get the number of applets in each category.
    var counts = lodash.countBy(categories, function(cat) {
      return cat.header.name;
    });

    // Remove duplicates and sort (sorting is only effective before categories are assigned positions in the grid).
    categories = lodash.sortBy(lodash.uniq(categories, 'header.name'), 'header.name');

    // Map the category applet count into each category.
    categories = lodash.map(categories, function(cat) {
      cat.header.count = counts[cat.header.name];
      return cat;
    });

    var filteredCategories = filterAppletCategories(lodash.cloneDeep(categories), filter);

    // TODO: validate schema of categories; will prevent downstream errors.

    return filteredCategories;
  };

  // Update category state with the specified array of new states.
  root.updateAppletCategoryState = function(categories, opts, callback) {
    var state = ctx.state;
    var updatedCategoryState = state.category;

    // Create the category state objects from each category object.
    var newState = lodash.map(categories, function(category) {
      var oldState = state.appletCategory[categoryState.header.id];

      var s = lodash.cloneDeep(oldState) || PluginState.getAppletCategoryStateTemplate();
      s.preferences = category.preferences;

      switch(opts.presentation) {
        case Constants.PRESENTATION_LIST:
          s.preferences.layout.list = categoryState.layout;
          break;
      };

      var now = new Date().getTime();
      if (lodash.isUndefined(oldState)) {
        s.header.created = now;
        s.header.updated = now;
      } else if (!lodash.isEqual(s.preferences, oldState.preferences)) {
        s.header.updated = now;
      }

      return s;
    });

    state.save(function(err) {
      if (err) {
        $rootScope.$emit('Local/DeviceError', err);
        return;
      }
      if (callback) {
        callback();
      }
    });
  };

  /**
   * Private functions
   */

  // Returns an applet id. The id param maybe an applet id or an applet extension point ('ows-axp-<name>').
  function resolveAppletId(id) {
    var filter = [{
      key: 'launch.options.viewport',
      value: id
    }];

    var applets = root.getAppletsWithStateSync(filter);

    if (applets[0]) {
      return applets[0].header.id;
    } else {
      return id;
    }
  };

  // Return a promise for the collection of all available applets.
  function getApplets() {
    return new Promise(function (resolve, reject) {

      var applets = lodash.map(ctx.applets, function(applet) {
        return new Applet(applet);
      });

      resolve(applets);

    }).catch(function(err) {
      reject(err);
    });
  };

  function cacheAppletsWithState(applets) {
    appletsWithStateCache = lodash.cloneDeep(applets);
    $rootScope.$emit('Local/AppletsWithStateUpdated', appletsWithStateCache);
    $log.debug('Applets cached: ' + applets.length);
  };

  function updateAppletEnvironmentState(envId, environment, callback) {
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

  function publishAppletServices() {
    $rootScope.applet = {
		  close: function(sessionId) { return confirmCloseApplet(sessionId); },
		  open: function(applet) { return doOpenApplet(applet); }
    };
  };

  function filterApplets(applets, filter) {
    lodash.forEach(filter, function(f) {
      applets = lodash.filter(applets, function(applet) {
        return f.value == lodash.get(applet, f.key);
      });
    });
    return applets;
  };

  function filterAppletCategories(categories, filter) {
    lodash.forEach(filter, function(f) {
      categories = lodash.filter(categories, function(category) {
        return f.value == lodash.get(category, f.key);
      });
    });
    return categories;
  };

  function doOpenApplet(applet, callback) {
    // Create a session, start dependent servlets, create the container, and show the applet.
    pluginSessionService.createSession(applet, function(session) {
      pluginSessionService.activateSession(session.id);

      $rootScope.$emit('$pre.beforeEnter', applet);
      applet.create(session);
      if (callback) {
        callback(session);
      }
    });
  };

  function confirmCloseApplet(sessionId) {
    var session = pluginSessionService.getSession(sessionId);
    var applet = session.plugin;

    var title = gettextCatalog.getString('Close ' + applet.header.name + '?');
    var message = gettextCatalog.getString('Are you sure you want to close the ' + applet.header.name + ' applet?');
    var okText = gettextCatalog.getString('Yes');
    var cancelText = gettextCatalog.getString('No');

    popupService.showConfirm(title, message, okText, cancelText, function(confirmed) {
      if (confirmed) {
        doCloseApplet(sessionId);
      }
    });
  };

  function doCloseApplet(sessionId) {
    var session = pluginSessionService.getSession(sessionId);
    var applet = session.plugin;

    $log.info('Closing applet: ' + applet.header.name + '@' + applet.header.version);

    $rootScope.$emit('$pre.beforeLeave', applet);
    $rootScope.$emit('Local/RemoveApplet', sessionId);

    applet.finalize(function() {
      // Shutdown all dependent servlets for this plugin.
      servletService.shutdownServlets(session).then(function() {
        pluginSessionService.destroySession(session.id, function() {

          // Reset applet services.
          publishAppletServices();
        });
      });
    });

  };

  return root;
});
