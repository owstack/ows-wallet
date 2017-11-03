'use strict';

angular.module('owsWalletApp.services').factory('btcLivenet', function(lodash, gettextCatalog, btcWalletClient) {
  var root = {};

  root.definition = {
    currency: 'btc',
    net: 'livenet',
    label: 'Bitcoin',
    legacyName: 'livenet', // Used to update legacy wallets // TODO: remove this
    getURI: function() { return this.net + '/' + this.currency },
    protocol: 'bitcoin',
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
    rateService: {
      default: 'bitpay',
      bitpay: {
        url: 'https://bitpay.com/api/rates',
        resultSet: '',
        getCode: function(key, val) { return lodash.get(val, 'code') },
        getName: function(key, val) { return lodash.get(val, 'name') },
        getRate: function(key, val) { return lodash.get(val, 'rate') }
      }
    },
    explorer: {
      production: {
        label: gettextCatalog.getString('Explorer'),
        url: 'https://insight.bitpay.com', // 'https://explorer.openwalletstack.com',
        urlTx: 'https://insight.bitpay.com/tx/' // 'https://explorer.openwalletstack.com/tx/',
      }
    },
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
    }
  };
  
  return root;
});
