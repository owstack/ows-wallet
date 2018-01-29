'use strict';

angular.module('owsWalletApp.services').factory('btcLivenet', function(lodash, gettextCatalog, appConfigService, networkHelpers, btcWalletClient) {
  var root = {};

  root.definition = {
    currency: 'btc',
    net: 'livenet',
    name: 'Bitcoin',
    protocol: 'bitcoin',
    getURI: function() { return networkHelpers.getURI(this) },
    getCurrencyLabel: function() { return networkHelpers.getCurrencyLabel(this) },
    getCurrencyLongLabel: function() { return networkHelpers.getCurrencyLongLabel(this) },
    getNetLabel: function() { return networkHelpers.getNetLabel(this) },
    getFriendlyNetLabel: function() { return networkHelpers.getFriendlyNetLabel(this) },
    walletClient: {
      service: btcWalletClient
    },
    walletService: {
      production: {
        url: appConfigService.btc.walletService.production.url
      },
      staging: {
        url: appConfigService.btc.walletService.staging.url
      },
      local: {
        url: appConfigService.btc.walletService.local.url
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
        url: appConfigService.btc.explorer.production.url,
        urlTx: appConfigService.btc.explorer.production.url + '/tx'
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
