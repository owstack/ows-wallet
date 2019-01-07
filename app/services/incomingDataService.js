'use strict';

angular.module('owsWalletApp.services').factory('incomingDataService', function($log, $state, $timeout, $ionicHistory, $rootScope, scannerService, appConfig, gettextCatalog, networkService) {

  var root = {};

  root.showMenu = function(data) {
    $rootScope.$broadcast('incomingDataMenu.showMenu', data);
  };

  root.process = function(data, opts, cb) {
    cb = cb || function(){};
    opts = opts || {};

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

    function goSend(networkName, address, amount, message) {
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
            networkName: networkName
          });

        } else {

          $state.transitionTo($rootScope.sref('send.amount'), {
            toAddress: address,
            networkName: networkName
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
        networkName: payProDetails.networkName,
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

    function handleResult(type, parsedResult) {
      cb(false, {
        type: type,
        rawData: data,
        parsed: parsedResult
      });
    };

    function tryResolveNonPayment() {
      data = sanitizeUri(data);

      // Join
      if (data && data.match(joinMatchRE)) {
        if (opts.parseOnly) {
          return handleResult('wallet-join-invitation');
        }

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
        if (opts.parseOnly) {
          return handleResult('wallet-export-blob');
        }

        $state.go($rootScope.sref('home')).then(function() {
          $state.transitionTo($rootScope.sref('add.import'), {
            code: data
          });
        });
        return cb(true);

      // App URL
      } else if (data && data.indexOf(appConfig.nameNoSpace + '://') === 0) {
        if (opts.parseOnly) {
          return handleResult('app-url');
        }

        $rootScope.$emit('Local/IncomingAppURL', data);
        return true;

      // Plain web address
      } else if (/^https?:\/\//.test(data)) {
        if (opts.parseOnly) {
          return handleResult('url');
        }

        root.showMenu({
          data: data,
          type: 'url'
        });
        return cb(true);

      // Email address
      } else if (/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(data)) {
        if (opts.parseOnly) {
          return handleResult('email');
        }

        root.showMenu({
          data: data,
          type: 'email'
        });
        return cb(true);

      // Text
      } else if ($state.includes($rootScope.sref('scan'))) {
        if (opts.parseOnly) {
          return handleResult('text');
        }

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
        return cb(false, result);
      }

      if (result.match) {
        if (opts.parseOnly) {
          return handleResult('payment-data', result);
        }

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
          if (!result.isPaymentRequest && $state.includes($rootScope.sref('scan'))) {
            // Show menu of options for handling the currency address.
            var network = networkService.getNetworkByName(result.networkName);
            root.showMenu({
              networkName: result.networkName,
              currency: network.currency,
              currencyLabel: network.shortLabel,
              data: data,
              type: 'cryptoAddress'
            });

          } else {
            goSend(result.networkName, result.address, result.amount, result.message);
          }
        }

        return cb(true);

      } else {

        // No match with a curreny network. Try other options.
        tryResolveNonPayment();
      }
    });

  };

  return root;
});
