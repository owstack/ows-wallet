'use strict';

angular.module('owsWalletApp.services').factory('payproService', function($log, $timeout, gettextCatalog, ongoingProcessService) {

  var root = {};

  var CACHE_RETRY_INTERVAL = 500;
  var CACHE_RETRY_LIMIT = 3;

  var cache = {};
  var cacheState = {};

  root.getPayProDetails = function(uri, network, cb, disableLoader) {
    cb = cb || function() {};
    var key = uri + network.getURI(); // Cache key

    if (cache[key]) {
      $log.debug('PayPro cache hit: ' + uri + ' (' + network.getURI() + ')');
      return cb(null, cache[key]);
    }

    // Only fetch paypro details once per app session.
    // Retry if in-progress call has not returned. Stop waiting after a few tries,  clear the cache, and retry a long request.
    cacheState[key] = cacheState[key] || {};

    if (cacheState[key].status == 'in-progress') {

      if (!cacheState[key].attempts) {
        cacheState[key].attempts = 1;
      } else {
        cacheState[key].attempts += 1;        
      }

      if (cacheState[key].attempts <= CACHE_RETRY_LIMIT) {
        $timeout(function() {
          root.getPayProDetails(uri, network, cb, disableLoader);
        }, CACHE_RETRY_INTERVAL);

        return;

      } else {
        delete cacheState[key];
        return root.getPayProDetails(uri, network, cb, disableLoader);        
      }
    }

    cacheState[key].status = 'in-progress';

    $log.debug('Attempting to fetch PayPro request for ' + network.getURI() + ' from ' +  uri);

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
      cache[key] = paypro;

      return cb(null, paypro);
    });
  };

  return root;
});
