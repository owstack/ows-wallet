'use strict';

angular.module('owsWalletApp.services').factory('incomingDataService', function($log, $state, $timeout, $ionicHistory, $rootScope, scannerService, appConfig, popupService, gettextCatalog, networkService, pluginService) {

  var root = {};

  root.showMenu = function(data) {
    $rootScope.$broadcast('incomingDataMenu.showMenu', data);
  };

  root.redir = function(data, cb) {
    cb = cb || function(){};

    $log.debug('Processing incoming data: ' + data);

    var joinMatch = '/^' + appConfig.appUri + ':[0-9A-HJ-NP-Za-km-z]{70,80}$/';
    var joinMatchRE = new RegExp(joinMatch);

    function sanitizeUri(data) {
      // Fixes when a region uses comma to separate decimals
      var regex = /[\?\&]amount=(\d+([\,\.]\d+)?)/i;
      var match = regex.exec(data);
      if (!match || match.length === 0) {
        return data;
      }
      var value = match[0].replace(',', '.');
      var newUri = data.replace(regex, value);

      // mobile devices, uris like owswallet://blah
      newUri.replace('://', ':');

      return newUri;
    };

    function goSend(networkURI, address, amount, message) {
      scannerService.pausePreview();

      $state.go($rootScope.sref('send'), {}, {
        'notify': $state.current.name == $rootScope.sref('send') ? false : true
      });

      // Timeout is required to enable the "Back" button (set ionic back view)
      $timeout(function() {
        if (amount) {

           $state.transitionTo($rootScope.sref('send.confirm'), {
            toAmount: amount,
            toAddress: address,
            description: message,
            networkURI: networkURI
          });

        } else {

          $state.transitionTo($rootScope.sref('send.amount'), {
            toAddress: address,
            networkURI: networkURI
          });
        }
      });
    };

    function handlePayPro(payProDetails) {
      scannerService.pausePreview();

      var stateParams = {
        toAmount: payProDetails.amount,
        toAddress: payProDetails.toAddress,
        description: payProDetails.memo,
        networkURI: payProDetails.networkURI,
        paypro: payProDetails
      };

      $state.go($rootScope.sref('send'), {}, {
        'notify': $state.current.name == $rootScope.sref('send') ? false : true
      }).then(function() {
        $timeout(function() {
          $state.transitionTo($rootScope.sref('send.confirm'), stateParams);
        });
      });
    };

    function tryResolveNonPayment(data) {
      data = sanitizeUri(data);

      // Join
      if (data && data.match(joinMatchRE)) {
        $state.go($rootScope.sref('home'), {}, {
          'notify': $state.current.name == $rootScope.sref('home') ? false : true
        }).then(function() {
          $state.transitionTo($rootScope.sref('add.join'), {
            url: data
          });
        });
        return cb(true);

      // QR Code Export feature
      } else if (data && ((data.substring(0, 2) == '1|') || (data.substring(0, 2) == '2|') || (data.substring(0, 2) == '3|'))) {
        $state.go($rootScope.sref('home')).then(function() {
          $state.transitionTo($rootScope.sref('add.import'), {
            code: data
          });
        });
        return cb(true);

      // App URL
      } else if (data && data.indexOf(appConfig.nameNoSpace + '://') === 0) {
        // App does not currently recieve any app URL events.
        // Broadcast the event to all plugins.
        pluginService.broadcastEvent({
          type: 'incoming-data',
          data: data
        });
        return true;

      // Plain web address
      } else if (/^https?:\/\//.test(data)) {
        root.showMenu({
          data: data,
          type: 'url'
        });
        return cb(true);

      // Text
      } else if ($state.includes($rootScope.sref('scan'))) {
        root.showMenu({
          data: data,
          type: 'text'
        });
      }

      return cb(false);
    };

    // Attempt to resolve the data into a payment request for a specific network.
    networkService.tryResolve(data, function(result) {

      if (result.match && result.error) {
        $log.debug('Scanning data error: ' + JSON.stringify(result));
        popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Payment instruction not recognized.'));
        return cb(false);
      }

      if (result.match) {
        if (result.paypro) {

          handlePayPro(result.paypro);

        } else if (result.privateKey) {

          root.showMenu({
            data: data,
            type: 'privateKey'
          });

        } else {

          // If we're scanning the address from the scan view then present options for the user.
          // Otherwise, redirect to the send view.
          if ($state.includes($rootScope.sref('scan'))) {
            // Show menu of options for handling the currency address.
            var network = networkService.getNetworkByURI(result.networkURI);
            root.showMenu({
              networkURI: result.networkURI,
              currency: network.currency,
              currencyLabel: network.getFriendlyNetLabel(),
              data: data,
              type: 'cryptoAddress'
            });

          } else {
            goSend(result.networkURI, result.address, result.amount, result.message);
          }
        }

        return cb(true);

      } else {

        // No match with a curreny network. Try other options.
        tryResolveNonPayment(data);
      }
    });

  };

  return root;
});
