'use strict';

angular.module('owsWalletApp.services').factory('networkService', function($log, lodash, appConfig, networkHelpers, walletClient) {
  var root = {};

  var supportedNetworks = ['LIVENET']; // Support only livenet networks.
  root.errors = walletClient.errors;

  // A collection of client instances for general purpose operations. These clients should never be
  // associated with credentials.
  var clients = lodash.map(Object.keys(walletClient.availableCurrencies), function(currency) {
    return walletClient.getInstance({
      currency: currency,
      walletServiceUrl: appConfig.walletService.url
    });
  });

  var networks = [];
  lodash.forEach(clients, function(c) {
    lodash.forEach(supportedNetworks, function(n) {
      // Attach required (by the app) general purpose client functions/objects to the network object.
      c[n].decryptBIP38PrivateKey = c.decryptBIP38PrivateKey.bind(c);
      c[n].getFeeLevels = c.getFeeLevels.bind(c);
      c[n].Unit = c.Unit.bind(c);
      c[n].utils = c.utils;
      // Service info
      c[n].explorer = networkHelpers.getExplorer(c[n].name);
      c[n].feeOptions = networkHelpers.getFeeOptions(c[n].name);
      c[n].rateService = networkHelpers.getRateService(c[n].name);
      // Display labels
      c[n].shortLabel = c[n].description;
      c[n].longLabel = c[n].description + ' (' + c[n].currency + ')';

      networks.push(c[n]);
    });
  });

  var defaultNetwork = lodash.find(networks, function(n) {
    return n.name == appConfig.defaultNetwork;
  }) || networks[0].name;

  // Default network preferences (may be overriden by user)

  root.defaultPreferences = function() {
    var prefs = {
      defaultNetworkName: defaultNetwork.name
    };

    for (var i = 0; i < networks.length; i++) {
      prefs[networks[i].name] = {
        walletService: appConfig.walletService,
        unitCode: networks[i].Unit().standardsCode(),
        feeLevel: networks[i].feeOptions.default,

        // Default to USD for alternative currency
        alternativeName: 'US Dollar',
        alternativeIsoCode: 'USD'
      };
    }
    return prefs;
  };

  // Wallet credentials class

  root.Credentials = walletClient.Credentials;

  // Wallet client constructor

  root.walletClient = function(opts) {
    opts.walletServiceUrl = opts.walletServiceUrl || appConfig.walletService.url;
    return walletClient.getInstance(opts);
  };

  // Network queries

  root.getNetworks = function() {
    return lodash.sortBy(networks, 'name');
  };

  root.getNetworkForCurrency = function(currency) {
    return lodash.find(root.getNetworks(), function(n) {
      return (n.currency == currency);
    });
  };

  root.getNetworkByName = function(networkName) {
    return lodash.find(networks, function(n) {
      return n.name == networkName;
    });
  };

  // @param addrNetwork - an address network object
  root.getNameForAddrNetwork = function(addrNetwork) {
    return lodash.find(networks, function(network) {
      return network.name == addrNetwork.name;
    });
  };

  /**
   * tryResolve()
   *
   * Attempt to resolve the specified payment data into its constituents.
   * This function ensures that all supported networks are checked, see
   * networkHelpers.tryResolve() for details.
   **/
  root.tryResolve = function(data, cb) {
    var total = networks.length;
    var count = 0;
    var _result = { match: false };
    var _noMatches = '';

    function done() {
      if (_noMatches) {
        $log.warn(_noMatches);
      }
      return cb(_result);
    };

    for(var i = 0; i < total; i++) {
      if (_result.match) {
        break;
      }

      (function(i) {
        var walletClient = root.walletClient({
          currency: networks[i].currency,
          walletServiceUrl: root.defaultPreferences()[networks[i].name].walletService.url
        });

        networkHelpers.tryResolve(data, networks[i], walletClient, function(result) {
          // If multiple networks match the data then return the last completed match.
          // This can happen when scanning private keys that are valid on multiple networks.
          if (result.match) {
            _result = result;

          } else if (result.error) {
            _noMatches += '[' + networks[i].name + '] ' + result.error + '\n';
          }

          count++;
          // Stop searching on first match. This is arbitrary but we don't have a way deconflict yet (auto or via UI).
          if (_result.match || count > total - 1) {
            done();
          }
        });
      }(i));
    }
  };

  root.isValidAddress = function(data, cb) {
    root.tryResolve(data, function(result) {
      var isValid = result.match && !result.error && (result.address.length > 0)
      return cb({
        isValid: isValid,
        networkName: (isValid ? result.networkName : undefined)
      });
    });
  };

  // Utilities

  root.forEachNetwork = function(callback) {
    lodash.forEach(root.getNetworks(), function(n) {
      callback(n);
    });
  };

  return root;
});
