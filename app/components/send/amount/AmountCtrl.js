'use strict';

angular.module('owsWalletApp.controllers').controller('AmountCtrl', function($rootScope, $scope, $filter, $timeout, $ionicHistory, gettextCatalog, platformInfoService, lodash, configService, rateService, $stateParams, $window, $state, $log, txFormatService, ongoingProcessService, popupService, profileService, nodeWebkitService, networkService, walletService, $ionicModal) {
  var network;

  var SMALL_FONT_SIZE_LIMIT = 10;
  var LENGTH_EXPRESSION_LIMIT = 19;
  var isNW = platformInfoService.isNW;

  $scope.$on('$ionicView.leave', function() {
    angular.element($window).off('keydown');
  });

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    var config = configService.getSync();

    $scope.isCordova = platformInfoService.isCordova;
    $scope.nextStep = data.stateParams.nextStep;
    $scope.nextStepTitle = data.stateParams.nextStepTitle || null;
    $scope.currency = data.stateParams.currency;
    $scope.forceCurrency = data.stateParams.forceCurrency;

    $scope.allowOptionsMenu = $ionicHistory.backView() && $ionicHistory.backView().stateName == $rootScope.sref('send');
    $scope.recipientType = data.stateParams.recipientType || null;
    $scope.walletId = data.stateParams.walletId;
    $scope.networkName = data.stateParams.networkName || config.networkPreferences.defaultNetworkName;
    $scope.toAddress = data.stateParams.toAddress;
    $scope.toName = data.stateParams.toName || gettextCatalog.getString('Digital currency address');
    $scope.toEmail = data.stateParams.toEmail;
    $scope.enterAlternativeAmount = data.stateParams.initWithAlt || false;
    $scope.toColor = data.stateParams.toColor;
    $scope.showOptionsMenu = false;
    $scope.useAdvancedKeypad = configService.getSync().advancedKeypad.enabled;

    network = networkService.getNetworkByName($scope.networkName);

    if (!$scope.nextStep && !data.stateParams.toAddress) {
      $log.error('Bad params at amount')
      throw ('bad params');
    }

    var reNr = /^[1234567890\.]$/;
    var reOp = /^[\*\+\-\/]$/;

    var disableKeys = angular.element($window).on('keydown', function(e) {
      if (!e.key) return;
      if (e.which === 8) { // you can add others here inside brackets.
        e.preventDefault();
        $scope.removeDigit();
      }

      if (e.key.match(reNr)) {
        $scope.pushDigit(e.key);
      } else if (e.key.match(reOp)) {
        $scope.pushOperation(e.key);
      } else if (e.keyCode === 86) {
        if (e.ctrlKey || e.metaKey)
          processClipboard();
      } else if (e.keyCode === 13)
        $scope.finish();

      $timeout(function() {
        $scope.$apply();
      });
    });

    var unitName = lodash.find(network.Unit().units, function(u) {
      return u.code == config.networkPreferences[$scope.networkName].unitCode;
    }).shortName;

    $scope.unitName = unitName;

    if (data.stateParams.currency) {
      $scope.alternativeIsoCode = data.stateParams.currency;
    } else {
      $scope.alternativeIsoCode = config.networkPreferences[$scope.networkName].alternativeIsoCode;
    }
    $scope.specificAmount = $scope.specificAlternativeAmount = '';
    $scope.resetAmount();

    // toAmount is always specified in atomic units.
    if ($stateParams.toAmount) {
      $scope.amount = network.Unit($stateParams.toAmount, 'atomic').toStandardUnit();
    }

    processAmount();
  });

  function paste(value) {
    $scope.amount = value;
    processAmount();
    $timeout(function() {
      $scope.$apply();
    });
  };

  function processClipboard() {
    if (!isNW) {
      return;
    }
    var value = nodeWebkitService.readFromClipboard();
    if (value && evaluate(value) > 0) {
      paste(evaluate(value));
    }
  };

  $scope.openOptionsMenu = function() {
    $scope.showOptionsMenu = true;
  };

  $scope.sendMax = function() {
    $scope.showOptionsMenu = false;
    $scope.useSendMax = true;
    $scope.finish();
  };

  $scope.toggleAlternative = function() {
    if ($scope.forceCurrency) {
      return;
    }
    $scope.enterAlternativeAmount = !$scope.enterAlternativeAmount;

    if ($scope.amount && isExpression($scope.amount)) {
      var amount = evaluate(format($scope.amount));
      $scope.globalResult = '= ' + processResult(amount);
    }
  };

  function checkFontSize() {
    if ($scope.amount && $scope.amount.length >= SMALL_FONT_SIZE_LIMIT) {
      $scope.smallFont = true;
    } else {
      $scope.smallFont = false;
    }
  };

  $scope.pushDigit = function(digit) {
    if ($scope.amount && $scope.amount.length >= LENGTH_EXPRESSION_LIMIT) {
      return;
    }
    if ($scope.amount.indexOf('.') > -1 && digit == '.') {
      return;
    }
    if ($scope.enterAlternativeAmount && $scope.amount.indexOf('.') > -1 && $scope.amount[$scope.amount.indexOf('.') + 2]) {
      return;
    }

    $scope.amount = ($scope.amount + digit).replace('..', '.');
    checkFontSize();
    processAmount();
  };

  $scope.pushOperation = function(operation) {
    if (!$scope.amount || $scope.amount.length == 0) {
      return;
    }
    $scope.amount = _pushOperation($scope.amount);

    function _pushOperation(val) {
      if (!isOperation(lodash.last(val))) {
        return val + operation;
      } else {
        return val.slice(0, -1) + operation;
      }
    };
  };

  function isOperation(val) {
    var regex = /[\/\-\+\x\*]/;
    return regex.test(val);
  };

  function isExpression(val) {
    var regex = /^\.?\d+(\.?\d+)?([\/\-\+\*x]\d?\.?\d+)+$/;
    return regex.test(val);
  };

  $scope.removeDigit = function() {
    $scope.amount = ($scope.amount).toString().slice(0, -1);
    processAmount();
    checkFontSize();
  };

  $scope.resetAmount = function() {
    $scope.amount = $scope.alternativeResult = $scope.amountResult = $scope.globalResult = '';
    $scope.allowSend = false;
    checkFontSize();
  };

  function processAmount() {
    var formatedValue = format($scope.amount);
    var result = evaluate(formatedValue);
    $scope.allowSend = lodash.isNumber(result) && +result > 0;
    if (lodash.isNumber(result)) {
      $scope.globalResult = isExpression($scope.amount) ? '= ' + processResult(result) : '';
      $scope.amountResult = $filter('formatFiatAmount')(toFiat(result));
      var amount = network.Unit(fromFiat(result), 'standard').toAtomicUnit();
      $scope.alternativeResult = txFormatService.formatAmount($scope.networkName, amount, {fullPrecision: true});
    }
  };

  function processResult(val) {
    if ($scope.enterAlternativeAmount) {
      return $filter('formatFiatAmount')(val);
    } else {
      val = network.Unit(val, 'standard').toAtomicUnit();
      return txFormatService.formatAmount($scope.networkName, val, {fullPrecision: true});
    }
  };

  function fromFiat(val) {
    var atomicVal = rateService.fromFiat($scope.networkName, val, $scope.alternativeIsoCode);
    return network.Unit(atomicVal, 'atomic').toStandardUnit();
  };

  function toFiat(val) {
    var atomicVal = network.Unit(val, 'standard').toAtomicUnit();
    return parseFloat(rateService.toFiat($scope.networkName, atomicVal, $scope.alternativeIsoCode));
  };

  function evaluate(val) {
    var result;
    try {
      result = $scope.$eval(val);
    } catch (e) {
      return 0;
    }
    if (!lodash.isFinite(result)) {
      return 0;
    }
    return result;
  };

  function format(val) {
    var result = val.toString();

    if (isOperation(lodash.last(val))) {
      result = result.slice(0, -1);
    }

    return result.replace('x', '*');
  };

  function verifyFunding(minAmount, cb) {
    var wallets = [];
    if ($scope.walletId) {
      // Check only the desired wallet.
      wallets.push(profileService.getWallet($scope.walletId));
    } else {
      // Check all wallets.
      wallets = profileService.getWallets({
        onlyComplete: true,
        networkName: $scope.networkName
      });
    }

    if (!wallets || !wallets.length) {
      return cb(false);
    }

    // Convert to atomic units.
    minAmount = network.Unit(minAmount, 'standard').toAtomicUnit();

    if ($scope.useSendMax) {
      // Detect zero balance when using send max (since actual amounts are not fetched to this point).
      minAmount = 1;
    }

    var filteredWallets = [];
    var index = 0;

    lodash.each(wallets, function(w) {
      walletService.getStatus(w, {}, function(err, status) {
        if (err || !status) {
          $log.error(err);
        } else {
          if (status.availableBalanceAtomic > minAmount) {
            filteredWallets.push(w);
          }
        }

        if (++index == wallets.length) {
          var err;
          if (lodash.isEmpty(filteredWallets)) {
            if ($scope.walletId) {
              err = gettextCatalog.getString('Not enough funds to create a transaction from wallet \'{{walletName}}\'.', {
                walletName: wallets[0].name
              });
            } else {
              err = gettextCatalog.getString('Not enough funds to create a transaction from any wallet.');
            }
          }
          cb(err);
        }
      });
    });
  };

  $scope.finish = function() {
    var _amount = evaluate(format($scope.amount));

    if ($scope.nextStep && $scope.nextStep.indexOf('/') < 0) {

      // No dir separator in the nextStep; nextStep is a state name.
      $state.transitionTo($scope.nextStep, {
        walletId: $scope.walletId,
        amount: $scope.useSendMax ? null : _amount,
        currency: $scope.enterAlternativeAmount ? $scope.alternativeIsoCode : $scope.unitName,
        useSendMax: $scope.useSendMax
      });

    } else if ($scope.nextStep && $scope.nextStep.indexOf('/') >= 0) {

      // Dir separator in the nextStep; nextStep is a modal path.
      $scope.topScope = $scope;
      $ionicModal.fromTemplateUrl($scope.nextStep, {
        scope: $scope,
        backdropClickToClose: false,
        hardwareBackButtonClose: false
      }).then(function(modal) {
        $scope.nextStepModal = modal;
        $scope.nextStepModal.show();
      });

      $scope.closeModal = function() {
        // Land on the receive view; back up from the amount entry view then remove the modal.
        $ionicHistory.nextViewOptions({
          disableAnimate: true
        });
        $ionicHistory.goBack();

        $timeout(function() {
          $scope.nextStepModal.remove();
        });
      };

    } else {
      // Avoid a view transition followed by an insufficient funds message; check and present an error here.
      // There is a detection of zero funds when Send max is selected; insufficent funds calculation is done later when 
      // the at least one wallet has a non-zero balance.
      verifyFunding(_amount , function(err) {
        if (err) {
          popupService.showAlert(gettextCatalog.getString('Insufficent Funds'), err);
        } else {
          var amount = $scope.enterAlternativeAmount ? fromFiat(_amount) : _amount;

          $state.transitionTo($rootScope.sref('send.confirm'), {
            walletId: $scope.walletId,
            networkName: $scope.networkName,
            recipientType: $scope.recipientType,
            toAmount: $scope.useSendMax ? null : network.Unit(amount, 'standard').toAtomicUnit(),
            toAddress: $scope.toAddress,
            toName: $scope.toName,
            toEmail: $scope.toEmail,
            toColor: $scope.toColor,
            useSendMax: $scope.useSendMax
          });
          
          $scope.useSendMax = null;
        }
      });
    }
  };
});
