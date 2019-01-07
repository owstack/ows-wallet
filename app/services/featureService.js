'use strict';

angular.module('owsWalletApp.services').factory('featureService', function($log, lodash, configService) {
  var root = {};

  var levels = [
  	{ label: 'Basic',        weight: 0 },
  	{ label: 'Intermediate', weight: 1 },
  	{ label: 'Advanced',     weight: 2 }
  ];

  var features = [
  	{ name: 'multisignature',  weight: 1 },
  	{ name: 'wallet-service',  weight: 2 },
  	{ name: 'derivation-path', weight: 2 }
  ];

  root.getLevels = function() {
  	return levels;
  };

  root.getLevel = function() {
  	return lodash.find(levels, function(level) {
  		return level.weight == configService.getSync().featureWeight.value;
  	});
  };

  root.isAvailable = function(featureName) {
  	var feature = lodash.find(features, function(feature) {
  		return feature.name == featureName;
  	});
  	return root.getLevel().weight >= feature.weight;
  };

  root.setLevel = function(newLevel) {
    var opts = {
      featureWeight: {
        value: newLevel.weight
      }
    };
    configService.set(opts, function(err) {
      if (err) {
        $log.error(err);
      }
    });
  };

  return root;
});
