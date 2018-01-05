'use strict';

angular.module('owsWalletApp.services').factory('uiService', function() {
  var root = {};

  root.getDefaultWalletBackground = function(color) {
    // Replace the wallet default color in background with the specified color.
    var bg = window.getComputedStyle(document.getElementsByClassName('wallet-css-default')[0]).background;
    return bg.replace(getDefaultWalletRGBColor(), color);
  };

  root.getDefaultWalletColor = function() {
    return root.rgb2hex(getDefaultWalletRGBColor());
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
