'use strict';

angular.module('owsWalletApp.services').factory('feeService', function($log, configService, gettext, lodash, gettextCatalog, networkService) {
  var root = {};

  var CACHE_TIME_TS = 60; // 1 min
  root.cachedFeeLevels = {};

  var init = function() {
    configService.whenAvailable(function() {
      // Build a fee cache for each network
      lodash.forEach(networkService.getNetworks(), function(n) {
        root.cachedFeeLevels[n.name] = {};
        root.cachedFeeLevels[n.name].updateTs = 0;

        root.getFeeLevels(n.name, function() {});
      });
    });
  };

  root.getFeeChoices = function(networkName, opt) {
    var choices = networkService.getNetworkByName(networkName).feeOptions.choices;
    if (typeof opt == 'string') {
      return choices[opt];
    } else if (typeof opt == 'undefined') {
      return choices;
    } else {
      return;
    }
  };

  root.getCurrentFeeLevel = function(networkName) {
    return configService.getSync().networkPreferences[networkName].feeLevel;
  };

  root.getFeeRate = function(feeLevel, walletOrNetworkName, cb) {
    var networkName = walletOrNetworkName;
    if (typeof walletOrNetworkName == 'object') {
      // Is wallet object
      networkName = walletOrNetworkName.networkName;
    }

    if (feeLevel == 'custom') {
      return cb();
    }

    var network = networkService.getNetworkByName(networkName);

    root.getFeeLevels(networkName, function(err, levels, fromCache) {
      if (err) {
        err = {
          message: gettextCatalog.getString("Could not get dynamic fee for level: {{feeLevel}}.", {
            feeLevel: feeLevel
          })
        };
      }

      var feeLevelRate = lodash.find(levels, {
        level: feeLevel
      });

      if (!feeLevelRate || !feeLevelRate.feePerKb) {
        return cb(err);
      }

      if (err && fromCache) {
        err = {
          message: gettextCatalog.getString("Could not get dynamic fee for level: {{feeLevel}}, using cached fee values.", {
            feeLevel: feeLevel
          })
        };
      }

      var feePerKb = feeLevelRate.feePerKb;

      if (!fromCache) {
        $log.debug('Dynamic fee: ' + feeLevel + '/' + networkName + ' ' + (feePerKb / 1000).toFixed() + ' ' + network.Unit().atomicsName() + '/byte');
      }

      // Return the fee/kb expressed in both atomic and standard units.
      return cb(err, {
        atomic: feePerKb,
        standard: network.Unit(feePerKb, 'atomic').toStandardUnit()
      });
    });
  };

  root.getCurrentFeeRate = function(walletOrNetworkName, cb) {
    var networkName;
    if (typeof walletOrNetworkName == 'object') {
      // Is wallet object
      networkName = walletOrNetworkName.network;
    } else {
      // Is networkName string
      networkName = walletOrNetworkName;
    }
    return root.getFeeRate(root.getCurrentFeeLevel(networkName), walletOrNetworkName, cb);
  };

  root.getFeeLevels = function(walletOrNetworkName, cb) {
    var networkName;
    var walletServiceUrl;

    if (typeof walletOrNetworkName == 'object') {
      // Is wallet object
      networkName = walletOrNetworkName.networkName;
      walletServiceUrl = walletOrNetworkName.baseUrl;
    } else {
      // Is networkName string
      networkName = walletOrNetworkName;
      walletServiceUrl = configService.getDefaults().networkPreferences[networkName].walletService.url;
    }

    if (root.cachedFeeLevels[networkName].updateTs > Date.now() - CACHE_TIME_TS * 1000) {
      return cb(null, root.cachedFeeLevels[networkName].data, true);
    }

    var network = networkService.getNetworkByName(networkName);
    network.getFeeLevels(networkName, function(err, levels) {
      if (err) {
        if (root.cachedFeeLevels[networkName] && root.cachedFeeLevels[networkName].data) {
          return cb(gettextCatalog.getString('Could not refresh dynamic fee information. Showing cached fee values.'), root.cachedFeeLevels[networkName].data, true);
        }
        return cb(gettextCatalog.getString('Could not get dynamic fee information.'));
      }

      root.cachedFeeLevels[networkName].updateTs = Date.now();
      root.cachedFeeLevels[networkName].data = levels;

      return cb(null, root.cachedFeeLevels[networkName].data);
    });
  };

  init();

  return root;
});
