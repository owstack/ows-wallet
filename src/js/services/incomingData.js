'use strict';

angular.module('owsWalletApp.services').factory('incomingData', function($log, $state, $timeout, $ionicHistory, $rootScope, payproService, scannerService, appConfigService, popupService, gettextCatalog, networkService) {

  var root = {};

  root.showMenu = function(data) {
    $rootScope.$broadcast('incomingDataMenu.showMenu', data);
  };

  root.redir = function(data) {
    $log.debug('Processing incoming data: ' + data);

    var bchLib = networkService.walletClientFor('livenet/bch').getLib(); // TODO: make this extensible
    var btcLib = networkService.walletClientFor('livenet/btc').getLib();

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
    // data extensions for Payment Protocol with non-backwards-compatible request
    if ((/^bitcoin(cash)?:\?r=[\w+]/).exec(data)) {
      data = decodeURIComponent(data.replace(/bitcoin(cash)?:\?r=/, ''));
      $state.go('tabs.send', {}, {
        'reload': true,
        'notify': $state.current.name == 'tabs.send' ? false : true
      }).then(function() {
        $state.transitionTo('tabs.send.confirm', {
          paypro: data
        });
      });
      return true;
    }

    data = sanitizeUri(data);

    // BIP21 - bitcoin URL
    if (btcLib.URI.isValid(data)) {
      var parsed = btcLib.URI(data);

      var addr = parsed.address ? parsed.address.toString() : '';
      var message = parsed.message;
      var addrNetwork = parsed.network;

      var amount = parsed.amount ? parsed.amount : '';

      if (parsed.r) {
        payproService.getPayProDetails(parsed.r, function(err, details) {
          if (err) {
            if (addr && amount) goSend(addr, amount, message);
            else popupService.showAlert(gettextCatalog.getString('Error'), err);
          } else handlePayPro(details);
        });
      } else {
        var networkURI = networkService.getURIForAddrNetwork(addrNetwork);
        goSend(addr, amount, message, networkURI);
      }
      return true;

    // BIP21 - bitcoincash URL
    } else if (bchLib.URI.isValid(data)) {
      var parsed = bchLib.URI(data);

      var addr = parsed.address ? parsed.address.toString() : '';
      var addrNetwork = parsed.network;
      var message = parsed.message;

      var amount = parsed.amount ? parsed.amount : '';

      if (parsed.r) {
        payproService.getPayProDetails(parsed.r, function(err, details) {
          if (err) {
            if (addr && amount) goSend(addr, amount, message);
            else popupService.showAlert(gettextCatalog.getString('Error'), err);
          } else handlePayPro(details);
        });
      } else {
        var networkURI = networkService.getURIForAddrNetwork(addrNetwork);
        goSend(addr, amount, message, networkURI);
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
          data: data,
          type: 'bitcoinAddress'
        });
      } else {
        goToAmountPage(data, networkURI);
      }
    // Plain bitcoincash address
    } else if (bchLib.Address.isValid(data, 'livenet') || bchLib.Address.isValid(data, 'testnet')) {
      var addrNetwork = btcLib.Address(data).network;
      var networkURI = networkService.getURIForAddrNetwork(addrNetwork);
      if ($state.includes('tabs.scan')) {
        root.showMenu({
          networkURI: networkURI,
          data: data,
          type: 'bitcoinAddress'
        });
      } else {
        goToAmountPage(data, networkURI);
      }
    // Join
    } else if (data && data.match(/^owswallet:[0-9A-HJ-NP-Za-km-z]{70,80}$/)) {
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
        networkURI: (btcLib.Address.isValid(toAddress, 'livenet/btc') ? 'livenet/btc' : 'testnet/btc'),
        toAddress: toAddress
      });
    }, 100);
  }

  function handlePayPro(payProDetails) {
    var stateParams = {
      toAmount: payProDetails.amount,
      toAddress: payProDetails.toAddress,
      description: payProDetails.memo,
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
