'use strict';

angular.module('owsWalletApp.services').factory('feeService', function($log, configService, gettext, lodash, gettextCatalog, networkService) {
  var root = {};

  var CACHE_TIME_TS = 60; // 1 min

  var cache = {
    updateTs: 0,
  };

  root.getFeeOpts = function(networkURI, opt) {
    var options = networkService.getNetworkByURI(networkURI).feePolicy.options;
    if (!opt) {
      return options;
    } else {
      return options[opt];
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

    root.getFeeLevels(walletOrNetworkURI, function(err, levels, fromCache) {
      if (err) return cb(err);

      var feeLevelRate = lodash.find(levels, {
        level: feeLevel
      });

      if (!feeLevelRate || !feeLevelRate.feePerKb) {
        return cb({
          message: gettextCatalog.getString("Could not get dynamic fee for level: {{feeLevel}}", {
            feeLevel: feeLevel
          })
        });
      }

      var feeRate = feeLevelRate.feePerKb;

      if (!fromCache) {
        $log.debug('Dynamic fee: ' + feeLevel + '/' + networkURI + ' ' + (feeLevelRate.feePerKb / 1000).toFixed() + ' ' + networkService.getAtomicUnit(networkURI).shortName + '/byte');
      }

      return cb(null, feeRate);
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
      walletServiceUrl = configService.getSync().currencyNetworks[network].walletService.url;
    }

    if (cache.updateTs > Date.now() - CACHE_TIME_TS * 1000) {
      return cb(null, cache.data, true);
    }

    var opts = {
      walletServiceUrl: walletServiceUrl
    };

    var walletClient = networkService.walletClientFor(networkURI).getClient(null, opts);

    walletClient.getFeeLevels(network, function(err, levels) {
      if (err) {
        return cb(gettextCatalog.getString('Could not get dynamic fee'));
      }

      cache.updateTs = Date.now();
      cache.data = levels;

      return cb(null, cache.data);
    });
  };


  return root;
});
