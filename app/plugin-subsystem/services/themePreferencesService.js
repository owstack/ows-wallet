'use strict';

angular.module('owsWalletApp.pluginServices').factory('themePreferencesService', function($rootScope, $log, lodash, themeCatalogService, themeService) {

  var root = {};

  // Get the stored preferences for the specified theme.
  // 
  root.getThemePreferences = function(themeName) {
    themeName = themeName || themeService.getCurrentThemeName();
    var result = {};
    var theme = themeService.getCatalogThemeByName(themeName);

    if (!lodash.isUndefined(theme)) {
      result = theme.preferences || {};
    }
    return result;
  };

  // TODO: using themeName requires all theme names to be unique.  Should use a theme guid instead.
  // Save the specified theme preference to the catalog.
  // preferences is an object that holds the preference keys and values.
  // Example preferences:
  // {
  //   'view.primaryColor': '#FFFFFF',
  //   'view.sidebarRBackground': 'url(background.png)'
  // }
  // 
  root.setThemePreferences = function(preferences, callback, themeName) {
    callback = callback || function(){};
    themeName = themeName || themeService.getCurrentThemeName();
    var theme = themeService.getCatalogThemeByName(themeName);

    if (!lodash.isUndefined(theme)) {

      var preferencesObj = {
        initial: {},
        user: {}
      };

      for (var property in preferences) {
        if (preferences.hasOwnProperty(property)) {

          // Only capture a new preferences initial value (from the body of the theme) when there is no initial
          // preferences property previously defined.  This prevents the initial value from being lost/overwritten
          // by user preferences.
          if (lodash.isUndefined(theme.preferences) || lodash.isUndefined(theme.preferences.initial[property])) {
            preferencesObj.initial[property] = getValue(theme, property);
          } else {
            preferencesObj.initial[property] = theme.preferences.initial[property];
          }
          preferencesObj.user[property] = preferences[property];
        }
      }
      
      theme.preferences = preferencesObj;

      // Apply any user saved preferences to the catalog theme object.
      if (!lodash.isEmpty(theme.preferences)) {
        for (var property in theme.preferences.user) {
          setToValue(theme, theme.preferences.user[property], property);
        }
      }

      themeService.saveCatalog(function() {
        if (themeName == themeService.getCurrentThemeName()) {
          themeService.publishCatalog();
        }
        callback();
      });
    } else {
      $log.warn('Could not set theme preferences, theme not found \'' + themeName + '\'');
      callback();
    }
  };

  // Remove the given preference from the specified theme and reapply the initial value for the preference.
  // Will publish changes if made to the current theme.
  // 
  root.removeThemePreference = function(preferenceKey, callback, themeName) {
    callback = callback || function(){};
    themeName = themeName || themeService.getCurrentThemeName();
    var theme = themeService.getCatalogThemeByName(themeName);

    if (!lodash.isUndefined(theme.preferences) && !lodash.isUndefined(theme.preferences.user[preferenceKey])) {

      // Reapply the initial value for the property.
      setToValue(theme, theme.preferences.initial[preferenceKey], preferenceKey);

      delete theme.preferences.user[preferenceKey];
      delete theme.preferences.initial[preferenceKey];

      themeService.saveCatalog(function() {
        if (themeName == themeService.getCurrentThemeName()) {
          themeService.publishCatalog();
        }
        callback();
      });
    } else {
      callback();
    }
  };

  // Get the stored preferences for the specified skin name.
  // 
  root.getSkinPreferences = function(skinName, themeName) {
    skinName = skinName || themeService.getCurrentSkinName();
    themeName = themeName || themeService.getCurrentThemeName();
    var result = {};
    var skin = themeService.getCatalogSkinByName(skinName, themeName);

    if (!lodash.isUndefined(skin)) {
      result = skin.preferences || {};
    }
    return result;
  };

  // TODO: using skinName and themeName requires all skin and theme names to be unique.  Should use a theme guid instead.
  // Save the specified skin preference to the catalog.
  // preferences is an object that holds the preference keys and values.
  // Example preferences:
  // {
  //   'view.primaryColor': '#FFFFFF',
  //   'view.sidebarRBackground': 'url(background.png)'
  // }
  // 
  root.setSkinPreferences = function(preferences, callback, skinName, themeName) {
    callback = callback || function(){};
    skinName = skinName || themeService.getCurrentSkinName();
    themeName = themeName || themeService.getCurrentThemeName();
    var skin = themeService.getCatalogSkinByName(skinName, themeName);

    if (!lodash.isUndefined(skin)) {

      var preferencesObj = {
        initial: {},
        user: {}
      };

      for (var property in preferences) {
        if (preferences.hasOwnProperty(property)) {

          // Only capture a new preferences initial value (from the body of the skin) when there is no initial
          // preferences property previously defined.  This prevents the initial value from being lost/overwritten
          // by user preferences.
          if (lodash.isUndefined(skin.preferences) || lodash.isUndefined(skin.preferences.initial[property])) {
            preferencesObj.initial[property] = getValue(skin, property);
          } else {
            preferencesObj.initial[property] = skin.preferences.initial[property];
          }
          preferencesObj.user[property] = preferences[property];
        }
      }
      
      skin.preferences = preferencesObj;

      // Apply any user saved preferences to the catalog skin object.
      if (!lodash.isEmpty(skin.preferences)) {
        for (var property in skin.preferences) {
          setToValue(skin, skin.preferences.user[property], property);
        }
      }

      themeService.saveCatalog(function() {
        if (themeName == themeService.getCurrentThemeName() && skinName || themeService.getCurrentSkinName()) {
          themeService.publishCatalog();
        }
        callback();
      });
    } else {
      $log.warn('Could not set theme preferences, skin not found \'' + themeName + '/' + skinName + '\'');
      callback();
    }
  };

  // Remove the given preference from the specified skin and reapply the initial value for the preference.
  // Will publish changes if made to the current skin.
  // 
  root.removeSkinPreference = function(preferenceKey, callback, skinName, themeName) {
    callback = callback || function(){};
    skinName = skinName || themeService.getCurrentSkinName();
    themeName = themeName || themeService.getCurrentThemeName();
    var skin = themeService.getCatalogSkinByName(skinName);

    if (!lodash.isUndefined(skin.preferences) && !lodash.isUndefined(skin.preferences.user[preferenceKey])) {

      // Reapply the initial value for the property.
      setToValue(theme, skin.preferences.initial[preferenceKey], preferenceKey);

      delete skin.preferences.user[preferenceKey];
      delete skin.preferences.initial[preferenceKey];

      themeService.saveCatalog(function() {
        if (themeName == themeService.getCurrentThemeName() && skinName || themeService.getCurrentSkinName()) {
          themeService.publishCatalog();
        }
        callback();
      });
    } else {
      callback();
    }
  };

  function getValue(obj, path) {
    path = path.split('.');
    for (var i = 0; i < path.length - 1; i++) {
      obj = obj[path[i]];
    }
    return obj[path[i]];
  };

  function setToValue(obj, value, path) {
    path = path.split('.');
    for (var i = 0; i < path.length - 1; i++) {
      obj = obj[path[i]];
    }
    obj[path[i]] = value;
  };

  return root;

});
