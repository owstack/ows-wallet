'use strict';

angular.module('owsWalletApp.services').factory('ltcTestnet', function(lodash, gettextCatalog, appConfigService, networkHelpers, ltcWalletClient) {
  var root = {};

  root.definition = {
    currency: 'ltc',
    net: 'testnet',
    name: 'Litecoin',
    protocol: 'litecoin',
    getURI: function() { return networkHelpers.getURI(this) },
    getCurrencyLabel: function() { return networkHelpers.getCurrencyLabel(this) },
    getCurrencyLongLabel: function() { return networkHelpers.getCurrencyLongLabel(this) },
    getNetLabel: function() { return networkHelpers.getNetLabel(this) },
    getFriendlyNetLabel: function() { return networkHelpers.getFriendlyNetLabel(this) },
    walletClient: {
      service: ltcWalletClient
    },
    walletService: {
      production: {
        url: appConfigService.ltc.walletService.production.url
      },
      staging: {
        url: appConfigService.ltc.walletService.staging.url
      },
      local: {
        url: appConfigService.ltc.walletService.local.url
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
      name: 'LTC',
      shortName: 'LTC',
      value: 100000000,
      decimals: 8,
      code: 'ltc',
      kind: 'standard',
      userSelectable: true
    }, {
      name: 'bits (1,000,000 bits = 1LTC)',
      shortName: 'bits',
      value: 100,
      decimals: 2,
      code: 'bit',
      kind: 'alternative',
      userSelectable: true
    }, {
      name: 'satoshi (100,000,000 satoshi = 1LTC)',
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
        heading: gettextCatalog.getString('Litecoin transactions include a fee collected by miners on the network.'),
        description: gettextCatalog.getString('The higher the fee, the greater the incentive a miner has to include the transaction in a block. Current fees are determined based on network load and the selected policy.'),
        units: gettextCatalog.getString('Fees are expressed in units \'cost per byte\' (of the transaction message size) and estimate the number of blocks (converted to time) it may take to get the transaction included in a block.')
      }
    }
  };
  
  return root;
});
