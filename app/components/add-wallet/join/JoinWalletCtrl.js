'use strict';

angular.module('owsWalletApp.controllers').controller('JoinWalletCtrl',
  function($scope, $rootScope, $timeout, $state, $ionicHistory, $ionicScrollDelegate, profileService, configService, gettextCatalog, lodash, ledgerService, trezorService, derivationPathService, ongoingProcessService, walletService, $log, $stateParams, popupService) {

    var configNetwork = configService.getSync().currencyNetworks;

    $scope.$on("$ionicView.beforeEnter", function(event, data) {
      var defaults = configService.getDefaults();
      $scope.formData = {};
      $scope.formData.account = 1;
      $scope.formData.secret = null;
      resetPasswordFields();
      updateSeedSourceSelect();
    });

    $scope.onSecretChange = function() {
      // Provide default values for fields that depend on the network.
      $scope.formData.walletServiceUrl = '';
      $scope.formData.derivationPath = '';
      $scope.networkLabel = undefined;
      
      profileService.getNetworkFromJoinSecret($scope.formData.secret, function(err, network) {
        if (err) {
          return;
        }
        $scope.formData.walletServiceUrl = configNetwork[network.getURI()].walletService.url;
        $scope.formData.derivationPath = derivationPathService.getPath(network);
        $scope.networkLabel = network.getFriendlyNetLabel();
      });
    };

    $scope.showAdvChange = function() {
      $scope.showAdv = !$scope.showAdv;
      $scope.encrypt = null;
      $scope.resizeView();
    };

    $scope.checkPassword = function(pw1, pw2) {
      if (pw1 && pw1.length > 0) {
        if (pw2 && pw2.length > 0) {
          if (pw1 == pw2) $scope.result = 'correct';
          else {
            $scope.formData.passwordSaved = null;
            $scope.result = 'incorrect';
          }
        } else
          $scope.result = null;
      } else
        $scope.result = null;
    };

    $scope.resizeView = function() {
      $timeout(function() {
        $ionicScrollDelegate.resize();
      }, 10);
      resetPasswordFields();
    };

    function resetPasswordFields() {
      $scope.formData.passphrase = null;
      $scope.formData.createPassphrase = null;
      $scope.formData.passwordSaved = null;
      $scope.formData.repeatPassword = null;
      $scope.result = null;
      $timeout(function() {
        $scope.$apply();
      });
    };

    $scope.onQrCodeScannedJoin = function(data) {
      $scope.formData.secret = data;
      $scope.$apply();
    };

    if ($stateParams.url) {
      var data = $stateParams.url;
      data = data.replace('owswallet:', '');
      $scope.onQrCodeScannedJoin(data);
    }

    function updateSeedSourceSelect() {
      $scope.seedOptions = [{
        id: 'new',
        label: gettextCatalog.getString('Random'),
      }, {
        id: 'set',
        label: gettextCatalog.getString('Specify Recovery Phrase...'),
      }];

      $scope.formData.seedSource = $scope.seedOptions[0];

      if (walletService.externalSource.ledger.supported) {
        $scope.seedOptions.push({
          id: walletService.externalSource.ledger.id,
          label: walletService.externalSource.ledger.longName
        });
      }

      if (walletService.externalSource.trezor.supported) {
        $scope.seedOptions.push({
          id: walletService.externalSource.trezor.id,
          label: walletService.externalSource.trezor.longName
        });
      }
    };

    $scope.join = function() {
      // Get the network URI for the wallet we're joining
      profileService.getNetworkFromJoinSecret($scope.formData.secret, function(err, network) {
        if (err) {
          popupService.showAlert(gettextCatalog.getString('Error'), err);
          return;
        }

        var opts = {
          secret: $scope.formData.secret,
          myName: $scope.formData.myName,
          walletServiceUrl: $scope.formData.walletServiceUrl,
          network: network
        }

        var setSeed = $scope.formData.seedSource.id == 'set';
        if (setSeed) {
          var words = $scope.formData.privateKey;
          if (words.indexOf(' ') == -1 && words.indexOf('prv') == 1 && words.length > 108) {
            opts.extendedPrivateKey = words;
          } else {
            opts.mnemonic = words;
          }
          opts.passphrase = $scope.formData.passphrase;

          var pathData = derivationPathService.parse($scope.formData.derivationPath, opts.network);
          if (!pathData || (pathData.networkURI != opts.network.getURI())) {
            popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Invalid derivation path'));
            return;
          }

          opts.account = pathData.account;
          opts.derivationStrategy = pathData.derivationStrategy;
        } else {
          opts.passphrase = $scope.formData.createPassphrase;
        }

        opts.walletPrivKey = $scope._walletPrivKey; // Only for testing

        if (setSeed && !opts.mnemonic && !opts.extendedPrivateKey) {
          popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Please enter the wallet recovery phrase'));
          return;
        }

        if ($scope.formData.seedSource.id == walletService.externalSource.ledger.id || $scope.formData.seedSource.id == walletService.externalSource.trezor.id) {
          var account = $scope.formData.account;
          if (!account || account < 1) {
            popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Invalid account number'));
            return;
          }

          if ($scope.formData.seedSource.id == walletService.externalSource.trezor.id) {
            account = account - 1;
          }

          opts.account = account;
          opts.isMultisig = true;
          ongoingProcessService.set('connecting' + $scope.formData.seedSource.id, true);

          var service;
          switch ($scope.formData.seedSource.id) {
            case walletService.externalSource.ledger.id:
              service = ledgerService;
              break;
            case walletService.externalSource.trezor.id:
              service = trezorService;
              break;
            default:
              popupService.showAlert(gettextCatalog.getString('Error'), 'Invalid seed source id');
              return;
          }

          service.getInfoForNewWallet(true, account, 'livenet/btc', function(err, lopts) {
            ongoingProcessService.set('connecting' + $scope.formData.seedSource.id, false);
            if (err) {
              popupService.showAlert(gettextCatalog.getString('Error'), err);
              return;
            }
            opts = lodash.assign(lopts, opts);
            _join(opts);
          });
        } else {

          _join(opts);
        }
      });
    };

    function _join(opts) {
      ongoingProcessService.set('joiningWallet', true);
      $timeout(function() {
        profileService.joinWallet(opts, function(err, client) {
          ongoingProcessService.set('joiningWallet', false);
          if (err) {
            popupService.showAlert(gettextCatalog.getString('Error'), err);
            return;
          }

          walletService.updateRemotePreferences(client);
          $ionicHistory.removeBackView();

          if (!client.isComplete()) {
            $ionicHistory.nextViewOptions({
              disableAnimate: true
            });
            $state.go($rootScope.sref('home'));
            $timeout(function() {
              $state.transitionTo($rootScope.sref('copayers'), {
                walletId: client.credentials.walletId
              });
            });
          } else $state.go($rootScope.sref('home'));
        });
      });
    };
  });
