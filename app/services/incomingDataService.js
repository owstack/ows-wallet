'use strict';

angular.module('owsWalletApp.services').factory('incomingDataService', function($log, $state, $timeout, $ionicHistory, $rootScope, payproService, scannerService, appConfigService, popupService, gettextCatalog, networkService, profileService) {

  var root = {};
  var bchLib = networkService.walletClientFor('livenet/bch').getLib(); // TODO-AJP: make this extensible
  var btcLib = networkService.walletClientFor('livenet/btc').getLib();

  root.showMenu = function(data) {
    $rootScope.$broadcast('incomingDataMenu.showMenu', data);
  };

  root.redir = function(data) {
    $log.debug('Processing incoming data: ' + data);

    var joinMatch = '/^' + appConfigService.appUri + ':[0-9A-HJ-NP-Za-km-z]{70,80}$/';
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

    function getParameterByName(name, url) {
      if (!url) return;
      name = name.replace(/[\[\]]/g, "\\$&");
      var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
      if (!results) return null;
      if (!results[2]) return '';
      return decodeURIComponent(results[2].replace(/\+/g, " "));
    };

    function checkPrivateKey(privateKey) {
      try {
          btcLib.PrivateKey(privateKey, 'livenet'); // TODO-AJP: support more than btc, would need to prompt for network
      } catch (err) {
        return false;
      }
      return true;
    };

    function goSend(networkURI, address, amount, message) {
      scannerService.pausePreview();

      if (amount) {
        $state.go($rootScope.sref('send'), {}, {
          'notify': $state.current.name == $rootScope.sref('send') ? false : true
        });

        // Timeout is required to enable the "Back" button
        $timeout(function() {
          $state.transitionTo($rootScope.sref('send.confirm'), {
            toAmount: amount,
            toAddress: address,
            description: message,
            networkURI: networkURI
          });
        }, 100);

      } else {

        if (!profileService.hasFunds({networkURI: networkURI})) {
          // No funds available, alert and redirect to home.
          popupService.showAlert(
            gettextCatalog.getString('Insufficient Funds'),
            gettextCatalog.getString('Cannot make payment from any wallet.'));

          return $state.go($rootScope.sref('home'));

        } else {

          // Greater than zero funds available.
          $state.transitionTo($rootScope.sref('send.amount'), {
            toAddress: address,
            networkURI: networkURI
          });
        }
      }
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

    // Data extensions for Payment Protocol with non-backwards-compatible request.
    // TODO-AJP: does not support detecting testnets.
    if ((/^bitcoin(cash)?:\?r=[\w+]/).exec(data)) {
      var protocol = data.split(':')[0];
      data = decodeURIComponent(data.replace(/bitcoin(cash)?:\?r=/, ''));

      payproService.getPayProDetails(data, function(err, details) {
        if (err) {
          popupService.showAlert(gettextCatalog.getString('Error'), err);
        } else {

          var addrNetwork;
          var err;

          switch (protocol) {
            case 'bitcoin': 
              if (btcLib.Address.isValid(details.toAddress, 'livenet') || btcLib.Address.isValid(details.toAddress, 'testnet')) {
                addrNetwork = btcLib.Address(details.toAddress).network;
              } else {
                err = gettextCatalog.getString('Payment instruction not recognized.');
              }
              break;

            case 'bitcoincash':
              if (bchLib.Address.isValid(details.toAddress, 'livenet')) {
                addrNetwork = bchLib.Address(details.toAddress).network;
              } else {
                err = gettextCatalog.getString('Payment instruction not recognized.');
              }
              break;

            default:
              err = gettextCatalog.getString('Payment instruction not recognized.');
              break;
          }

          if (err) {
            return popupService.showAlert(gettextCatalog.getString('Error'), err);
          }

          details.networkURI = networkService.getURIForAddrNetwork(addrNetwork);
          handlePayPro(details);
        }
      });
      return true;
    }

    data = sanitizeUri(data);

    // BIP21 - bitcoin URL
    if (btcLib.URI.isValid(data)) {
      var parsed = btcLib.URI(data);
      var addr = parsed.address ? parsed.address.toString() : '';
      var message = parsed.message;
      var amount = parsed.amount ? parsed.amount : '';
      var addrNetwork;

      if (parsed.r) {
        payproService.getPayProDetails(parsed.r, function(err, details) {
          if (err) {
            if (addr && amount) {
              goSend('', addr, amount, message);
            } else {
              popupService.showAlert(gettextCatalog.getString('Error'), err);
            }
          } else {

            if (btcLib.Address.isValid(details.toAddress, 'livenet') || btcLib.Address.isValid(details.toAddress, 'testnet')) {
              addrNetwork = btcLib.Address(details.toAddress).network;
              details.networkURI = networkService.getURIForAddrNetwork(addrNetwork);
              handlePayPro(details);
            } else {
              return popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Payment instruction not recognized.'));
            }
          }
        });
      } else {

        if (btcLib.Address.isValid(addr, 'livenet') || btcLib.Address.isValid(addr, 'testnet')) {
          addrNetwork = btcLib.Address(addr).network;
          var networkURI = networkService.getURIForAddrNetwork(addrNetwork);
          goSend(networkURI, addr, amount, message);
        } else {
          return popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Payment instruction not recognized.'));
        }
      }
      return true;

    // BIP21 - bitcoincash URL
    } else if (bchLib.URI.isValid(data)) {
      var parsed = bchLib.URI(data);
      var addr = parsed.address ? parsed.address.toString() : '';
      var message = parsed.message;
      var amount = parsed.amount ? parsed.amount : '';
      var addrNetwork;

      if (parsed.r) {
        payproService.getPayProDetails(parsed.r, function(err, details) {
          if (err) {
            if (addr && amount) {
              goSend('', addr, amount, message);
            } else {
              popupService.showAlert(gettextCatalog.getString('Error'), err);
            }
          } else {
            if (bchLib.Address.isValid(details.toAddress, 'livenet')) {
              addrNetwork = bchLib.Address(details.toAddress).network;
              details.networkURI = networkService.getURIForAddrNetwork(addrNetwork);
              handlePayPro(details);
            } else {
              return popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Payment instruction not recognized.'));
            }
          }
        });
      } else {

        if (bchLib.Address.isValid(addr, 'livenet')) {
          addrNetwork = bchLib.Address(addr).network;
          var networkURI = networkService.getURIForAddrNetwork(addrNetwork);
          goSend(networkURI, addr, amount, message);
        } else {
          return popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Payment instruction not recognized.'));
        }
      }
      return true;

    // Plain URL
    } else if (/^https?:\/\//.test(data)) {

      payproService.getPayProDetails(data, function(err, details) {
        if (err) {
          root.showMenu({
            data: data,
            type: 'url'
          });
          return;
        }

        var addrNetwork;
        if (btcLib.Address.isValid(details.toAddress, 'livenet') || btcLib.Address.isValid(details.toAddress, 'testnet')) {
          addrNetwork = btcLib.Address(details.toAddress).network;
        } else if (btcLib.Address.isValid(details.toAddress, 'livenet')) {
          addrNetwork = bchLib.Address(details.toAddress).network;
        } else {
          return popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Payment instruction not recognized.'));
        }

        details.networkURI = networkService.getURIForAddrNetwork(addrNetwork);
        handlePayPro(details);
        return true;
      });
    // Plain bitcoin address
    } else if (btcLib.Address.isValid(data, 'livenet') || btcLib.Address.isValid(data, 'testnet')) {
      var addrNetwork = btcLib.Address(data).network;
      var networkURI = networkService.getURIForAddrNetwork(addrNetwork);
      if ($state.includes($rootScope.sref('scan'))) {
        var network = networkService.getNetworkByURI(networkURI);
        root.showMenu({
          networkURI: networkURI,
          currency: network.currency,
          currencyLabel: network.getFriendlyNetLabel(),
          data: data,
          type: 'cryptoAddress'
        });
      } else {
        goSend(networkURI, data);
      }
    // Plain bitcoincash address
    } else if (bchLib.Address.isValid(data, 'livenet') || bchLib.Address.isValid(data, 'testnet')) {
      var addrNetwork = bchLib.Address(data).network;
      var networkURI = networkService.getURIForAddrNetwork(addrNetwork);
      if ($state.includes($rootScope.sref('scan'))) {
        root.showMenu({
          networkURI: networkURI,
          currency: networkService.getNetworkByURI(networkURI).currency,
          data: data,
          type: 'cryptoAddress'
        });
      } else {
        goSend(networkURI, data);
      }
    // Join
    } else if (data && data.match(joinMatchRE)) {
      $state.go($rootScope.sref('home'), {}, {
        'notify': $state.current.name == $rootScope.sref('home') ? false : true
      }).then(function() {
        $state.transitionTo($rootScope.sref('add.join'), {
          url: data
        });
      });
      return true;

    // Old join
    } else if (data && data.match(/^[0-9A-HJ-NP-Za-km-z]{70,80}$/)) {
      $state.go($rootScope.sref('home'), {}, {
        'notify': $state.current.name == $rootScope.sref('home') ? false : true
      }).then(function() {
        $state.transitionTo($rootScope.sref('add.join'), {
          url: data
        });
      });
      return true;

    // Private key
    } else if (data && (data.substring(0, 2) == '6P' || checkPrivateKey(data))) {
      root.showMenu({
        data: data,
        type: 'privateKey'
      });

    //
    } else if (data && ((data.substring(0, 2) == '1|') || (data.substring(0, 2) == '2|') || (data.substring(0, 2) == '3|'))) {
      $state.go($rootScope.sref('home')).then(function() {
        $state.transitionTo($rootScope.sref('add.import'), {
          code: data
        });
      });
      return true;

    // Text
    } else {
      if ($state.includes($rootScope.sref('scan'))) {
        root.showMenu({
          data: data,
          type: 'text'
        });
      }
    }

    return false;
  };

  return root;
});
