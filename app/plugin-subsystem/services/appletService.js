'use strict';

angular.module('owsWalletApp.pluginServices').factory('appletService', function($rootScope, $log, $timeout, $q, $state, lodash, Applet, Constants, PluginState, profileService, configService, appletSessionService, appletDataService, themeService, networkService) {

  var root = {};

  var appletContainer = {};
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

  var APPLET_IDENTIFIER_BUILTIN_PREFIX = 'org.openwalletstack.wallet.plugin.applet.builtin';
  var APPLET_IDENTIFIER_WALLET_PREFIX = 'org.openwalletstack.wallet.plugin.applet.builtin.wallet';

  var builtinCapabilities = [
    { id: APPLET_IDENTIFIER_BUILTIN_PREFIX + '.createpersonal', stateName: 'add.create-personal' },
    { id: APPLET_IDENTIFIER_BUILTIN_PREFIX + '.createshared', stateName: 'add.create-shared' },
    { id: APPLET_IDENTIFIER_BUILTIN_PREFIX + '.importwallet', stateName: 'add.import' },
    { id: APPLET_IDENTIFIER_BUILTIN_PREFIX + '.joinwallet', stateName: 'add.join' },
    { id: APPLET_IDENTIFIER_BUILTIN_PREFIX + '.settings', stateName: 'settings' }
  ];

  /**
   * Service state
   */

  // Set our context (plugins and state), init sub-services, and construct (get) all applets.
  root.init = function(context, callback) {
    $log.debug('Initializing applet service');

    ctx = context;

    appletDataService.init({
      state: ctx.state
    });

    publishAppletServices();

    root.getAppletsWithState({}, function(applets) {
      $log.debug('Applet service initialized');
      callback();
    });
  };

  root.finalize = function() {
    // Close any currently running applet.
    var activeSession = appletSessionService.getActiveSession();
    if (!lodash.isUndefined(activeSession)) {
      doCloseApplet(activeSession.id);
    }

    appletSessionService.finalize();
  };

  /**
   * Queries
   */

  root.isAppletBuiltin = function(applet) {
    return applet.header.id.includes(APPLET_IDENTIFIER_BUILTIN_PREFIX);
  };

  root.isAppletExternal = function(applet) {
    return !root.isAppletBuiltin(applet) && !root.isAppletWallet(applet);
  };

  root.isAppletWallet = function(applet) {
    return applet.header.id.includes(APPLET_IDENTIFIER_WALLET_PREFIX);
  };

  root.getAppletWithStateById = function(appletId) {
    var applets = root.getAppletsWithStateSync({
      id: appletId
    });
    return applets[0];
  };

  root.getAppletsWithStateSync = function(filter) {
    return filterApplets(appletsWithStateCache, filter);
  };

  // Return applets after applying persistent state. Result may be filtered.
  // filter: {
  //   id: applet id,
  //   category: category object,
  //   visible: true | false
  // }
  root.getAppletsWithState = function(filter, callback) {
    filter = filter || {};

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
            $log.error('Invalid applet layout \'' + appletState.presentation.layout + '\'');
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

      // Repopulate the applet cache.
      root.getAppletsWithState({}, function(applets) {
        callback();
      });
    });
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
      $log.error('Could not set active category to \'' + categoryName + '\', category name not found');
    }
  };

  root.clearActiveCategory = function() {
    activeCategory = {};
    $rootScope.$emit('Local/AppletCategoryCleared');
  };

  // Return the collection of all in-use applet categories.
  root.getAppletCategoriesWithState = function(filter) {
    filter = filter || {};
    var state = ctx.state;
    var iconPath = themeService.getCurrentTheme().uri + 'img/category-icons/';

    // Get all of the visible applets.
    var applets = root.getAppletsWithStateSync({
      visible: true
    });

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

  // Return a promise for the collection of all available applets.
  function getApplets() {
    return new Promise(function (resolve, reject) {
      // Wallet applets.
      getWalletsAsApplets().then(function(walletApplets) {

        // External applets.
        var applets = lodash.filter(ctx.applets, function(applet) {
          return !applet.header.id.includes(APPLET_IDENTIFIER_BUILTIN_PREFIX);
        });

        applets = lodash.map(applets, function(applet) {
          return new Applet(applet);
        });

        // Some builtin capabilities are exposed as applets.
        var builtinApplets = getBuiltinApplets();

        // TODO: validate schema of applets and reject invalid entries; will prevent down stream errors.

        // Return a comprehensive list of all applets.
        resolve(builtinApplets.concat(walletApplets).concat(applets));

      }).catch(function handleErrors(error) {
        reject(error);
      });
    })
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

  // Creates an applet object from a wallet.
  function createWalletAppletObj(wallet) {
    var config = configService.getSync();
    var configNetwork = config.currencyNetworks[wallet.networkURI];
    var network = networkService.getNetworkByURI(wallet.networkURI);

    var appletObj = lodash.cloneDeep(ctx.applets[APPLET_IDENTIFIER_WALLET_PREFIX]);
    appletObj.header.id += '.' + wallet.id;
    appletObj.header.name = wallet.alias || wallet.name;
    appletObj.model = {
      isoCode: network.isoCode,
      unitName: configNetwork.unitName,
      m: wallet.m,
      n: wallet.n,
      networkURI: wallet.networkURI,
      walletId: wallet.id,
      balance: status.totalBalanceStr ? status.totalBalanceStr : '&middot;&middot;&middot;',
      altBalance: (status.totalBalanceAlternative ? status.totalBalanceAlternative + ' ' + wallet.status.alternativeIsoCode : '&middot;&middot;&middot;')
    };

    return appletObj;
  };

  function getWalletsAsApplets() {
    return new Promise(function (resolve, reject) {
      profileService.getWallets({status: true}, function(wallets) {

        var walletApplets = lodash.map(wallets, function(w) {
          var applet = new Applet(createWalletAppletObj(w));
          $rootScope.$emit('Local/WalletAppletUpdated', applet, w.walletId);
          return lodash.cloneDeep(applet);
        });

        resolve(lodash.sortBy(walletApplets, 'header.name'));
      });
    })
  };

  function getBuiltinApplets() {
    var builtinApplets = [];
    var appletObj;

    lodash.forEach(builtinCapabilities, function(capability) {
      appletObj = lodash.cloneDeep(ctx.applets[capability.id]);
      if (appletObj) {
        appletObj.flags = Applet.FLAGS_MAY_NOT_HIDE;
        appletObj.model = {};
        appletObj.model.stateName = capability.stateName;
        builtinApplets.push(new Applet(appletObj));        
      }
    });

    return builtinApplets;
  };

  function publishAppletServices() {
    $rootScope.applet = $rootScope.applet || {};
		$rootScope.applet.close = function(sessionId) { return doCloseApplet(sessionId); };
		$rootScope.applet.open = function(applet) { return doOpenApplet(applet); };
  };

  function filterApplets(applets, filter) {
    if (!lodash.isEmpty(filter)) {
      // Applet id filter - choose only the applet with the specified id.
      var appletIdFilter = filter.id || {};

      if (!lodash.isEmpty(appletIdFilter)) {
        applets = lodash.filter(applets, function(applet) {
          return appletIdFilter == applet.header.id;
        });
      }

      // Category filter - if there is a active category then remove applets not in the category.
      var categoryFilter = filter.category || {};

      if (!lodash.isEmpty(categoryFilter)) {
        applets = lodash.filter(applets, function(applet) {
          return categoryFilter.header.name == applet.preferences.category;
        });
      }

      // Visibility filter - remove applets that are not visible.
      var visibilityFilter = filter.visible || false;

      if (visibilityFilter) {
        applets = lodash.filter(applets, function(applet) {
          return applet.preferences.visible;
        });
      }
    }
    return applets;
  };

  function filterAppletCategories(categories, filter) {
    if (!lodash.isEmpty(filter)) {
      // Category name filter.
      var nameFilter = filter.name || {};

      if (!lodash.isEmpty(nameFilter)) {
        categories = lodash.filter(categories, function(category) {
          return nameFilter == category.header.name;
        });
      }
    }
    return categories;
  };

  function showApplet(session) {
    appletSessionService.activateSession(session.id);
    appletContainer.show();
  };

  function hideApplet(session) {
    appletSessionService.deactivateSession(session.id);
    appletContainer.remove();
  };

  function openApplet(applet) {
    // Create a session, container, and show the applet.
    appletSessionService.createSession(applet, function(session) {
      $rootScope.$emit('Local/AppletEnter', applet);
      appletContainer = applet.createContainer(session);

      // Present the applet. allow some time to render before presentation.
      $timeout(function() {
        showApplet(session);
      }, 50);
    });
  };

  function openWallet(walletId) {
    var wallet = profileService.getWallet(walletId);
    if (!wallet.isComplete()) {
      return $state.go($rootScope.sref('copayers'), {
        walletId: walletId
      });
    }
    $state.go($rootScope.sref('wallet'), {
      walletId: walletId
    });
  };

  function openCapability(stateName) {
    $state.go($rootScope.sref(stateName));
  };

  function doOpenApplet(applet) {
    $log.info('Opening applet: ' + applet.header.name);
    if (root.isAppletWallet(applet)) {
      openWallet(applet.model.walletId);
    } else if (root.isAppletBuiltin(applet)) {
      openCapability(applet.model.stateName);
    } else {
      openApplet(applet);
    }
  };

  function doCloseApplet(sessionId) {
    var session = appletSessionService.getSession(sessionId);
    var applet = session.getApplet();
    $log.info('closing applet: ' + applet.header.name);

    $rootScope.$emit('Local/AppletLeave', applet);

    hideApplet(session);
    applet.finalize(function() {
      delete $rootScope.appletInfoPopover;
      appletSessionService.destroySession(session.id);

      // Reset applet services.
      publishAppletServices();
    });
  };

  return root;
});
