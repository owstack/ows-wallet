'use strict';

angular.module('owsWalletApp.services').factory('txFormatService', function($filter, rateService, configService, lodash, networkService) {
  var root = {};

  root.formatAmount = function(networkName, atomics, opts) {
    var network = networkService.getNetworkByName(networkName);

    var config = configService.getSync().networkPreferences[networkName];
    if (config.unitCode == network.Unit().atomicsCode()) {
      return atomics;
    }

    return network.utils.formatAmount(atomics, config.unitCode, opts);
  };

  root.formatAmountStr = function(networkName, atomics) {
    if (isNaN(atomics)) {
      return;
    }
    var network = networkService.getNetworkByName(networkName);
    var networkPreferences = configService.getSync().networkPreferences[networkName];
    var unitName = lodash.find(network.Unit().units, function(u) {
      return u.code == networkPreferences.unitCode;
    }).shortName;

    return root.formatAmount(networkName, atomics) + ' ' + unitName;
  };

  root.toFiat = function(networkName, atomics, code, cb) {
    if (isNaN(atomics)) {
      return;
    }
    var val = function() {
      var v1 = rateService.toFiat(networkName, atomics, code);
      if (!v1) {
        return null;
      }

      return v1.toFixed(2);
    };

    // Async version
    if (cb) {
      rateService.whenAvailable(function() {
        return cb(val());
      });
    } else {
      if (!rateService.isAvailable()) {
        return null;
      }
      return val();
    };
  };

  root.formatToUSD = function(networkName, atomics, cb) {
    if (isNaN(atomics)) {
      return;
    }
    var val = function() {
      var v1 = rateService.toFiat(networkName, atomics, 'USD');
      if (!v1) {
        return null;
      }

      return v1.toFixed(2);
    };

    // Async version
    if (cb) {
      rateService.whenAvailable(function() {
        return cb(val());
      });
    } else {
      if (!rateService.isAvailable()) {
        return null;
      }
      return val();
    };
  };

  root.formatAlternativeStr = function(networkName, atomics, cb) {
    if (isNaN(atomics)) {
      return;
    }
    var config = configService.getSync().networkPreferences[networkName];

    var val = function() {
      var v1 = parseFloat((rateService.toFiat(networkName, atomics, config.alternativeIsoCode)).toFixed(2));
      v1 = $filter('formatFiatAmount')(v1);
      if (!v1) {
        return null;
      }

      return v1 + ' ' + config.alternativeIsoCode;
    };

    // Async version
    if (cb) {
      rateService.whenAvailable(function() {
        return cb(val());
      });
    } else {
      if (!rateService.isAvailable()) {
        return null;
      }
      return val();
    };
  };

  root.processTx = function(tx, networkName) {
    if (!tx || tx.action == 'invalid') {
      return tx;
    }

    // New transaction output format
    if (tx.outputs && tx.outputs.length) {

      var outputsNr = tx.outputs.length;

      if (tx.action != 'received') {
        if (outputsNr > 1) {
          tx.recipientCount = outputsNr;
          tx.hasMultiplesOutputs = true;
        }
        tx.amount = lodash.reduce(tx.outputs, function(total, o) {
          o.amountStr = root.formatAmountStr(networkName, o.amount);
          o.alternativeAmountStr = root.formatAlternativeStr(networkName, o.amount);
          return total + o.amount;
        }, 0);
      }
      tx.toAddress = tx.outputs[0].toAddress;
    }

    tx.amountStr = root.formatAmountStr(networkName, tx.amount);
    tx.alternativeAmountStr = root.formatAlternativeStr(networkName, tx.amount);
    tx.feeStr = root.formatAmountStr(networkName, tx.fee || tx.fees);

    if (tx.amountStr) {
      tx.amountValueStr = tx.amountStr.split(' ')[0];
      tx.amountAtomicStr = tx.amountStr.split(' ')[1];
    }

    return tx;
  };

  root.parseAmount = function(networkName, amount, currency) {
    var config = configService.getSync().networkPreferences[networkName];
    var amountUnitStr;
    var amountAtomic;
    var alternativeIsoCode = config.alternativeIsoCode;

    var allNetworkUnits = networkService.getNetworkByName(networkName).Unit().units;
    var networkUnit = lodash.find(allNetworkUnits, function(u) {
      return u.shortName == currency;
    });

    var network = networkService.getNetworkByName(networkName);

    var atomicUnit = network.Unit().atomicsName();
    var standardUnit = network.Unit().standardsName();

    if (!networkUnit && currency) { // Alternate currency
      amountAtomic = rateService.fromFiat(networkName, amount, currency).toFixed(atomicUnit.decimals);
      amountUnitStr = $filter('formatFiatAmount')(amount) + ' ' + currency;

    } else if (currency == atomicUnit.shortName) { // Atomic
      amountAtomic = amount;
      amountUnitStr = root.formatAmountStr(networkName, amountAtomic);
      // convert atomics to standard
      amount = (amountAtomic / standardUnit.value).toFixed(standardUnit.decimals);
      currency = standardUnit.shortName;

    } else { // Not atomic or fiat
      amountAtomic = network.Unit(amount, 'standard').toAtomic();
      amountUnitStr = root.formatAmountStr(networkName, amountAtomic);
      // convert atomics to standard
      amount = (amountAtomic / standardUnit.value).toFixed(standardUnit.decimals);
      currency = standardUnit.shortName;
    }

    return {
      amount: amount,
      currency: currency,
      alternativeIsoCode: alternativeIsoCode,
      amountAtomic: amountAtomic,
      amountUnitStr: amountUnitStr
    };
  };

  root.atomicToUnit = function(networkName, amount) {
    return networkService.getNetworkByName(networkName).Unit(amount, 'standard').toAtomic();
  };

  return root;
});
