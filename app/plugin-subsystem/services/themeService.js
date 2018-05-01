'use strict';

angular.module('owsWalletApp.pluginServices').factory('themeService', function($rootScope, $log, $http, $timeout, $q, configService, ThemeCatalog, Theme, Skin, Applet, lodash, gettextCatalog, appConfig, walletService) {

  // The $rootScope is used to track theme and skin objects.  Views reference $rootScope for rendering.
  // 
  // The following $rootScope objects are built out of the application configuration (managed by the ThemeCatalog) and hard-coded (builtin) objects.
  // 
  // $rootScope.theme   - an array of all themes known to this application (builtin + imported)
  // $rootScope.themeId - the numeric, ordinal id for the currently applied theme
  // $rootScope.theme   - the current theme object being rendered and used by the application
  // $rootScope.skinId  - the numeric, ordinal id for the currently applied skin
  // $rootScope.skin    - the current skin object being rendered and used by the application
  // 
  // "discovered" objects are used as a cache prior to importing them into this application; only the "discovery" views reference the "discovered" objects.
  // 
  // $rootScope.discoveredThemeHeaders - an array of all theme headers discovered on a connected theme server
  // $rootScope.discoveredSkinHeaders  - an array of all skin headers discovered on a connected theme server; these skin headers correspond only to the current theme ($rootScope.theme)
  // 

  var root = {};
  root.initialized = false;
  root.walletId = 'NONE';

  var MAX_SKIN_HISTORY = 5;
  root.skinHistory = [];

  var currentThemeId;

/*
  root._theme = function() {
    return root._themeById(root._currentThemeId());
  };

  root._themes = function() {
    var catalog = themeCatalogService.getSync();
    return catalog.themes;
  };

  root._themeById = function(themeId) {
    var catalog = themeCatalogService.getSync();
    return catalog.themes[themeId];
  };

  root._themeByName = function(themeName) {
    var catalog = themeCatalogService.getSync();
    return lodash.find(catalog.themes, function(theme){
      return theme.header.name = themeName;
    });
  };

  root._currentThemeName = function() {
    var config = configService.getSync();
    return config.theme.name;
  };

  root._currentThemeId = function() {
    var catalog = themeCatalogService.getSync();
    return lodash.findIndex(catalog.themes, function(theme) {
      return theme.header.name == root._currentThemeName();
    });
  };

  root._skinByName = function(skinName, themeName) {
    var theme = root._themeByName(themeName);
    if (theme) {
      return lodash.find(theme.skins, function(skin){
        return skin.header.name = skinName;
      });
    } else {
      return undefined;
    }
  };

  root._currentSkinName = function() {
    var config = configService.getSync();
    return config.theme.skinFor[root.walletId];
  };

  root._currentSkinId = function() {
    return root._currentSkinIdForWallet(root.walletId);
  };
*/
  root._currentSkinIdForWallet = function(walletId) {
    return walletService.getPreferences(walletId).skinId;
  };
/*
  root._get = function(endpoint) {
    var catalog = themeCatalogService.getSync();
    $log.debug('GET ' + encodeURI(catalog.service.url + endpoint));
    return {
      method: 'GET',
      url: encodeURI(catalog.service.url + endpoint),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };
  };

  root._get_local = function(endpoint) {
    var url = themeCatalogService.getStorageRoot() + endpoint;
    if (lodash.isEmpty(themeCatalogService.getStorageRoot())) {
      url = url.substring(1);
    }
    $log.debug('GET ' + url);
    return {
      method: 'GET',
      url: url,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };
  };

  var _post = function(endpoint, data) {
    var catalog = themeCatalogService.getSync();
    $log.debug('POST ' + encodeURI(catalog.service.url + endpoint) + ' data = ' + JSON.stringify(data));
    return {
      method: 'POST',
      url: encodeURI(catalog.service.url + endpoint),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      data: data
    };
  };

  root._encodeURI =function(str) {
    return encodeURI(str).replace(/[:]/g, function(c) {  // These chars cannot be in a path
      return '';
    }).replace(/[']/g, function(c) {
      return '%' + c.charCodeAt(0).toString(16);  // Encode these chars specifically
    });
  };

  // Return the relative resource path for the specified theme.
  root._getThemeResourcePath = function(themeId) {
    return '/themes/' + themeId;
  };

  // Return the absolute resource url for the specified theme.
  // This value is always local.
  root._getLocalThemeResourceUrl = function(themeId) {
    return themeCatalogService.getStorageRoot() + root._encodeURI(root._getThemeResourcePath(themeId));
  };

  // Return the relative resource path for the specified theme's skin.
  root._getSkinResourcePath = function(themeId, skinId) {
    return '/themes/' + themeId + '/skins/' + skinId;
  };

  // Return the absolute resource url for the specified theme's skin.
  // This value is always local.
  root._getLocalSkinResourceUrl = function(themeId, skinId) {
    return themeCatalogService.getStorageRoot() + root._encodeURI(root._getSkinResourcePath(themeId, skinId));
  };

  // Get the skin index for the specified skinName in the theme.
  // Return the index for appending the skin if the theme does not have a skin named skinName.
  root._getSkinIndex = function(theme, skinName) {
    var index = theme.skins.length;
    for (var i = 0; i < theme.skins.length; i++) {
      if (theme.skins[i].header.name == skinName) {
        index = i;
        break;
      }
    }
    return index;
  };
*/
  // Read the provided theme definition (from the app configuration) and push it to the $rootScope.
  // Doing this makes the theme and skin available for the UI.
  root._bootstrapTheme = function(themeConfig, callback) {
    $http(root._get_local(themeConfig.uri + '/theme.json')).then(function successCallback(response) {
//    $http(root._get_local(root._getThemeResourcePath(themeDef.name) + '/theme.json')).then(function successCallback(response) {

      // Initialize the theme.
      // 
      var themeJSON = JSON.stringify(response.data);
      var themeResourceUrl = root._getLocalThemeResourceUrl(themeConfig.uri);
//      var themeResourceUrl = root._getLocalThemeResourceUrl(themeDef.name);

      themeJSON = themeJSON.replace(/<theme-path>/g, themeResourceUrl);
      var theme = JSON.parse(themeJSON);

      // Replace resource tags with paths.
      for (var n = 0; n < theme.resources.length; n++) {
        var re = new RegExp('<resource-' + n + '>', 'g');
        themeJSON = themeJSON.replace(re, theme.resources[n]);
      }
      theme = JSON.parse(themeJSON);

      // The resources attribute is no longer needed.
      delete theme.resources;

      var defaultSkinId = theme.header.defaultSkinId;

      $rootScope.themes = [];
      $rootScope.themeId = theme.header.id;
      $rootScope.themes.push(lodash.cloneDeep(theme));
      $rootScope.theme = $rootScope.themes[$rootScope.themeId];
      $rootScope.theme.skins = [];

      // Initialize the skins.
      // 
      var promises = [];
      for (var i = 0; i < themeConfig.skins.length; i++) {
//      for (var i = 0; i < themeDef.skins.length; i++) {
        // Collect and serialize all http requests to get skin files.
        promises.push(
          $http(root._get_local(themeConfig.skins[i] + '/skin.json')).then(function successCallback(response) {
//          $http(root._get_local(root._getSkinResourcePath(themeDef.name, themeDef.skins[i]) + '/skin.json')).then(function successCallback(response) {

            var skin = response.data;
            var themeResourceUrl = root._getLocalThemeResourceUrl(themeConfig.uri);
//            var themeResourceUrl = root._getLocalThemeResourceUrl(themeDef.name);
            var skinResourceUrl = root._getLocalSkinResourceUrl(themeConfig.skins[i].uri);
//            var skinResourceUrl = root._getLocalSkinResourceUrl(themeDef.name, skin.header.name);

            var skinJSON = JSON.stringify(skin);
            skinJSON = skinJSON.replace(/<theme-path>/g, themeResourceUrl);
            skinJSON = skinJSON.replace(/<skin-path>/g, skinResourceUrl);
            skin = JSON.parse(skinJSON);

            // Replace resource tags with paths.
            for (var n = 0; n < skin.resources.length; n++) {
              var re = new RegExp('<resource-' + n + '>', 'g');
              skinJSON = skinJSON.replace(re, skin.resources[n]);
            }
            skin = JSON.parse(skinJSON);

            // The resources attribute is no longer needed.
            delete skin.resources;

            $rootScope.theme.skins[skin.header.id] = skin;

          }, function errorCallback(response) {
            $log.debug('Error: failed to GET ' + response.config.url + ', status: ' + response.status);
          })
        );
      }

      $q.all(promises).then(function() {
        // This is run after all of the http requests are done.
        // 
        // If there is a configuration setting then use that instead of default skin (occurs during page reload).
        $rootScope.skinId = walletService.getPreferences(root.walletId).skinId || $rootScope.theme.header.defaultSkinId;
        $rootScope.skin = $rootScope.theme.skins[$rootScope.skinId];

        $log.debug('Theme service bootstrapped to theme/skin: ' +
          $rootScope.theme.header.name + '/' +
          $rootScope.skin.header.name +
          (root.walletId == 'NONE' ? ' [no wallet yet]' : ' [walletId: ' + root.walletId + ']'));

        // Build the theme catalog from the bootstrapped theme and skins.
        root._buildCatalog(function() {
          if (callback) {
            callback();
          }
        });

      }, function errorCallback(error) {
        $log.debug('Error: failed to GET local skin resources, ensure your skin files are valid JSON' + (error.message ? ': \'' + error.message + '\'': ''));
      });

    }, function errorCallback(error) {
      $log.debug('Error: failed to GET local skin resources, ensure your skin files are valid JSON' + (error.message ? ': \'' + error.message + '\'': ''));
    });
  };
/*
  root._buildCatalog = function(callback) {

    // Write the published theme and skin to the app configuration.
    var opts = {
      theme: {
        name: {},
        skinFor: {}
      }
    };

    opts.theme = {};
    opts.theme.name = $rootScope.theme.header.name;
    opts.theme.skinFor = {};
    opts.theme.skinFor[root.walletId] = $rootScope.skin.header.name;

    configService.set(opts, function(err) {
      if (err) {
        $rootScope.$emit('Local/DeviceError', err);
        return;
      }

      // The theme service catalog might not support writing theme content, if not then we skip writing the content
      // (in this case the theme content is available in $rootScope only; cannot import themes or skins in this case).
      if (themeCatalogService.supportsWriting()) {

        themeCatalogService.init($rootScope.themes, function() {
          callback();
        });

      } else {
        callback();
      }
    });
  };

  // Publish the current configuration to $rootScope. Views only read from $rootScope values.
  root._publishCatalog = function(callback) {
    if (!root.initialized) {
      if (callback) {
        callback();
      }
      return;
    }
    $rootScope.themes = lodash.cloneDeep(root._themes());
    $rootScope.themeId = root._currentThemeId();
    $rootScope.theme = $rootScope.themes[$rootScope.themeId];
    $rootScope.skinId = root._currentSkinId();
    $rootScope.skin = $rootScope.theme.skins[root._currentSkinId()];
    $log.debug('Published theme/skin: '  + $rootScope.theme.header.name + '/' + $rootScope.skin.header.name + (root.walletId == 'NONE' ? ' [no wallet yet]' : ' [walletId: ' + root.walletId + ']'));
    $timeout(function() {
      $rootScope.$apply();
    });
    if (callback) {
      callback();
    }
  };

  // Push the skin id onto the top of history stack.
  root._pushSkin = function(skinId, walletId) {
    // The history stack only tracks skin changes for the same wallet. If the wallet has changed then clear the stack first.
    if ((root.skinHistory.length > 0) && (root.skinHistory[0].walletId != walletId)) {
      root.skinHistory = [];
    }

    var historyObj = {
      skinId: skinId,
      walletId: walletId
    };

    // Avoid sequential duplicates.
    if (!lodash.isEqual(root.skinHistory[root.skinHistory.length-1], historyObj)) {
      root.skinHistory.push(historyObj);
      root.skinHistory = root.skinHistory.slice(0, MAX_SKIN_HISTORY);
    }
  };

  // Remove and return the skin id from the top of the history stack.
  root._popSkin = function() {
    return root.skinHistory.pop();
  };

  ///////////////////////////////////////////////////////////////////////////////

  root.isInitialized = function() {
    return root.initialized;
  };
*/
  // Read the theme catalog and reconcile any upgrades or changes.
  // Store catalog catalog if any.
  // Set the current theme.
  // 
  root.init = function(callback) {
    $log.debug('Initializing theme service');

    ThemeCatalog.getInstance(function(err, catalog) {
      if (err) {
        $log.debug('Error reading theme catalog');
        $rootScope.$emit('Local/DeviceError', err);
        return;
      }

      // Initialize the current theme.
      var config = configService.getSync();
      if (!config.theme.id) {
        // Lazy init the configured theme.
        config.theme.id = ThemeCatalog.getInstance().defaultThemeId;

        configService.set(config, function(err) {
          if (err) {
            $log.debug(err);
          }
          currentThemeId = configService.getSync().theme.id;
          $rootScope.$emit('Local/ThemeUpdated');

          return callback();
        });
      } else {
        currentThemeId = config.theme.id;
        $rootScope.$emit('Local/ThemeUpdated');
      }

      return callback();
    });
  };
/*
  // publishCatalog() - publishes the theme catalog to $rootScope; makes changes to the catalog available for presentation.
  // 
  root.publishCatalog = function(callback) {
    return root._publishCatalog(callback);
  };

  // updateSkin() - handles updating the skin when the wallet is changed.
  // 
  root.updateSkin = function(walletId) {
    root.walletId = walletId;
    if (!root.initialized) return;
    var config = configService.getSync();
    if (config.theme.skinFor && config.theme.skinFor[root.walletId] === undefined) {
      root.setSkinForWallet(root.getPublishedThemeDefaultSkinId(), root.walletId, true);
    } else {
      root.setSkinForWallet(root.getCatalogSkinIdForWallet(root.walletId), root.walletId, true);
    }      
  };

  // setTheme() - sets the theme for the app.
  // 
  root.setTheme = function(themeId, notify, callback) {
    $log.debug('' + (themeId != root.getPublishedThemeId() ?  'Switching theme...' : 'Reapplying theme...'));
    $log.debug('' + (themeId != root.getPublishedThemeId() ? 
      'Old theme: ' + root.getPublishedThemeById(root.getPublishedThemeId()).header.name + '\n' +
      'New theme: ' + root.getPublishedThemeById(themeId).header.name :
      'Current theme: ' + root.getPublishedThemeById(themeId).header.name));

    var opts = {
      theme: {
        name: {}
      }
    };

    opts.theme.name = root.getCatalogThemeById(themeId).header.name;

    configService.set(opts, function(err) {
      if (err) {
        $rootScope.$emit('Local/DeviceError', err);
        return;
      }

      // Need to go through config.theme.skinFor[] and remap all skins to be compatible with the new theme
      // Example; old theme has 12 skins, new theme has 6 skins
      //   if config.theme.skinFor[walletId] = skin id 12 then it won't resolve with the new theme (since it has only 6 skins)
      //   
      // TODO: Should provide a UI for wallet-skin re-mapping using the new theme's skins
      // 
      // For now, simply force all config.theme.skinFor to the themes default skin
      //
      var config = configService.getSync();
      var opts = {
        theme: {
          skinFor: {}
        }
      };

      // For all wallets, if the configured skin does not exist on this theme then reassign to the default skin for theme.
      // Skin name is the key so if two themes have the same skin name then the skin will not be reassigned.
      for (var walletId in config.theme.skinFor) {

        var skinIndex = lodash.findIndex(root.getCatalogThemeById(themeId).skins, function(skin) {
          return skin.header.name == config.theme.skinFor[walletId];
        });

        if (skinIndex < 0) {
          // Configured skin not found, reassign the default skin.
          $log.debug('Reassigning skin for wallet: ' + walletId +
            ', new skinId: ' + root.getPublishedThemeById(themeId).header.defaultSkinId +
            ' (was skinId: ' + root.getCatalogSkinIdForWallet(walletId) + ')');

          opts.theme.skinFor[walletId] = root.getCurrentTheme().header.defaultSkinName;
        }
      }

      configService.set(opts, function(err) {
        if (err) {
          $rootScope.$emit('Local/DeviceError', err);
          return;
        }

        root._publishCatalog();

        if (callback) {
          callback();
        }

        $rootScope.$emit('Local/ThemeUpdated');
        $rootScope.$emit('Local/SkinUpdated');

        if (notify) {

//          notification.success(
//            gettextCatalog.getString('Success'),
//            gettextCatalog.getString('Theme set to \'' + root.getPublishedTheme().header.name + '\''),
//            {color: root.getPublishedSkin().view.primaryColor,
//             iconColor: root.getPublishedTheme().view.notificationBarIconColor,
//             barBackground: root.getPublishedTheme().view.notificationBarBackground});

        }
      });
    });
  };

  // setSkinForWallet() - sets the skin for the specified wallet.
  // 
  root.setSkinForWallet = function(skinId, walletId, history, callback) {
    var fromSkinId = root.getPublishedSkinId();
    var reapplyingSkin = (skinId == fromSkinId);

    $log.debug('' + (reapplyingSkin ?  'Reapplying skin... [walletId: ' + walletId + ']' : 'Switching skin... [walletId: ' + walletId + ']'));

    $log.debug('' + (root.getPublishedSkinById(skinId) != undefined && skinId != fromSkinId ? 
      'Old skin: ' + root.getPublishedSkinById(fromSkinId).header.name + '\n' +
      'New skin: ' + root.getPublishedSkinById(skinId).header.name :
      'Current skin: ' + (root.getPublishedSkinById(skinId) != undefined ? root.getPublishedSkinById(skinId).header.name : 'not set, setting to skinId ' + skinId)));

    // Retain a history of applied skins.
    if (history && !reapplyingSkin) {
      root._pushSkin(fromSkinId, walletId);
    }

    root.walletId = walletId;

    // Check for bootstrapped skin and replace with the assigned walletId (the bootstrapped skin is assigned
    // before the wallet is created).
    var config = configService.getSync();
    if (config.theme.skinFor && config.theme.skinFor['NONE']) {

      var opts = {
        theme: {
          name: {},
          skinFor: {}
        }
      };

      opts.theme.name = config.theme.name;
      opts.theme.skinFor[root.walletId] = config.theme.skinFor['NONE'];

      configService.replace(opts, function(err) {
        if (err) {
          $rootScope.$emit('Local/DeviceError', err);
          return;
        }

        if (callback) {
          callback();
        }

        root.broadcastSkinEvent(skinId, fromSkinId, root.walletId);
      });

    } else {

      // Perform typical skin change.
      var newSkin = root.getPublishedSkinById(skinId);

      if (newSkin.isVanity()) {
        // Save selected skin to storage.
        var opts = {
          theme: {
            skinFor: {}
          }
        };

        opts.theme.skinFor[root.walletId] = newSkin.header.name;

        configService.set(opts, function(err) {
          if (err) {
            $rootScope.$emit('Local/DeviceError', err);
            return;
          }

          root._publishCatalog();

          if (callback) {
            callback();
          }

          root.broadcastSkinEvent(skinId, fromSkinId, root.walletId);
        });

      } else {
        // Do not save selected skin to storage.
        root._publishCatalog();

        if (callback) {
          callback();
        }

        root.broadcastSkinEvent(skinId, fromSkinId, root.walletId);
      }
    }
  };

  // broadcastSkinEvent() - Send event to subscribers.
  // 
  root.broadcastSkinEvent = function(toSkinId, fromSkinId, walletId) {
    var toSkin = root.getPublishedSkinById(toSkinId);
    var fromSkin = root.getPublishedSkinById(fromSkinId);

    if (toSkin.isVanity() && fromSkin.isVanity()) {
      $rootScope.$emit('Local/SkinUpdated', toSkin, walletId);
    }
  };

  // setSkinByNameForWallet() - convenience function.
  // 
  root.setSkinByNameForWallet = function(skinName, walletId, history, callback) {
    root.setSkinForWallet(root.getPublishedSkinIdByName(skinName), walletId, history, callback);
  };

  // popSkin() - set the previous skin for the current wallet.
  //
  root.popSkin = function(callback) {
    var historyObj = root._popSkin();
    if (historyObj.skinId) {
      root.setSkinForWallet(historyObj.skinId, root.walletId, false, callback);
    } else {
      $log.debug('Attempted to pop skin with empty skin history');
    }
  };

  // hasSkinHistory() - return true if there is skin history, false otherwise.
  // 
  root.hasSkinHistory = function() {
    return root.skinHistory.length > 0;
  };

  // getVanitySkins() - return only the collection of vanity skins.
  // 
  root.getVanitySkins = function() {
    return lodash.filter(root.getPublishedSkins(), function(skin) {
      return (new Skin(skin)).isVanity();
    });
  };
*/
  // getAppletSkins() - return only the collection of skins that are applets.
  // 
  root.getAppletSkins = function() {
return [];
    return lodash.filter(root.getPublishedSkins(), function(skin) {
      return (new Skin(skin)).isApplet();
    });
  };
/*
  // setAppletByNameForWallet() - sets the skin for the specified wallet.
  // 
  root.setAppletByNameForWallet = function(skinName, walletId, callback) {
    // When an applet is set the underlying wallet view is applied to the applet skin.
    // This allows the wallet skin to remain unchanged while the applet is presented.
    // The applet skin (vanity) 'view' is ignored (it is overwritten by design).
    // This strategy allows the applet to borrow the wallet skin settings for application to the applet presentation
    // allowing for a uniquely uniform presentation of the applet.
    var currentView = $rootScope.skin.view;
    root.setSkinByNameForWallet(skinName, walletId, true, function() {
      $rootScope.skin.view = currentView;
      callback();
    });
  };

  // deleteTheme() - removes the specified theme and all associated skins from the catalog.
  // 
  root.deleteTheme = function(themeId, callback) {
    var theme = root.getPublishedTheme();
    var catalog = themeCatalogService.getSync();
    var catalogThemes = catalog.themes || {};

    // Find the theme which will be deleted.
    var t_index = catalogThemes.length || 0;
    var i;
    for (i = 0; i < catalogThemes.length; i++) {
      if (catalogThemes[i].header.name == theme.header.name) {
        t_index = i;
        break;
      }
    }

    var cat = {
      themes: []
    };
    
    // Make a copy of the themes and remove the specified theme.
    cat.themes = lodash.cloneDeep(catalogThemes);
    var deletedTheme = lodash.pullAt(cat.themes, themeId);

    themeCatalogService.replace(cat, function(err) {   //TODO: cannot save themes if not using filestorage (content available in $rootScope only)
      if (err) {
        $rootScope.$emit('Local/DeviceError', err);
        return;
      }

      root._publishCatalog();

      if (callback) {
        callback();
      }

//      notification.success(
//        gettextCatalog.getString('Success'),
//        gettextCatalog.getString('Deleted theme \'' + deletedTheme[0].header.name + '\''),
//        {color: root.getPublishedSkin().view.primaryColor,
//         iconColor: root.getPublishedTheme().view.notificationBarIconColor,
//         barBackground: root.getPublishedTheme().view.notificationBarBackground});

      $log.debug('Deleted skin \'' + deletedTheme[0].header.name + '\'');
    });
  };

  // deleteSkin() - removes the specified skin from the catalog.
  // 
  root.deleteSkin = function(skinId, callback) {
    var theme = root.getPublishedTheme();
    var catalog = themeCatalogService.getSync();
    var catalogThemes = catalog.themes || {};

    // Find the theme for which the skin will be deleted.
    var t_index = catalogThemes.length || 0;
    var i;
    for (i = 0; i < catalogThemes.length; i++) {
      if (catalogThemes[i].header.name == theme.header.name) {
        t_index = i;
        break;
      }
    }

    var cat = {
      themes: []
    };
    
    // Make a copy of the themes and remove the skin from the specified theme.
    cat.themes = lodash.cloneDeep(catalogThemes);
    var deletedSkin = cat.themes[t_index].skins.splice(skinId, 1);

    themeCatalogService.replace(cat, function(err) {   //TODO: cannot save themes if not using filestorage (content available in $rootScope only)
      if (err) {
        $rootScope.$emit('Local/DeviceError', err);
        return;
      }

      root._publishCatalog();

      if (callback) {
        callback();
      }

//      notification.success(
//        gettextCatalog.getString('Success'),
//        gettextCatalog.getString('Deleted skin \'' + deletedSkin[0].header.name + '\''),
//        {color: root.getPublishedSkin().view.primaryColor,
//         iconColor: root.getPublishedTheme().view.notificationBarIconColor,
//         barBackground: root.getPublishedTheme().view.notificationBarBackground});

      $log.debug('Deleted skin \'' + deletedSkin[0].header.name + '\'');
    });
  };

  // saveCatalog() - save the entire catalog to persistent storage.
  // Callers may obtain references to cached catalog items ane make changes. This function allows those changes to be made persistent.
  // The default behavior is to replace the stored catalog with the catalog in memory.  This is preferred since the in memory catalog
  // should always be internally complete anc consistent.  Setting merge true will blend (or merge) the in memory catalog with the
  // stored catalog (e.g., when adding a new theme or skin).
  // 
  root.saveCatalog = function(callback, merge) {
    merge = merge || false;
    var catalog = themeCatalogService.getSync();
    if (merge) {
      themeCatalogService.set(catalog, function(err) {
        if (err) {
          $rootScope.$emit('Local/DeviceError', err);
          return;
        }
        callback();
       });
    } else {
      themeCatalogService.replace(catalog, function(err) {
        if (err) {
          $rootScope.$emit('Local/DeviceError', err);
          return;
        }
        callback();
       });      
    }
  };

  // likeTheme() - likes the specified theme.
  // 
  root.likeTheme = function(themeId) {
    var theme = root.getCatalogThemeById(themeId);
    theme.toggleLike();

    var catalogThemes = root.getCatalogThemes();
    catalogThemes[root.getPublishedThemeId()] = theme;

    var cat = {
      themes: []
    };
    
    cat.themes = lodash.cloneDeep(catalogThemes);

    themeCatalogService.set(cat, function(err) {   //TODO: cannot save themes if not using filestorage (content available in $rootScope only)
      if (err) {
        $rootScope.$emit('Local/DeviceError', err);
        return;
      }

      root._publishCatalog();

      // Notify other people that you like this.
      if (theme.header.social.iLikeThis) {
        var data = {
          theme: theme.header.name,
        };

        $http(_post('/social/like/theme', data)).then(function(data) {
          $log.info('Like theme: SUCCESS');
        }, function(data) {
          $log.error('Like theme: ERROR ' + data.statusText);
        });
      }

//      notification.success(
//        gettextCatalog.getString('Yay!'),
//        gettextCatalog.getString('You like theme \'' + theme.header.name + '\''),
//        {color: root.getPublishedSkin().view.primaryColor,
//         iconColor: root.getPublishedTheme().view.notificationBarIconColor,
//         barBackground: root.getPublishedTheme().view.notificationBarBackground});

      $log.debug('You like theme \'' + theme.header.name + '\'');
    });
  };

  // likeSkin() - likes the specified skin.
  // 
  root.likeSkin = function(skinId) {
    var skin = root.getCatalogSkinById(skinId);
    skin.toggleLike();

    var catalogThemes = root.getCatalogThemes();
    catalogThemes[root.getPublishedThemeId()].skins[skinId] = skin;

    var cat = {
      themes: []
    };
    
    cat.themes = lodash.cloneDeep(catalogThemes);

    themeCatalogService.set(cat, function(err) {   //TODO: cannot save themes if not using filestorage (content available in $rootScope only)
      if (err) {
        $rootScope.$emit('Local/DeviceError', err);
        return;
      }

      root._publishCatalog();

      // Notify other people that you like this.
      if (skin.header.social.iLikeThis) {
        var data = {
          theme: root.getPublishedTheme().header.name,
          skin: skin.name
        };

        $http(_post('/social/like/skin', data)).then(function(data) {
          $log.info('Like skin: SUCCESS');
        }, function(data) {
          $log.error('Like skin: ERROR ' + data.statusText);
        });
      }

//      notification.success(
//        gettextCatalog.getString('Yay!'),
//        gettextCatalog.getString('You like skin \'' + skin.header.name + '\''),
//        {color: root.getPublishedSkin().view.primaryColor,
//         iconColor: root.getPublishedTheme().view.notificationBarIconColor,
//         barBackground: root.getPublishedTheme().view.notificationBarBackground});

      $log.debug('You like skin \'' + skin.header.name + '\'');
    });
  };


  ///////////////////////////////////////////////////////////////////////////////

  // Current state.
  // 
  root.getCurrentThemeName = function() {
    return root._currentThemeName()
  };

  root.getCurrentSkinName = function() {
    return root._currentSkinName()
  };

  // Theme and Skin objects.
  // These functions return new objects.
  // 
  root.getCurrentTheme = function() {
    return new Theme(root._themeById(root._currentThemeId()));
  };

  root.getCurrentSkin = function() {
    return new Skin(root.getCurrentTheme().skins[root._currentSkinId()], root.getCurrentTheme());
  };

  root.getThemeByName = function(themeName) {
    return new Theme(root.getCatalogThemeByName(themeName));
  };

  root.getThemeById = function(themeId) {
    return new Theme(root.getCatalogThemeById(themeId));
  };

  root.getSkinByName = function(skinName, themeName) {
    return new Skin(root.getCatalogSkinByName(skinName, themeName));
  };
  root.getSkinById = function(skinId) {
    return new Skin(root.getCatalogSkinById(skinId));
  };

  // Catalog entires.
  // These functions return references to catalog entries (never a Theme or Skin object).
  // 
  root.getCatalog = function() {
    return themeCatalogService.getSync();
  };

  root.getCatalogThemes = function() {
    return root._themes();
  };

  root.getCatalogThemeId = function() {
    return root._currentThemeId();
  };

  root.getCatalogSkinId = function() {
    return root._currentSkinIdForWallet(root.walletId);
  };
*/
  root.getCatalogSkinIdForWallet = function(walletId) {
    return root._currentSkinIdForWallet(walletId);
  };
/*
  root.getCatalogThemeByName = function(themeName) {
    return root._themeByName(themeName);
  };

  root.getCatalogThemeById = function(themeId) {
    return root._themeById(themeId);
  };

  root.getCatalogSkinByName = function(skinName, themeName) {
    themeName = themeName || root._currentThemeName();
    return root._skinByName(skinName, themeName);
  };
  root.getCatalogSkinById = function(skinId) {
    return root.getCurrentTheme().skins[skinId], root.getCurrentTheme();
  };

  // Published objects.
  // These functions return references to published ($rootScope) objects.
  // 
  root.getPublishedThemes = function() {
    return $rootScope.themes;
  }

  root.getPublishedThemeId = function() {
    return $rootScope.themeId;
  };

  root.getPublishedTheme = function() {
    return root.getPublishedThemeById(root.getPublishedThemeId());
  };

  root.getPublishedSkinsForTheme = function(themeId) {
    return root.getPublishedTheme(themeId).skins;
  };

  root.getPublishedSkins = function() {
    return root.getPublishedSkinsForTheme(root.getPublishedThemeId());
  };

  root.getPublishedSkinId = function() {
    return $rootScope.skinId;
  };

  root.getPublishedThemeDefaultSkinId = function() {
    return root.getPublishedTheme().header.defaultSkinId;
  };

  root.getPublishedSkinIdByName = function(name) {
    return lodash.findIndex(root.getPublishedSkins(), function(skin) {
      return skin.header.name == name;
    });
  };

  root.getPublishedThemeById = function(themeId) {
    return new Theme($rootScope.themes[themeId]);
  };

  root.getPublishedSkinById = function(skinId) {
    return new Skin(root.getPublishedTheme().skins[skinId], root.getPublishedTheme());
  };

  root.getPublishedSkin = function() {
    var theme = root.getPublishedTheme();
    return new Skin(theme.skins[root.getPublishedSkinId()], root.getPublishedTheme());
  };

  root.getPublishedSkinForWalletId = function(walletId) {
    return new Skin($rootScope.theme.skins[root.getCatalogSkinIdForWallet(walletId)]);
  };
*/
  root.getCurrentTheme = function() {
    return ThemeCatalog.getInstance().themes[currentThemeId];
  };

  root.getSkinForWallet = function(walletId) {
    if (!walletService.getPreferences(walletId).skinId) {
      // Lazy init the wallet skin id.
      walletService.setPreference(walletId, 'skinId', root.getCurrentTheme().defaultSkinId, function(err) {
        if (err) {
          $log.warn(err);
        }
      });
    }
    var skinId = walletService.getPreferences(walletId).skinId;
    return new Skin(ThemeCatalog.getInstance().skins[skinId]);
  };
/*
  ///////////////////////////////////////////////////////////////////////////////

  // Theme discovery
  // 
  root.discoverThemes = function(callback) {

    // Get theme headers from the server.
    var schema = themeCatalogService.getRequiredSchema();
    $http(root._get('/themes/' + schema)).then(function successCallback(response) {
      var themeHeaders = response.data.data;
      var discoveredThemeHeaders = [];

      for (var i = 0; i < themeHeaders.length; i++) {
        discoveredThemeHeaders.push(themeHeaders[i]);
      }

      $rootScope.discoveredThemeHeaders = discoveredThemeHeaders;
      $log.debug('Theme service: discovered ' + discoveredThemeHeaders.length + ' themes');
      callback(discoveredThemeHeaders);
    }, function errorCallback(response) {
      callback([]);
      $log.debug('Error: failed to GET theme resources from ' + response.config.url);
    });
  };

  root.importTheme = function(discoveredThemeName, notify, callback) {

    if (!themeCatalogService.supportsWriting())
      throw new Error('themeService#importTheme improperly called when platform does not support writing theme content');

    var catalog = themeCatalogService.getSync();

    // Get the full theme from the server.
    var schema = themeCatalogService.getRequiredSchema();
    $http(root._get('/themes/' + schema + '/' + discoveredThemeName)).then(function successCallback(response) {

      // Import the discovered theme.
      // Read the full theme from the theme server and add it to this applications configuration settings.
      var discoveredTheme = new Theme(response.data);

      // Allow imported themes to be deleted.
      discoveredTheme.setDelete(true);

      // Avoid adding duplicates. The theme name is the key. Re-import the theme if it was previously imported.
      var catalogThemes = catalog.themes || [];
      var index = catalogThemes.length || 0;
      var i;
      for (i = 0; i < catalogThemes.length; i++) {
        if (catalogThemes[i].header.name == discoveredTheme.header.name) {
          index = i;
          break;
        }
      }

      catalogThemes[index] = discoveredTheme;

      var cat = {
        themes: []
      };
      
      cat.themes = lodash.cloneDeep(catalogThemes);

      themeCatalogService.set(cat, function(err) {   //TODO: cannot save themes if not using filestorage (content available in $rootScope only)
        if (err) {
          $rootScope.$emit('Local/DeviceError', err);
          return;
        }

        root._applyThemePreferencesog();

        if (callback) {
          callback(catalog[index]);
        }

        if (notify) {

//          notification.success(
//            gettextCatalog.getString('Success'),
//            gettextCatalog.getString('Imported theme \'' + catalog.themes[index].header.name + '\''),
//            {color: root.getPublishedSkin().view.primaryColor,
//             iconColor: root.getPublishedTheme().view.notificationBarIconColor,
//             barBackground: root.getPublishedTheme().view.notificationBarBackground});

        }

        $log.debug('Imported theme \'' + catalog.themes[index].header.name + '\'');
      });
    }, function errorCallback(response) {
      callback({});
      $log.debug('Error: failed to GET theme resources from ' + response.config.url);
    });
  };

  ///////////////////////////////////////////////////////////////////////////////

  // Skin discovery
  // 
  root.discoverSkins = function(theme, callback) {

    // Get skin headers from the server.
    var schema = themeCatalogService.getRequiredSchema();
    $http(root._get('/themes/' + schema + '/' + theme.header.name + '/skins')).then(function successCallback(response) {
      var skinHeaders = response.data.data;
      var discoveredSkinHeaders = [];

      for (var i = 0; i < skinHeaders.length; i++) {
        discoveredSkinHeaders.push(skinHeaders[i]);
      }

      $rootScope.discoveredSkinHeaders = discoveredSkinHeaders;
      $log.debug('Theme service: discovered ' + discoveredSkinHeaders.length + ' skins');
      callback(discoveredSkinHeaders);
    }, function errorCallback(response) {
      callback([]);
      $log.debug('Error: failed to GET skin resources from ' + response.config.url);
    });
  };

  // Import skin into the specified theme.
  root.importSkin = function(themeId, discoveredSkinId, notify, callback) {

    var schema = themeCatalogService.getRequiredSchema();
    $http(root._get('/themes/' + schema + '/' + themeId + '/' + discoveredSkinId)).then(function successCallback(response) {

      var discoveredSkin = new Skin(response.data, root.getCurrentTheme());

      // Allow imported skins to be deleted.
      discoveredSkin.setDelete(true);

      var catalog = themeCatalogService.getSync();
      var catalogThemes = catalog.themes || {};

      // Find the theme to which the skin will be added.
      var t_index = catalogThemes.length || 0;

      var i;
      for (i = 0; i < catalogThemes.length; i++) {
        if (catalogThemes[i].header.id == themeId) {
          t_index = i;
          break;
        }
      }

      // Find the skin index to attach the new skin.
      // Don't add duplicates. Replace the existing skin.
      var s_index = root._getSkinIndex(catalogThemes[t_index], discoveredSkin.header.id);

      // Attach the skin to the theme.
      catalogThemes[t_index].skins[s_index] = discoveredSkin;

      var cat = {
        themes: []
      };
      
      cat.themes = lodash.cloneDeep(catalogThemes);

      themeCatalogService.set(cat, function(err) {   //TODO: cannot save themes if not using filestorage (content available in $rootScope only)
        if (err) {
          $rootScope.$emit('Local/DeviceError', err);
          return;
        }

        root._publishCatalog();

        if (callback) {
          callback(catalog.themes[t_index].skins[s_index]);
        }

        if (notify) {

//          notification.success(
//            gettextCatalog.getString('Success'),
//            gettextCatalog.getString('Imported skin \'' + catalog.themes[t_index].skins[s_index].header.name + '\''),
//            {color: root.getPublishedSkin().view.primaryColor,
//             iconColor: root.getPublishedTheme().view.notificationBarIconColor,
//             barBackground: root.getPublishedTheme().view.notificationBarBackground});

        }

        $log.debug('Imported skin id \'' + catalog.themes[t_index].skins[s_index].header.id + '\'');
      });
    }, function errorCallback(response) {
      callback({});
      $log.debug('Error: failed to GET skin resources from ' + response.config.url);
    });
  };
*/
  return root;
});
