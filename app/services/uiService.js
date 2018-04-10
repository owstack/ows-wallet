'use strict';

angular.module('owsWalletApp.services').factory('uiService', function(lodash) {
  var root = {};

  var safeAreaInsets;

  var builtinWalletGroups = [{
    id: 'favorite',
    label: 'Favorite Wallets'
  }];

  root.getDefaultWalletBackground = function(color) {
    // Replace the wallet default color in background with the specified color.
    var bg = window.getComputedStyle(document.getElementsByClassName('wallet-css-default')[0]).background;
    return bg.replace(getDefaultWalletRGBColor(), color);
  };

  root.getDefaultWalletColor = function() {
    return root.rgb2hex(getDefaultWalletRGBColor());
  };

  root.getDefaultWalletLayout = function() {
    return {
      group: root.newWalletGroup('favorite', 0),
      position: {}
    };
  };

  // Returns the safe-area-inset values (typ. used on iPhone X).
  root.getSafeAreaInsets = function() {
    if (!safeAreaInsets) {
      // Cache values.
      safeAreaInsets = {
        top: 0,
        bottom: 0
      };

      if (CSS.supports('padding-top: env(safe-area-inset-top)')) {
        var div = document.createElement('div');
        div.style.paddingTop = 'env(safe-area-inset-top)';
        document.body.appendChild(div);
        safeAreaInsets.top =  parseInt(window.getComputedStyle(div).paddingTop);
        document.body.removeChild(div);
      }
      if (CSS.supports('padding-bottom: env(safe-area-inset-bottom)')) {
        var div = document.createElement('div');
        div.style.paddingBottom = 'env(safe-area-inset-bottom)';
        document.body.appendChild(div);
        safeAreaInsets.bottom =  parseInt(window.getComputedStyle(div).paddingBottom);
        document.body.removeChild(div);
      }
    }
    return safeAreaInsets;
  };

  // Creates a wallet group object.
  root.newWalletGroup = function(groupIdOrLabel, ordinal) {
    // Check for a request to use a builtin group first.
    var group = lodash.find(builtinWalletGroups, function(g) {
      return g.id == groupIdOrLabel;
    });

    if (!group) {
      group = {
        id: lodash.camelCase(groupIdOrLabel),
        label: groupIdOrLabel
      };
    } else {
      // Return a new object.
      group = lodash.cloneDeep(group);
    }

    if (ordinal) {
      group.ordinal = ordinal;
    }
    return group;
  };

  root.rgb2hex = function(rgb) {
    rgb = rgb.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i);
    return (rgb && rgb.length === 4) ? "#" +
      ("0" + parseInt(rgb[1],10).toString(16)).slice(-2) +
      ("0" + parseInt(rgb[2],10).toString(16)).slice(-2) +
      ("0" + parseInt(rgb[3],10).toString(16)).slice(-2) : '';
  };

  function getDefaultWalletRGBColor() {
    return window.getComputedStyle(document.getElementsByClassName('wallet-css-default')[0]).color;
  };

  return root;
});
