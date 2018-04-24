'use strict';

angular.module('owsWalletApp.pluginServices').factory('appletService', function($rootScope, $log, $timeout, $q, $ionicModal, $ionicPopover, lodash, Applet, Skin, profileService, configService, apiService, appletSessionService, themeService, Constants, platformInfoService, networkService, walletService) {

  var root = {};

  // Applet preferences default values.
  // 
  var DEFAULT_APPLET_PREFS_VISIBLE = true;
  var DEFAULT_APPLET_PREFS_CATEGORY = 'Unknown';

  var APPLET_IDENTIFIER_BUILTIN_PREFIX = 'org.openwalletstack.wallet.plugin.applet.builtin';
  var APPLET_IDENTIFIER_WALLET_PREFIX = 'org.openwalletstack.wallet.plugin.applet.builtin.wallet';

  root.appletsWithStateCache = [];
  root.activeCategory = {};

  var builtinCapabilities = [
    { id: APPLET_IDENTIFIER_BUILTIN_PREFIX + '.createpersonal', stateName: 'add.create-personal' },
    { id: APPLET_IDENTIFIER_BUILTIN_PREFIX + '.createshared', stateName: 'add.create-shared' },
    { id: APPLET_IDENTIFIER_BUILTIN_PREFIX + '.importwallet', stateName: 'add.import' },
    { id: APPLET_IDENTIFIER_BUILTIN_PREFIX + '.joinwallet', stateName: 'add.join' },
    { id: APPLET_IDENTIFIER_BUILTIN_PREFIX + '.settings', stateName: 'add.settings' }
  ];

  var ctx;

  root.init = function(context, callback) {
    $log.debug('Initializing applet service');

    ctx = context;

    apiService.init(function() {
      publishAppletServices();

      root.getAppletsWithState({}, function(applets) {
        $log.debug('Applet service initialized');
        callback();
      });
    });
  };

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
      appletId: appletId
    });
    return applets[0];
  };

  // Return applets after applying persistent state. Result may be filtered.
  // filter: {
  //   category: category object,
  //   visible: true | false
  // }
  root.getAppletsWithState = function(filter, callback) {
    filter = filter || {};

    // Get all of the applets.
    getApplets().then(function(applets) {

      var states = ctx.states;
      var appletState = states.appletState;
      var decoratedApplets;

      // Find and add the applet layout and preferences to each applet object.
      decoratedApplets = lodash.map(applets, function(applet) {

        var state = lodash.find(appletState, function(state) {
          return state.appletId == applet.header.id;
        });

        state = state || {};
        state.preferences = state.preferences || {};
        applet.preferences = applet.preferences || {};

        // Apply layout.
        // 
        switch (states.environment.presentation) {
          case Constants.LAYOUT_CATEGORIES:
            if (!lodash.isUndefined(state.layoutCategoryList)) {
              applet.layout = state.layoutCategoryList;
            }
            break;
          case Constants.LAYOUT_DESKTOP:
            if (!lodash.isUndefined(state.layoutDesktop)) {
              applet.layout = state.layoutDesktop;
            }
            break;
          case Constants.LAYOUT_LIST:
            if (!lodash.isUndefined(state.layoutList)) {
              applet.layout = state.layoutList;
            }
            break;
          default:
            $log.debug('Error: invalid applet layout, skipping application of layout');
        }

        // Apply preferences from state or set default value.
        // 
        // Visible - whether or not the applet is displayed in the UI.
        applet.preferences.visible = (!lodash.isUndefined(state.preferences.visible) ? state.preferences.visible : DEFAULT_APPLET_PREFS_VISIBLE);

        // Category - the user assigned category (defaults to marketing category or unknown).
        if (!lodash.isUndefined(state.preferences.category) && !lodash.isEmpty(state.preferences.category)) {
          applet.preferences.category = state.preferences.category;
        } else if (!lodash.isUndefined(applet.category) && !lodash.isEmpty(applet.category)) {
          applet.preferences.category = applet.category.primary;
        } else if (!lodash.isUndefined(applet.skin.header.category) && !lodash.isEmpty(applet.skin.header.category)) {
          applet.preferences.category = applet.skin.header.category.primary;
        } else {
          applet.preferences.category = DEFAULT_APPLET_PREFS_CATEGORY;
        }

        return applet;
      });

      var filteredApplets = filterApplets(lodash.cloneDeep(decoratedApplets), filter);

      cacheAppletsWithState(decoratedApplets);
      callback(filteredApplets);

    }).catch(function handleErrors(error) {
      $log.error('Failed to get applets: ' + error);
      callback();
    });
  };

  root.getAppletsWithStateSync = function(filter) {
    return filterApplets(root.appletsWithStateCache, filter);
  };

  // Return the collection of all in-use applet categories.
  root.getAppletCategoriesWithState = function(filter) {
    filter = filter || {};
    var states = ctx.states;
    var iconPath = themeService.getCurrentTheme().header.path + '/category-icons/';

    // Get all of the visible applets.
    var applets = root.getAppletsWithStateSync({
      visible: true
    });

    applets = lodash.filter(applets, function(applet) {
      return applet.preferences.visible;
    });

    var categoryState = states.categoryState || [];

    // Create a set of categories from applets.
    var categories = lodash.map(applets, function(applet) {

      var categoryName = applet.preferences.category;

      var state = lodash.find(categoryState, function(state) {
        return state.categoryName == categoryName;
      });
      state = state || {};

      // Try to use an icon for the category, use default icon otherwise.
      var iconBackground = 'url(\'' + iconPath + categoryName.replace(/[^a-zA-Z0-9]/g, "") + '.png\') center / cover no-repeat';
      iconBackground += ', url(\'' + iconPath + 'default.png\') center / cover no-repeat rgba(0,0,0,0)';

      return {
        header: {
          name: categoryName
        },
        layout: state.layout,
        view: {
          iconBackground: iconBackground
        }
      }
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

    // Apply filters.
    if (!lodash.isEmpty(filter)) {

      // Category filter - if there is a active category then remove applets not in the category.
      var nameFilter = filter.name || {};

      if (!lodash.isEmpty(nameFilter)) {
        categories = lodash.filter(categories, function(category) {
          return nameFilter == category.header.name;
        });
      }
    }

    return categories;
  };

  // Update applet states with the specified array of new states.
  root.updateAppletEnvironment = function(newEnvironment, callback) {
    var states = ctx.states;

    states.setEnvironment(newEnvironment, function(err) {
      if (err) {
        $rootScope.$emit('Local/DeviceError', err);
        return;
      }
      if (callback) {
        callback();
      }
    });
  };

  // Update category states with the specified array of new states.
  root.updateCategoryState = function(categories, opts, callback) {
    opts = opts || {};
    var states = ctx.states;
    var updatedCategoryState = states.categoryState;

    // Create the state objects from each category.
    var newState = lodash.map(categories, function(category) {
      return {
        categoryName: category.header.name,
        layout: category.layout
      }
    });

    for (var i = 0; i < newState.length; i++) {

      var existingState = lodash.find(updatedCategoryState, function(state){
        return state.categoryName == newState[i].categoryName;
      });

      if (lodash.isUndefined(existingState)) {
        // No existing category state, create a new one.
        updatedCategoryState.push(newState[i]);

      } else {
        // Update existing applet state.
        lodash.assign(existingState, newState[i]);
      }
    }

    states.setCategoryState(updatedCategoryState, function(err) {
      if (err) {
        $rootScope.$emit('Local/DeviceError', err);
        return;
      }
      if (callback) {
        callback();
      }
    });
  };

  root.updateAppletState = function(applets, opts, callback) {
    opts = opts || {};
    callback = callback || function(){};

    var states = ctx.states;
    var updatedAppletState = states.appletState;

    // Build the applet state object for each applet.
    var newState = lodash.map(applets, function(applet) {

      var state = {
        appletId: applet.header.id,
        preferences: {
          visible: applet.preferences.visible,
          category: applet.preferences.category
        }
      }

      switch(opts.layout) {
        case Constants.LAYOUT_DESKTOP:
          state.layoutDesktop = applet.layout;
          break;
        case Constants.LAYOUT_LIST:
          state.layoutList = applet.layout;
          break;
        case Constants.LAYOUT_CATEGORIES:
          state.layoutCategoryList = applet.layout;
          break;
        case '':
          // Ignore when no layout option is provided.
          break;
        default:
          $log.error('Error: invalid layout specified (' + opts.layout + '), not updating applet state layout');
      }

      return state;
    });

    for (var i = 0; i < newState.length; i++) {

      var existingState = lodash.find(updatedAppletState, function(state){
        return state.appletId == newState[i].appletId;
      });

      if (lodash.isUndefined(existingState)) {
        // No existing applet state, create a new one.
        updatedAppletState.push(newState[i]);

      } else {
        // Update existing applet state.
        lodash.assign(existingState, newState[i]);
      }
    }

    states.save(updatedAppletState, function(err) {
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

  root.createCategory = function(name, callback) {
    var iconPath = themeService.getCurrentTheme().header.path + '/category-icons/';

    var category = {
      header: {
        name: name
      },
      layout: {position:{'0':9999,'1':9999}},
      view: {
        iconBackground: 'url(' + iconPath + name.replace(/[^a-zA-Z0-9]/g, "") + '.png) center / cover no-repeat rgba(0,0,0,0)'
      }
    };

    root.updateCategoryState([category], {}, callback);

    return root.getAppletCategoriesWithState({
      name: categoryName
    });
  };

  root.getActiveCategory = function() {
    return root.activeCategory;
  };

  root.setActiveCategory = function(category) {
    root.activeCategory = category;
    $rootScope.$emit('Local/AppletCategoryUpdated', category);
  };

  root.setActiveCategoryByName = function(categoryName) {
    var categories = root.getAppletCategoriesWithState({
      name: categoryName
    });
    if (categories.length >= 0) {
      root.setActiveCategory(categories[0]);
    } else {
      $log.error('Error: could not set active category to \'' + categoryName + '\', category name not found');
    }
  };

  root.clearActiveCategory = function() {
    root.activeCategory = {};
    $rootScope.$emit('Local/AppletCategoryCleared');
  };

  root.doOpenApplet = function(applet) {
    $log.info('Opening applet: ' + applet.header.name);
    if (root.isAppletWallet(applet)) {
      openWallet();
    } else if (root.isAppletBuiltin(applet)) {
      openCapability(applet.model.stateName);
    } else {
      openApplet(applet);
    }
  };

  root.doCloseApplet = function(sessionId) {
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

  $rootScope.$on('modal.shown', function(event, modal) {
    if (modal.name != 'applet') {
      return;
    }
    $rootScope.$emit('Local/AppletShown', modal.session.getApplet());
  });

  $rootScope.$on('modal.hidden', function(event, modal) {
    if (modal.name != 'applet') {
      return;
    }
    $rootScope.$emit('Local/AppletHidden', modal.session.getApplet());
  });

  root.finalize = function() {
    // Close any currently running applet.
    var activeSession = appletSessionService.getActiveSession();
    if (!lodash.isUndefined(activeSession)) {
      root.doCloseApplet(activeSession.id);
    }

    appletSessionService.finalize();
  };

  function publishAppletServices() {
    $rootScope.applet = $rootScope.applet || {};
		$rootScope.applet.close = function(sessionId) { return root.doCloseApplet(sessionId); };
		$rootScope.applet.open = function(applet) { return root.doOpenApplet(applet); };
  };

  function showApplet(session) {
    appletSessionService.activateSession(session.id);
		root.appletModal.show();
  };

  function hideApplet(session) {
		// Pop the skin containing the applet off the stack (re-apply prior skin).
    appletSessionService.deactivateSession(session.id);
	  themeService.popSkin();
    root.appletModal.remove();
  };

  function filterApplets(applets, filter) {
    if (!lodash.isEmpty(filter)) {
      // Applet id filter - choose only the applet with the specified id.
      var appletIdFilter = filter.appletId || {};

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

  // Creates an applet schema from a wallet.
  function createWalletAppletSchema(wallet) {
    var config = configService.getSync();
    var configNetwork = config.currencyNetworks[wallet.networkURI];
    var network = networkService.getNetworkByURI(wallet.networkURI);

    var schema = ctx.applets[APPLET_IDENTIFIER_WALLET_PREFIX];
    schema.header.id += '.' + wallet.id;
    schema.header.name = wallet.alias || wallet.name;
    schema.flags = Applet.FLAGS_ALL;
    schema.model = {
      isoCode: network.isoCode,
      unitName: configNetwork.unitName,
      m: wallet.m,
      n: wallet.n,
      networkURI: wallet.networkURI,
      walletId: wallet.id,
      balance: status.totalBalanceStr ? status.totalBalanceStr : '&middot;&middot;&middot;',
      altBalance: (status.totalBalanceAlternative ? status.totalBalanceAlternative + ' ' + wallet.status.alternativeIsoCode : '&middot;&middot;&middot;')
    };

    return schema;
  };

  function getWalletsAsApplets() {
    return new Promise(function (resolve, reject) {
      profileService.getWallets({status: true}, function(wallets) {

        var walletApplets = lodash.map(wallets, function(w) {
          var walletApplet = new Applet(createWalletAppletSchema(w), null);
          $rootScope.$emit('Local/WalletAppletUpdated', walletApplet, w.walletId);
          return lodash.cloneDeep(walletApplet);
        });

        resolve(lodash.sortBy(walletApplets, 'header.name'));
      });
    })
  };

  function getBuiltinApplets() {
    var builtinApplets = [];
    var schema;

    lodash.forEach(builtinCapabilities, function(capability) {
      schema = ctx.applets[capability.id];
      if (schema) {
        schema.flags = Applet.FLAGS_ALL | Applet.FLAGS_MAY_NOT_HIDE;
        schema.model = {};
        schema.model.stateName = capability.stateName;
        builtinApplets.push(new Applet(schema));        
      }
    });

  	return builtinApplets;
  };

  function openApplet(applet) {
    // Create a session id for the applet.
    appletSessionService.createSession(applet, function(session) {

      $rootScope.$emit('Local/AppletEnter', applet);

      // Apply the skin containing the applet.
      themeService.setAppletByNameForWallet(applet.header.name, wallet.id, function() {
        applet.initEnvironment();

        // Create the applet modal.
        // 
        root.appletModal = $ionicModal.fromTemplate('\
          <ion-modal-view class="applet-modal">\
            <ion-footer-bar class="footer-bar-applet" ng-style="{\'background\':applet.view.footerBarBackground, \'border-top\':applet.view.footerBarBorderTop}">\
              <button class="footer-bar-item item-center button button-clear button-icon ion-log-out button-applet-close"\
              ng-style="{\'color\':applet.view.footerBarButtonColor}" ng-click="applet.close(\'' + session.id + '\')"></button>\
              <button class="footer-bar-item item-right button button-clear button-icon ion-more"\
              ng-style="{\'color\':applet.view.footerBarButtonColor}" ng-click="appletInfoPopover.show($event)"></button>\
            </ion-footer-bar>\
            <script id="templates/appletInfoPopover.html" type="text/ng-template">\
              <ion-popover-view class="popover-applet" ng-style="{\'background\':applet.view.popupInfoBackground, \'color\':applet.view.popupInfoColor}">\
                <ion-content scroll="false" class="m0i">\
<!--\
                  <div class="card">\
                    <div class="item item-divider card-section" ng-style="{\'background\':applet.view.popupInfoCardHeaderBackground, \'color\':applet.view.popupInfoCardHeaderColor}">\
                      <span class="left">' + (wallet.getInfo().client.alias || wallet.getInfo().client.credentials.walletName || "---") + '</span>\
                      <span class="" ng-if="' + (wallet.getInfo().client.credentials.n > 1) + '">&nbsp;(' + wallet.getInfo().client.credentials.m + '/' + wallet.getInfo().client.credentials.n + ')' + '</span>\
                      <span class="right">' + (wallet.getBalanceAsString('totalAmount', false) || '--- ' + wallet.getInfo().config.settings.unitName) + '\
                        <img ng-show="' + (wallet.getInfo().client.credentials.network == 'testnet') + '" src="img/icon-testnet-white.svg">\
                      </span>\
                    </div>\
                    <div class="item item-text-wrap card-content" ng-style="{\'background\':applet.view.popupInfoCardBodyBackground, \'border-top\':applet.view.popupInfoCardBodyBorderTop, \'color\':applet.view.popupInfoCardBodyColor}">\
                      <span class="alt-balance">' + (wallet.getBalanceAsString('totalAmount', true) || '--- ' +  wallet.getInfo().config.settings.alternativeIsoCode) + '</span>\
                      <br>\
                      <span class="notice">This wallet is the currently selected wallet and will be used for all transactions initiated while using this applet.</span>\
                    </div>\
                  </div>\
-->\
                  <div class="info">\
                    <span class="name">' + applet.header.name + '</span><br>\
                    <span class="author">By: ' + applet.skin.header.author + '</span><br>\
                    <span class="version">Version: ' + applet.skin.header.version + ', ' + applet.skin.header.date + '</span><br>\
                    <span class="description">' + applet.header.description + '</span><br>\
                  </div>\
                </ion-content>\
              </ion-popover-view>\
            </script>\
            <ion-pane ng-style="{\'background\': applet.view.background}">\
              <div class="applet-splash fade-splash" ng-style="{\'background\':applet.view.splashBackground}"\
                ng-hide="!applet.config.showSplash" ng-if="applet.view.splashBackground.length > 0"></div>\
              <iframe class="applet-frame" src="' + applet.mainViewUrl() + '?sessionId=' + session.id + '"></iframe>\
            </ion-pane>\
          </ion-modal-view>\
          ', {
          scope: $rootScope,
          backdropClickToClose: false,
          hardwareBackButtonClose: false,
          animation: 'animated zoomIn',
          hideDelay: 1000,
          session: session,
          name: 'applet'
        });

        $ionicPopover.fromTemplateUrl('templates/appletInfoPopover.html', {
          scope: root.appletModal.scope,
        }).then(function(popover) {
          $rootScope.appletInfoPopover = popover;
        });

        // Present the modal, allow some time to render before presentation.
        $timeout(function() {
          showApplet(session);
        }, 50);
      });
    });
  };

  function openWallet(walletId) {
  };

  function openCapability(stateName) {
    $state.go($rootScope.sref(stateName));
  };

  // Return a promise for the collection of all available applets.
  function getApplets() {
    return new Promise(function (resolve, reject) {
      // Wallet applets.
      getWalletsAsApplets().then(function(walletApplets) {

        // Some built-in capabilities are exposed as applets.
        var builtinApplets = getBuiltinApplets();

        // Return a comprehensive list of all applets.
        resolve(builtinApplets.concat(walletApplets).concat(applets));

      }).catch(function handleErrors(error) {
        reject(error);
      });
    })
  };

  function cacheAppletsWithState(applets) {
    root.appletsWithStateCache = lodash.cloneDeep(applets);
    $rootScope.$emit('Local/AppletsWithStateUpdated', root.appletsWithStateCache);
    $log.debug('Applets cached');
  };

  return root;
});
