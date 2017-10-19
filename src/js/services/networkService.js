'use strict';

angular.module('owsWalletApp.services').factory('networkService', function($log, lodash, gettextCatalog, /* network clients >> */ bchWalletClient, btcWalletClient) {
  var root = {};

  var ENVIRONMENT = 'local'; // 'production'; // TODO: read from launch config?

  // Define all supported networks
  //
  var networks = [
    //
    // Bitcoin livenet
    //
    {
      currency: 'btc',
      net: 'livenet',
      label: 'Bitcoin',
      legacyName: 'livenet', // Used to update legacy wallets // TODO: remove this
      walletClient: {
        service: btcWalletClient
      },
      walletService: {
        production: {
          url: 'https://btcws.openwalletstack.com/btcws/api'
        },
        staging: {
          url: 'https://btcws.openwalletstack.com/btcws/api'
        },
        local: {
          url: 'http://localhost:3232/btcws/api'
        }
      },
      explorer: {
        production: {
          label: gettextCatalog.getString('Explorer'),
          url: 'https://insight.bitpay.com', // 'https://explorer.openwalletstack.com',
          urlTx: 'https://insight.bitpay.com/tx/' // 'https://explorer.openwalletstack.com/tx/',
        }
      },
      protocol: 'bitcoin',
      units: [{
        name: 'BTC',
        shortName: 'BTC',
        value: 100000000,
        decimals: 8,
        code: 'btc',
        kind: 'standard',
        userSelectable: true
      }, {
        name: 'bits (1,000,000 bits = 1BTC)',
        shortName: 'bits',
        value: 100,
        decimals: 2,
        code: 'bit',
        kind: 'alternative',
        userSelectable: true
      }, {
        name: 'satoshi (100,000,000 satoshi = 1BTC)',
        shortName: 'satoshis',
        value: 1,
        decimals: 0,
        code: 'satoshi',
        kind: 'atomic',
        userSelectable: false
      }],
      feePolicy: {
        default: 'normal',
        options: {
          urgent: gettextCatalog.getString('Urgent'),
          priority: gettextCatalog.getString('Priority'),
          normal: gettextCatalog.getString('Normal'),
          economy: gettextCatalog.getString('Economy'),
          superEconomy: gettextCatalog.getString('Super Economy'),
          custom: gettextCatalog.getString('Custom')
        },
        explainer: {
          heading: gettextCatalog.getString('Bitcoin transactions include a fee collected by miners on the network.'),
          description: gettextCatalog.getString('The higher the fee, the greater the incentive a miner has to include that transaction in a block. Current fees are determined based on network load and the selected policy.')
        }
      },
      getURI: function() { return root.getURI(this) }
    },
    //
    // Bitcoin testnet
    //
    {
      currency: 'btc',
      net: 'testnet',
      label: 'Bitcoin',
      legacyName: 'testnet', // Used to update legacy wallets
      walletClient: {
        service: btcWalletClient
      },
      walletService: {
        production: {
          url: 'https://btcws.openwalletstack.com/btcws/api'
        },
        staging: {
          url: 'https://btcws.openwalletstack.com/btcws/api'
        },
        local: {
          url: 'http://localhost:3232/btcws/api'
        }
      },
      explorer: {
        production: {
          label: gettextCatalog.getString('Explorer'),
          url: 'https://test-insight.bitpay.com', // 'https://btc-explorer.openwalletstack.com',
          urlTx: 'https://test-insight.bitpay.com/tx/' // 'https://btc-explorer.openwalletstack.com/tx/',
        }
      },
      protocol: 'bitcoin',
      units: [{
        name: 'BTC',
        shortName: 'BTC',
        value: 100000000,
        decimals: 8,
        code: 'btc',
        kind: 'standard',
        userSelectable: true
      }, {
        name: 'bits (1,000,000 bits = 1BTC)',
        shortName: 'bits',
        value: 100,
        decimals: 2,
        code: 'bit',
        kind: 'alternative',
        userSelectable: true
      }, {
        name: 'satoshi (100,000,000 satoshi = 1BTC)',
        shortName: 'satoshis',
        value: 1,
        decimals: 0,
        code: 'satoshi',
        kind: 'atomic',
        userSelectable: false
      }],
      feePolicy: {
        default: 'normal',
        options: {
          urgent: gettextCatalog.getString('Urgent'),
          priority: gettextCatalog.getString('Priority'),
          normal: gettextCatalog.getString('Normal'),
          economy: gettextCatalog.getString('Economy'),
          superEconomy: gettextCatalog.getString('Super Economy'),
          custom: gettextCatalog.getString('Custom')
        },
        explainer: {
          heading: gettextCatalog.getString('Bitcoin transactions include a fee collected by miners on the network.'),
          description: gettextCatalog.getString('The higher the fee, the greater the incentive a miner has to include that transaction in a block. Current fees are determined based on network load and the selected policy.')
        }
      },
      getURI: function() { return root.getURI(this) }
    },
    //
    // Bitcoin Cash livenet
    //
    {
      currency: 'bch',
      net: 'livenet',
      label: 'Bitcoin Cash',
      walletClient: {
        service: bchWalletClient
      },
      walletService: {
        production: {
          url: 'https://bchws.openwalletstack.com/bchws/api'
        },
        staging: {
          url: 'https://bchws.openwalletstack.com/bchws/api'
        },
        local: {
          url: 'http://localhost:4232/bchws/api'
        }
      },
      explorer: {
        production: {
          label: gettextCatalog.getString('Explorer'),
          url: 'https://bch-insight.bitpay.com', // 'https://bch-explorer.openwalletstack.com',
          urlTx: 'https://bch-insight.bitpay.com/tx/' // 'https://bch-explorer.openwalletstack.com/tx/'
        }
      },
      protocol: 'bitcoincash',
      units: [{
        name: 'BCH',
        shortName: 'BCH',
        value: 100000000,
        decimals: 8,
        code: 'bch',
        kind: 'standard',
        userSelectable: true
      }, {
        name: 'bits (1,000,000 bits = 1BCH)',
        shortName: 'bits',
        value: 100,
        decimals: 2,
        code: 'bit',
        kind: 'alternative',
        userSelectable: true
      }, {
        name: 'satoshi (100,000,000 satoshi = 1BTC)',
        shortName: 'satoshis',
        value: 1,
        decimals: 0,
        code: 'satoshi',
        kind: 'atomic',
        userSelectable: false
      }],
      feePolicy: {
        default: 'normal',
        options: {
          urgent: gettextCatalog.getString('Urgent'),
          priority: gettextCatalog.getString('Priority'),
          normal: gettextCatalog.getString('Normal'),
          economy: gettextCatalog.getString('Economy'),
          superEconomy: gettextCatalog.getString('Super Economy'),
          custom: gettextCatalog.getString('Custom')
        },
        explainer: {
          heading: gettextCatalog.getString('Bitcoin Cash transactions include a fee collected by miners on the network.'),
          description: gettextCatalog.getString('The higher the fee, the greater the incentive a miner has to include that transaction in a block. Current fees are determined based on network load and the selected policy.')
        }
      },
      getURI: function() { return root.getURI(this) }
    }
  ];

  // Set up configuration of all available networks
  root.defaultConfig = function() {
    var currencyNetworks = {
      default: 'livenet/btc'
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
    return networks;
  };

  root.getLiveNetworks = function() {
    return lodash.filter(networks, function(n) {
      return root.isLivenet(n.net);
    });
  };

  root.getTestNetworks = function() {
    return lodash.filter(networks, function(n) {
      return root.isTestnet(n.net);
    });
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

  root.getURI = function(network) {
    return network.net + '/' + network.currency;
  };

  // @param addrNetwork - an address network object
  root.getURIForAddrNetwork = function(addrNetwork) {
    return (addrNetwork.name + '/' + addrNetwork.chainSymbol).toLowerCase();
  };

  root.getNetworkLabelByURI = function(networkURI) {
    var n = lodash.find(networks, function(n) {
      return n.getURI() == networkURI;
    });
    return (n ? n.label + ' (' + n.net + ')' : 'Unknown');
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

  // Update the specified legacy network name to use the newest format.
  root.getUpdatedNetworkURI = function(networkURI) {
    var network = lodash.find(networks, function(n) {
      return n.legacyName == networkURI;
    });

    if (network) {
      return network.getURI();
    } else {
      return networkURI;
    }
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
