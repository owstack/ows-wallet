'use strict';

angular.module('owsWalletApp.controllers').controller('CreateWalletCtrl',
  function($scope, $rootScope, $timeout, $log, lodash, $state, $ionicScrollDelegate, $ionicHistory, profileService, configService, gettextCatalog, ledgerService, trezorService, derivationPathService, ongoingProcessService, walletService, popupService, pushNotificationsService, networkService, featureService) {

    /* For compressed keys, m*73 + n*34 <= 496 */
    var COPAYER_PAIR_LIMITS = {
      1: 1,
      2: 2,
      3: 3,
      4: 4,
      5: 4,
      6: 4,
      7: 3,
      8: 3,
      9: 2,
      10: 2,
      11: 1,
      12: 1,
    };

    var defaults = configService.getDefaults();
    var configNetwork = configService.getSync().currencyNetworks;

    $scope.$on("$ionicView.beforeEnter", function(event, data) {
      $scope.formData = {};
      var tc = $state.current.name == $rootScope.sref('add.create-personal') ? 1 : defaults.wallet.totalCopayers;
      $scope.formData.account = 1;
      $scope.TCValues = lodash.range(2, defaults.limits.totalCopayers + 1);

      var defaultNetwork = networkService.getNetworkByURI(configNetwork.default);
      $scope.formData.network = defaultNetwork;
      $scope.availableNetworks = networkService.getNetworks();
      $scope.formData.walletServiceUrl = defaults.currencyNetworks[$scope.formData.network.getURI()].walletService.url;
      $scope.formData.derivationPath = derivationPathService.getPath($scope.formData.network);
      $scope.setTotalCopayers(tc);
      $scope.showAdv = false;
      updateRCSelect(tc);
      resetPasswordFields();
    });

    $scope.onNetworkChange = function() {
      $scope.formData.derivationPath = derivationPathService.getPath($scope.formData.network);
      $scope.formData.walletServiceUrl = defaults.currencyNetworks[$scope.formData.network.getURI()].walletService.url;
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
      $scope.formData.passphrase = $scope.formData.createPassphrase = $scope.formData.passwordSaved = $scope.formData.repeatPassword = $scope.result = null;
      $timeout(function() {
        $scope.$apply();
      });
    };

    function updateRCSelect(n) {
      $scope.formData.totalCopayers = n;
      var maxReq = COPAYER_PAIR_LIMITS[n];
      $scope.RCValues = lodash.range(1, maxReq + 1);
      $scope.formData.requiredCopayers = Math.min(parseInt(n / 2 + 1), maxReq);
    };

    function updateSeedSourceSelect(n) {
      var seedOptions = [{
        id: 'new',
        label: gettextCatalog.getString('Random'),
      }, {
        id: 'set',
        label: gettextCatalog.getString('Specify Recovery Phrase...'),
      }];

      $scope.formData.seedSource = seedOptions[0];

      if (n > 1 && walletService.externalSource.ledger.supported)
        seedOptions.push({
          id: walletService.externalSource.ledger.id,
          label: walletService.externalSource.ledger.longName
        });

      if (walletService.externalSource.trezor.supported) {
        seedOptions.push({
          id: walletService.externalSource.trezor.id,
          label: walletService.externalSource.trezor.longName
        });
      }

      $scope.seedOptions = seedOptions;
    };

    $scope.onSeedChange = function() {
    };

    $scope.setTotalCopayers = function(tc) {
      $scope.formData.totalCopayers = tc;
      updateRCSelect(tc);
      updateSeedSourceSelect(tc);
    };

    $scope.create = function() {
      var network = $scope.formData.network;
      var opts = {
        name: $scope.formData.walletName,
        m: $scope.formData.requiredCopayers,
        n: $scope.formData.totalCopayers,
        myName: $scope.formData.totalCopayers > 1 ? $scope.formData.myName : null,
        network: network,
        walletServiceUrl: $scope.formData.walletServiceUrl,
        singleAddress: $scope.formData.singleAddressEnabled,
        walletPrivKey: $scope.formData._walletPrivKey, // Only for testing
      };

      var setSeed = $scope.formData.seedSource.id == 'set';
      if (setSeed) {

        var words = $scope.formData.privateKey || '';
        if (words.indexOf(' ') == -1 && words.indexOf('prv') == 1 && words.length > 108) {
          opts.extendedPrivateKey = words;
        } else {
          opts.mnemonic = words;
        }
        opts.passphrase = $scope.formData.passphrase;

        var pathData = derivationPathService.parse($scope.formData.derivationPath, $scope.formData.network);
        if (!pathData) {
          popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Invalid derivation path.'));
          return;
        }

        opts.account = pathData.account;
        opts.networkURI = pathData.networkURI;
        opts.derivationStrategy = pathData.derivationStrategy;

      } else {
        opts.passphrase = $scope.formData.createPassphrase;
      }
      if (setSeed && !opts.mnemonic && !opts.extendedPrivateKey) {
        popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Please enter the wallet recovery phrase.'));
        return;
      }
      if ($scope.formData.seedSource.id == walletService.externalSource.ledger.id || $scope.formData.seedSource.id == walletService.externalSource.trezor.id) {
        var account = $scope.formData.account;
        if (!account || account < 1) {
          popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Invalid account number.'));
          return;
        }

        if ($scope.formData.seedSource.id == walletService.externalSource.trezor.id)
          account = account - 1;

        opts.account = account;
        ongoingProcessService.set('connecting ' + $scope.formData.seedSource.id, true);

        var service;
        switch ($scope.formData.seedSource.id) {
          case walletService.externalSource.ledger.id:
            service = ledgerService;
            break;
          case walletService.externalSource.trezor.id:
            service = trezorService;
            break;
          default:
            popupService.showAlert(gettextCatalog.getString('Error'), 'Invalid seed source id.');
            return;
        }
        service.getInfoForNewWallet(opts.n > 1, account, opts.networkURI, function(err, lopts) {
          ongoingProcessService.set('connecting ' + $scope.formData.seedSource.id, false);
          if (err) {
            popupService.showAlert(gettextCatalog.getString('Error'), err);
            return;
          }
          opts = lodash.assign(lopts, opts);
          _create(opts);
        });
      } else {
        _create(opts);
      }
    };

    function _create(opts) {
      ongoingProcessService.set('creatingWallet', true);
      $timeout(function() {
        profileService.createWallet(opts, function(err, client) {
          ongoingProcessService.set('creatingWallet', false);
          if (err) {
            $log.error(err);
            popupService.showAlert(gettextCatalog.getString('Error'), err);
            return;
          }

          walletService.updateRemotePreferences(client);
          pushNotificationsService.updateSubscription(client);

          if ($scope.formData.seedSource.id == 'set') {
            profileService.setBackupFlag(client.credentials.walletId);
          }

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
            }, 100);
          } else $state.go($rootScope.sref('home'));
        });
      }, 300);
    };

  });
