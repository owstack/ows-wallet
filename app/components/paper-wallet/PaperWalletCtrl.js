'use strict';

angular.module('owsWalletApp.controllers').controller('PaperWalletCtrl', function($rootScope, $scope, $timeout, $log, $ionicHistory, lodash, feeService, popupService, gettextCatalog, configService, profileService, $state, ongoingProcessService, txFormatService, $stateParams, walletService, networkService, cryptoService) {

  function _scanFunds(cb) {
    function getPrivateKey(scannedKey, isPkEncrypted, passphrase, cb) {
      if (!isPkEncrypted) {
        return cb(null, scannedKey);
      }

      // Attempt to decrypt on available networks.
      var found = false;
      networkService.forEachNetwork(function(network) {
        if (!found) {
          try {
            network.decryptBIP38PrivateKey(scannedKey, passphrase, null, function(err, privateKey) {
              if (err) {
                throw(err);
              }

              found = true;
              cb(null, privateKey);
            });
          } catch (err) {
            // Ignore error and continue.
          }
        }
      });
      if (!found) {
        cb('could not decrypt private key');
      }
    };

    function checkPrivateKey(privateKey, cb) {
      var isValid;
      var pkNetwork;

      // Attempt to validate the private key on available networks.
      networkService.forEachNetwork(function(network) {
        if (!isValid) {
          try {
            cryptoService.PrivateKey(privateKey, network.name);
            isValid = true;
            pkNetwork = network;
          } catch (err) {
            isValid = false;
          }
        }
      });
      cb(isValid, pkNetwork);
    };

    getPrivateKey($scope.scannedKey, $scope.isPkEncrypted, $scope.passphrase, function(err, privateKey) {
      if (err) {
        return cb(err);
      }

      checkPrivateKey(privateKey, function(isValid, network) {
        if (!isValid) {
          return cb(new Error('Invalid private key'));
        }

        // Load possible destination wallets and default to the first one in the list if able.
        $scope.wallets = profileService.getWallets({
          onlyComplete: true,
          networkName: network.name
        });

        if ($scope.wallets && $scope.wallets.length > 0) {
          $scope.wallet = $scope.wallets[0];
          $scope.singleWallet = $scope.wallets.length == 1;

          // Got a valid private key and wallet. Get the balance from the private key.
          $scope.wallet.getBalanceFromPrivateKey(privateKey, function(err, balance, address) {
            if (err) {
              return cb(err);
            }
            return cb(null, privateKey, balance, address, network);
          });

        } else {
          $scope.noMatchingWallet = true;
          return cb('No compatible wallet to receive funds.');
        }
      });
    });
  };

  $scope.scanFunds = function() {
    var config = configService.getSync();
    $scope.scanComplete = false;
    ongoingProcessService.set('scanning', true);

    _scanFunds(function(err, privateKey, balance, address, network) {
      ongoingProcessService.set('scanning', false);
      if (err) {
        popupService.showAlert(gettextCatalog.getString('Error Scanning For Funds'), err || err.toString());
        $state.go($rootScope.sref('home'));

      } else {
        $scope.scanComplete = true;
        $scope.privateKey = privateKey;
        $scope.balanceAtomic = balance;
        $scope.address = address;

        var unitName = lodash.find(network.Unit().units, function(u) {
          return u.code == config.networkPreferences[network.name].unitCode;
        }).shortName;

        $scope.balanceStr = txFormatService.formatAmount(network.name, balance) + ' ' + unitName;

        txFormatService.formatAlternativeStr(network.name, balance, function(amountStr) {
          $scope.balanceAlternativeStr = amountStr;
        });

        // Provide a visible alert for the user.
        if ($scope.balanceAtomic <= 0) {
          popupService.showAlert(
            gettextCatalog.getString('No Funds Found'),
            gettextCatalog.getString('No funds were found while scanning addresses.')
          );
        }

        $scope.network = network;
      }
      $timeout(function() {
        $scope.$apply();
      }, 100);
    });
  };

  function _sweepWallet(cb) {
    walletService.getAddress($scope.wallet, true, function(err, destinationAddress) {
      if (err) {
        return cb(err);
      }

      $scope.wallet.buildTxFromPrivateKey($scope.privateKey, destinationAddress, null, function(err, testTx) {
        if (err) {
          return cb(err);
        }
        var rawTxLength = testTx.serialize().length;

        feeService.getCurrentFeeRate($scope.wallet, function(err, feePerKb) {
          var opts = {};
          opts.fee = Math.round((feePerKb.atomic * rawTxLength) / 2000);

          $scope.wallet.buildTxFromPrivateKey($scope.privateKey, destinationAddress, opts, function(err, tx) {
            if (err) {
              return cb(err);
            }
            $scope.wallet.broadcastRawTx({
              rawTx: tx.serialize(),
              network: $scope.networkName
            }, function(err, txid) {
              if (err) {
                return cb(err);
              }
              return cb(null, destinationAddress, txid);
            });
          });
        });
      });
    });
  };

  $scope.sweepWallet = function() {
    ongoingProcessService.set('sweepingWallet', true);
    $scope.sending = true;

    $timeout(function() {
      _sweepWallet(function(err, destinationAddress, txid) {
        ongoingProcessService.set('sweepingWallet', false);
        $scope.sending = false;
        if (err) {
          $log.error(err);
          popupService.showAlert(gettextCatalog.getString('Error Sweeping Wallet'), err || err.toString());
        } else {
          $scope.sendStatus = 'success';
        }
        $scope.$apply();
      });
    }, 100);
  };

  $scope.onSuccessConfirm = function() {
    $state.go($rootScope.sref('home'));
  };

  $scope.onWalletSelect = function(wallet) {
    $scope.wallet = wallet;
  };

  $scope.showWalletSelector = function() {
    if ($scope.singleWallet) {
      return;
    }
    $scope.walletSelectorTitle = gettextCatalog.getString('Transfer to');
    $scope.showWallets = {
      value: true
    };
  };

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    $scope.scannedKey = (data.stateParams && data.stateParams.privateKey) ? data.stateParams.privateKey : null;
    $scope.isPkEncrypted = $scope.scannedKey ? ($scope.scannedKey.substring(0, 2) == '6P') : null;
    $scope.sendStatus = null;
    $scope.scanComplete = false;
  });

  $scope.$on("$ionicView.enter", function(event, data) {
    if (!$scope.isPkEncrypted) {
      $scope.scanFunds();
    } else {
      var title = gettextCatalog.getString('Password Required');
      var message = gettextCatalog.getString('Private key encrypted. Enter password.');
      popupService.showPrompt(title, message, null, function(res) {
        $scope.passphrase = res;
        $scope.scanFunds();
      });
    }
  });

});
