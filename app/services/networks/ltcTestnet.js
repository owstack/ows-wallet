'use strict';

angular.module('owsWalletApp.services').factory('ltcTestnet', function(lodash, gettextCatalog, appConfig, networkHelpers, ltcWalletClient) {
  var root = {};

  root.definition = {
    currency: 'ltc',
    isoCode: 'XLT',
    net: 'testnet',
    name: 'Litecoin',
    protocol: 'litecoin',
    getURI: function() { return networkHelpers.getURI(this) },
    getCurrencyLabel: function() { return networkHelpers.getCurrencyLabel(this) },
    getCurrencyLongLabel: function() { return networkHelpers.getCurrencyLongLabel(this) },
    getNetLabel: function() { return networkHelpers.getNetLabel(this) },
    getFriendlyNetLabel: function() { return networkHelpers.getFriendlyNetLabel(this) },
    tryResolve: function(data, cb) { return networkHelpers.tryResolve(data, this, cb) },
    walletClient: {
      service: ltcWalletClient
    },
    walletService: {
      production: {
        url: appConfig.networks.ltc.walletService.production.url
      },
      staging: {
        url: appConfig.networks.ltc.walletService.staging.url
      },
      local: {
        url: appConfig.networks.ltc.walletService.local.url
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
        url: appConfig.networks.btc.explorer.production.url,
        urlTx: appConfig.networks.btc.explorer.production.url + '/tx'
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
      name: 'photons (1,000,000 photons = 1LTC)',
      shortName: 'photons',
      value: 100,
      decimals: 2,
      code: 'pho',
      kind: 'alternative',
      userSelectable: true
    }, {
      name: 'litoshi (100,000,000 litoshi = 1LTC)',
      shortName: 'litoshis',
      value: 1,
      decimals: 0,
      code: 'lit',
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
