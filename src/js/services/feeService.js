'use strict';

angular.module('owsWalletApp.services').factory('feeService', function($log, configService, gettext, lodash, gettextCatalog, networkService) {
  var root = {};

  var CACHE_TIME_TS = 60; // 1 min
  root.cachedFeeLevels = {};

  var init = function() {
    configService.whenAvailable(function() {
      // Build a fee cache for each network
      lodash.forEach(networkService.getNetworks(), function(n) {
        var networkURI = n.getURI();
        root.cachedFeeLevels[networkURI] = {};
        root.cachedFeeLevels[networkURI].updateTs = 0;

        root.getFeeLevels(networkURI, function() {});
      });
    });
  };

  root.getFeeOpts = function(networkURI, opt) {
    var options = networkService.getNetworkByURI(networkURI).feePolicy.options;
    if (typeof opt == 'string') {
      return options[opt];
    } else if (typeof opt == 'undefined') {
      return options;
    } else {
      return;
    }
  };

  root.getCurrentFeeLevel = function(networkURI) {
    return configService.getSync().currencyNetworks[networkURI].feeLevel;
  };

  root.getFeeRate = function(feeLevel, walletOrNetworkURI, cb) {
    var networkURI = walletOrNetworkURI;
    if (typeof walletOrNetworkURI == 'object') {
      // Is wallet object
      networkURI = walletOrNetworkURI.networkURI;
    }

    if (feeLevel == 'custom') return cb();

    root.getFeeLevels(networkURI, function(err, levels, fromCache) {
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

      var feeRate = feeLevelRate.feePerKb;

      if (!fromCache) {
        $log.debug('Dynamic fee: ' + feeLevel + '/' + networkURI + ' ' + (feeLevelRate.feePerKb / 1000).toFixed() + ' ' + networkService.getAtomicUnit(networkURI).shortName + '/byte');
      }

      return cb(err, feeRate);
    });
  };

  root.getCurrentFeeRate = function(walletOrNetworkURI, cb) {
    if (typeof walletOrNetworkURI == 'object') {
      // Is wallet object
      network = walletOrNetworkURI.network;
    } else {
      // Is networkURI string
      network = walletOrNetworkURI;
    }
    return root.getFeeRate(root.getCurrentFeeLevel(network), walletOrNetworkURI, cb);
  };

  root.getFeeLevels = function(walletOrNetworkURI, cb) {
    var network;
    var networkURI;
    var walletServiceUrl;

    if (typeof walletOrNetworkURI == 'object') {
      // Is wallet object
      network = walletOrNetworkURI.network;
      networkURI = walletOrNetworkURI.networkURI;
      walletServiceUrl = walletOrNetworkURI.baseUrl;
    } else {
      // Is networkURI string
      network = networkService.parseNet(walletOrNetworkURI);
      networkURI = walletOrNetworkURI;
      walletServiceUrl = configService.getSync().currencyNetworks[networkURI].walletService.url;
    }

    if (root.cachedFeeLevels[networkURI].updateTs > Date.now() - CACHE_TIME_TS * 1000) {
      return cb(null, root.cachedFeeLevels[networkURI].data, true);
    }

    var opts = {
      walletServiceUrl: walletServiceUrl
    };

    var walletClient = networkService.walletClientFor(networkURI).getClient(null, opts);

    walletClient.getFeeLevels(network, function(err, levels) {
      if (err) {
        if (root.cachedFeeLevels[networkURI] && root.cachedFeeLevels[networkURI].data) {
          return cb(gettextCatalog.getString('Could not refresh dynamic fee information. Showing cached fee values.'), root.cachedFeeLevels[networkURI].data, true);
        }
        return cb(gettextCatalog.getString('Could not get dynamic fee information.'));
      }

      root.cachedFeeLevels[networkURI].updateTs = Date.now();
      root.cachedFeeLevels[networkURI].data = levels;

      return cb(null, root.cachedFeeLevels[networkURI].data);
    });
  };

  init();

  return root;
});
