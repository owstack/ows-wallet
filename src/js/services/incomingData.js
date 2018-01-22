'use strict';

angular.module('owsWalletApp.services').factory('incomingData', function($log, $state, $timeout, $ionicHistory, $rootScope, payproService, scannerService, appConfigService, popupService, gettextCatalog, networkService) {

  var root = {};
  var bchLib = networkService.walletClientFor('livenet/bch').getLib(); // TODO: make this extensible
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
    }

    function getParameterByName(name, url) {
      if (!url) return;
      name = name.replace(/[\[\]]/g, "\\$&");
      var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
      if (!results) return null;
      if (!results[2]) return '';
      return decodeURIComponent(results[2].replace(/\+/g, " "));
    }

    function checkPrivateKey(privateKey) {
      try {
          btcLib.PrivateKey(privateKey, 'livenet'); // TODO: support more than btc
      } catch (err) {
        return false;
      }
      return true;
    }

    function goSend(addr, amount, message, networkURI) {
      $state.go('tabs.send', {}, {
        'reload': true,
        'notify': $state.current.name == 'tabs.send' ? false : true
      });
      // Timeout is required to enable the "Back" button
      $timeout(function() {
        if (amount) {
          $state.transitionTo('tabs.send.confirm', {
            toAmount: amount,
            toAddress: addr,
            description: message,
            networkURI: networkURI
          });
        } else {
          $state.transitionTo('tabs.send.amount', {
            toAddress: addr,
            networkURI: networkURI
          });
        }
      }, 100);
    }
    // Data extensions for Payment Protocol with non-backwards-compatible request.
    // TODO: does not support detecting testnets.
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
              goSend(addr, amount, message);
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
          goSend(addr, amount, message, networkURI);
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
              goSend(addr, amount, message);
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
          goSend(addr, amount, message, networkURI);
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
      if ($state.includes('tabs.scan')) {
        root.showMenu({
          networkURI: networkURI,
          currency: networkService.getNetworkByURI(networkURI).currency,
          data: data,
          type: 'cryptoAddress'
        });
      } else {
        goToAmountPage(data, networkURI);
      }
    // Plain bitcoincash address
    } else if (bchLib.Address.isValid(data, 'livenet') || bchLib.Address.isValid(data, 'testnet')) {
      var addrNetwork = bchLib.Address(data).network;
      var networkURI = networkService.getURIForAddrNetwork(addrNetwork);
      if ($state.includes('tabs.scan')) {
        root.showMenu({
          networkURI: networkURI,
          currency: networkService.getNetworkByURI(networkURI).currency,
          data: data,
          type: 'cryptoAddress'
        });
      } else {
        goToAmountPage(data, networkURI);
      }
    // Join
    } else if (data && data.match(joinMatchRE)) {
      $state.go('tabs.home', {}, {
        'reload': true,
        'notify': $state.current.name == 'tabs.home' ? false : true
      }).then(function() {
        $state.transitionTo('tabs.add.join', {
          url: data
        });
      });
      return true;

    // Old join
    } else if (data && data.match(/^[0-9A-HJ-NP-Za-km-z]{70,80}$/)) {
      $state.go('tabs.home', {}, {
        'reload': true,
        'notify': $state.current.name == 'tabs.home' ? false : true
      }).then(function() {
        $state.transitionTo('tabs.add.join', {
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
      $state.go('tabs.home').then(function() {
        $state.transitionTo('tabs.add.import', {
          code: data
        });
      });
      return true;

    // Text
    } else {
      if ($state.includes('tabs.scan')) {
        root.showMenu({
          data: data,
          type: 'text'
        });
      }
    }

    return false;
  };

  function goToAmountPage(toAddress, networkURI) {
    $state.go('tabs.send', {}, {
      'reload': true,
      'notify': $state.current.name == 'tabs.send' ? false : true
    });
    $timeout(function() {
      $state.transitionTo('tabs.send.amount', {
        networkURI: networkURI,
        toAddress: toAddress
      });
    }, 100);
  }

  function handlePayPro(payProDetails) {
    var stateParams = {
      toAmount: payProDetails.amount,
      toAddress: payProDetails.toAddress,
      description: payProDetails.memo,
      networkURI: payProDetails.networkURI,
      paypro: payProDetails
    };
    scannerService.pausePreview();
    $state.go('tabs.send', {}, {
      'reload': true,
      'notify': $state.current.name == 'tabs.send' ? false : true
    }).then(function() {
      $timeout(function() {
        $state.transitionTo('tabs.send.confirm', stateParams);
      });
    });
  }

  return root;
});
