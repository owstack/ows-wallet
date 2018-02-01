'use strict';

angular.module('owsWalletApp.services').factory('networkHelpers', function() {
	var root = {};

  root.getURI = function(obj) {
  	return obj.net + '/' + obj.currency;
  };

  root.getCurrencyLabel = function(obj) {
    return (obj.net == 'testnet' ? 't' : '') + obj.currency.toUpperCase();
  };

  root.getCurrencyLongLabel = function(obj) {
    return obj.name + ' (' + root.getCurrencyLabel(obj) + ')';
  };

  root.getNetLabel = function(obj) {
  	return obj.name + ' (' + obj.net + ')';
  };

  root.getFriendlyNetLabel = function(obj) {
  	return obj.name + (obj.net == 'testnet' ? ' Testnet' : '');
  };

	return root;
});
