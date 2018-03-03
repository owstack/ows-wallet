'use strict';

angular.module('owsWalletApp.services').factory('networkService', function($log, lodash, gettextCatalog, /* networks >> */ bchLivenet, btcLivenet, btcTestnet) {
  var root = {};

  var defaultNetwork;
  var networks = [];

  var init = function() {
    // Add networks to the service
    addNetwork(bchLivenet);
    addNetwork(btcLivenet, { default: true });
    addNetwork(btcTestnet);
  };

  var addNetwork = function(network, opts) {
    opts = opts || {};
    networks.push(network.definition);

    if (opts.default) {
      defaultNetwork = networks[networks.length-1];
    }
  };

  // Set up a default persistent user configuration of all available networks
  root.defaultConfig = function() {
    var currencyNetworks = {
      default: defaultNetwork.getURI()
    };

    for (var i = 0; i < networks.length; i++) {
      currencyNetworks[networks[i].getURI()] = {
        walletService:      networks[i].walletService.production,
        unitName:           networks[i].units[0].shortName,
        unitToAtomicUnit:   networks[i].units[0].value,
        unitDecimals:       networks[i].units[0].decimals,
        unitCode:           networks[i].units[0].code,
        atomicUnitCode:     root.getAtomicUnit(networks[i].getURI()).code,
        feeLevel:           networks[i].feePolicy.default,
        alternativeName:    'US Dollar', // Default to using USD for alternative currency
        alternativeIsoCode: 'USD'
      };
    }
    return currencyNetworks;
  };

  // Wallet Client accessor

  root.walletClientFor = function(networkOrURI) {
    // Accepts network object or a network URI
    var network = networkOrURI;
    if (lodash.isString(networkOrURI)) {
      network = root.getNetworkByURI(networkOrURI);
    }
    return network.walletClient.service;
  };

  // Network queries

  root.getNetworks = function() {
    return lodash.sortBy(networks, 'name');
  };

  root.getLiveNetworks = function() {
    var n = lodash.filter(networks, function(n) {
      return root.isLivenet(n.net);
    });
    return lodash.sortBy(n, 'name');
  };

  root.getTestNetworks = function() {
    var n = lodash.filter(networks, function(n) {
      return root.isTestnet(n.net);
    });
    return lodash.sortBy(n, 'name');
  };

  root.getLivenetForCurrency = function(currency) {
    return lodash.find(root.getLiveNetworks(), function(n) {
      return (n.currency == currency);
    });
  };

  root.getTestnetForCurrency = function(currency) {
    return lodash.find(root.getTestNetworks(), function(n) {
      return (n.currency == currency);
    });
  };

  root.getNetworkForCurrencyNet = function(currency, net) {
    return lodash.find(networks, function(n) {
      return (n.currency == currency) && (n.net == net);
    });
  };

  root.getNetworkForProtocol = function(protocol) {
    // Return only livenets for the protocol.
    return lodash.find(root.getLiveNetworks(), function(n) {
      return n.protocol == protocol;
    });
  };

  root.getNetworkByURI = function(networkURI) {
    return lodash.find(networks, function(n) {
      return n.getURI() == networkURI;
    });
  };

  root.hasTestnet = function(currency) {
    return (root.getTestnetForCurrency(currency) != undefined);
  };

  // @param addrNetwork - an address network object
  root.getURIForAddrNetwork = function(addrNetwork) {
    return (addrNetwork.name + '/' + addrNetwork.chainSymbol).toLowerCase();
  };

  root.getAtomicUnit = function(networkURI) {
    var n = root.getNetworkByURI(networkURI);
    var unit = lodash.find(n.units, function(u) {
      return u.kind == 'atomic';
    });
    if (!unit) {
      $log.error('No atomic currency unit defined for network \`' + networkURI + '\`');
    }    
    return unit;
  };

  root.getStandardUnit = function(networkURI) {
    var n = root.getNetworkByURI(networkURI);
    var unit = lodash.find(n.units, function(u) {
      return u.kind == 'standard';
    });
    if (!unit) {
      $log.error('No standard currency unit defined for network \`' + networkURI + '\`');
    }    
    return unit;
  };

  root.getASUnitRatio = function(networkURI) {
    var aUnit = root.getAtomicUnit(networkURI);
    var sUnit = root.getStandardUnit(networkURI);
    return aUnit.value / sUnit.value;
  };

  root.forEachNetwork = function(opts, callback) {
    opts = opts || {};
    opts.net = opts.net || 'all';

    var networks;
    if (opts.net == 'livenet') {
      networks = root.getLiveNetworks();
    } else if (opts.net == 'testnet') {
      networks = root.getTestNetworks();
    } else {
      networks = root.getNetworks();      
    }

    lodash.forEach(networks, function(n) {
      var walletClient = root.walletClientFor(n.getURI()).getLib();
      callback(walletClient, n);
    });
  };

  ({net: 'livenet'}, function(walletClient, network) {
    walletClient.PrivateKey(privateKey, network.getURI());
  });

  // Parsers

  root.parseCurrency = function(networkURI) {
    return networkURI.trim().split('/')[1];
  };

  root.parseNet = function(networkURI) {
    return networkURI.trim().split('/')[0];
  };

  root.isLivenet = function(networkURI) {
    return root.parseNet(networkURI) == 'livenet';
  };

  root.isTestnet = function(networkURI) {
    return root.parseNet(networkURI) == 'testnet';
  };

  root.isValidAddress = function(value) {
    var result = {
      isValid: false
    };

    if (value == undefined) {
      return result;
    }

    // Check BIP21 uri and regular address
    lodash.forEach(root.getNetworks(), function(n) {
      var netLib = root.walletClientFor(n.getURI()).getLib();
      var URI = netLib.URI;
      var Address = netLib.Address;

      var hasProtocol = value.includes(':');
      if (hasProtocol) {

        // Check BIP21 uri
        if (value.startsWith(n.protocol)) {
          var uri;
          var isAddressValid;
          var isUriValid = URI.isValid(value);

          if (isUriValid) {
            uri = new URI(value);
            isAddressValid = Address.isValid(uri.address.toString(), 'livenet');

            if (root.hasTestnet(n.currency)) {
              isAddressValid = isAddressValid || Address.isValid(uri.address.toString(), 'testnet');
            }
          }
          result = {
            isValid: isUriValid && isAddressValid,
            network: n
          };
          return false; // break loop
        }

      } else {

        // Check regular address
        var isAddressValid = Address.isValid(value, 'livenet');
        if (root.hasTestnet(n.currency)) {
          isAddressValid = isAddressValid || Address.isValid(value, 'testnet');
        }

        result = {
          isValid: isAddressValid,
          network: n
        };

        if (isAddressValid) {
          return false; // break loop
        }
      }
    });

    if (!result.isValid) {
      delete result.network;
    }
    return result;
  };

  init();

  return root;
});