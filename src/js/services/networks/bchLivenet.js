'use strict';

angular.module('owsWalletApp.services').factory('bchLivenet', function(lodash, gettextCatalog, networkHelpers, bchWalletClient) {
  var root = {};

  root.definition = {
    currency: 'bch',
    net: 'livenet',
    name: 'Bitcoin Cash',
    protocol: 'bitcoincash:',
    getURI: function() { return networkHelpers.getURI(this) },
    getCurrencyLabel: function() { return networkHelpers.getCurrencyLabel(this) },
    getNetLabel: function() { return networkHelpers.getNetLabel(this) },
    getFriendlyNetLabel: function() { return networkHelpers.getFriendlyNetLabel(this) },
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
    rateService: {
      default: 'kraken',
      kraken: {
        url: 'https://api.kraken.com/0/public/Ticker?pair=BCHUSD,BCHEUR',
        resultSet: 'result',
        getName: function(key, val) { return this.nameMap[key] },
        getRate: function(key, val) { return lodash.get(val, 'c[0]') },
        getCode: function(key, val) { return key.substr(3,3) },
        nameMap: {
          'BCHUSD': 'US Dollar',
          'BCHEUR': 'Eurozone Euro'
        }
      }
    },
    explorer: {
      production: {
        label: gettextCatalog.getString('Explorer'),
        url: 'https://bch-insight.bitpay.com', // 'https://bch-explorer.openwalletstack.com',
        urlTx: 'https://bch-insight.bitpay.com/tx/' // 'https://bch-explorer.openwalletstack.com/tx/'
      }
    },
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
    }
  };

  return root;
});
