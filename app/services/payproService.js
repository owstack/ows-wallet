'use strict';

angular.module('owsWalletApp.services').factory('payproService',
  function(profileService, gettextCatalog, ongoingProcessService, $log) {

    var ret = {};

    ret.getPayProDetails = function(uri, cb, disableLoader) {
      if (!cb) cb = function() {};

      var wallet = profileService.getWallets({
        onlyComplete: true
      })[0];

      if (!wallet) return cb();

      $log.debug('Fetch PayPro Request...', uri);

      if (!disableLoader) ongoingProcessService.set('fetchingPayPro', true);

      wallet.fetchPayPro({
        payProUrl: uri,
      }, function(err, paypro) {
        if (!disableLoader) ongoingProcessService.set('fetchingPayPro', false);
        if (err) return cb(err);
        else if (!paypro.verified) {
          $log.warn('Failed to verify payment protocol signatures');
          return cb(gettextCatalog.getString('Payment Protocol Invalid'));
        }
        return cb(null, paypro);
      });
    };

    return ret;
  });