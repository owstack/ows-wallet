'use strict';

angular.module('owsWalletApp.services').factory('payproService', function($log, $timeout, gettextCatalog, ongoingProcessService) {

  var root = {};

  var CACHE_RETRY_INTERVAL = 500;
  var CACHE_RETRY_LIMIT = 3;

  var cache = {};
  var cacheState = {};

  root.getPayProDetails = function(uri, network, cb, disableLoader) {
    cb = cb || function() {};

    if (cache[uri]) {
      $log.debug('PayPro cache hit: ', uri);
      return cb(null, cache[uri]);
    }

    // Only fetch paypro details once per app session.
    // Retry if in-progress call has not returned. Stop waiting after a few tries,  clear the cache, and retry a long request.
    cacheState[uri] = cacheState[uri] || {};

    if (cacheState[uri].status == 'in-progress') {
      cacheState[uri].attempts = cacheState[uri].attempts++ || 1;

      if (cacheState[uri].attempts <= CACHE_RETRY_LIMIT) {
        $timeout(function() {
          root.getPayProDetails(uri, network, cb, disableLoader);
        }, CACHE_RETRY_INTERVAL);

        return;

      } else {
        delete cacheState[uri];
        return root.getPayProDetails(uri, network, cb, disableLoader);        
      }
    }

    cacheState[uri].status = 'in-progress';

    $log.debug('Fetch PayPro request: ', uri);

    if (!disableLoader) {
      ongoingProcessService.set('fetchingPayPro', true);
    }

    network.walletClient.service.getPayPro().get({
      url: uri
    }, function(err, paypro) {
      if (!disableLoader) {
        ongoingProcessService.set('fetchingPayPro', false);
      }

      if (err) {
        return cb(err);

      } else if (!paypro.verified) {
        $log.warn('Failed to verify payment protocol signatures');
        return cb(gettextCatalog.getString('Payment Protocol Invalid'));
      }

      // Cache the result.
      cache[uri] = paypro;

      return cb(null, paypro);
    });
  };

  return root;
});
