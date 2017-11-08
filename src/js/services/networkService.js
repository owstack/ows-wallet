'use strict';

angular.module('owsWalletApp.services').factory('networkService', function($log, lodash, gettextCatalog, /* networks >> */ bchLivenet, btcLivenet, btcTestnet) {
  var root = {};

  var ENVIRONMENT = 'local'; // 'production'; // TODO: read from launch config?
  var defaultNetwork; // An index
  var networks = [];

  var addNetwork = function(network, opts) {
    opts = opts || {};
    networks.push(network.definition);

    if (opts.default) {
      defaultNetwork = networks.length - 1;
    }
  };

  // Add networks to the service
  addNetwork(bchLivenet);
  addNetwork(btcLivenet, { default: true });
  addNetwork(btcTestnet);

  // Set up a default persistent user configuration of all available networks
  root.defaultConfig = function() {
    var currencyNetworks = {
      default: networks[defaultNetwork].getURI()
    };

    for (var i = 0; i < networks.length; i++) {
      currencyNetworks[networks[i].getURI()] = {
        walletService:      networks[i].walletService[ENVIRONMENT],
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
    return lodash.sortBy(networks, 'label');
  };

  root.getLiveNetworks = function() {
    var n = lodash.filter(networks, function(n) {
      return root.isLivenet(n.net);
    });
    return lodash.sortBy(n, 'label');
  };

  root.getTestNetworks = function() {
    var n = lodash.filter(networks, function(n) {
      return root.isTestnet(n.net);
    });
    return lodash.sortBy(n, 'label');
  };

  root.getLivenetForCurrency = function(currency) {
    return lodash.find(networks, function(n) {
      return (n.currency == currency) && (n.net == 'livenet');
    });
  };

  root.getTestnetForCurrency = function(currency) {
    return lodash.find(networks, function(n) {
      return (n.currency == currency) && (n.net == 'testnet');
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

  return root;
});
