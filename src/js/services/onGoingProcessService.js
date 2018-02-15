'use strict';

angular.module('owsWalletApp.services').factory('ongoingProcessService', function($log, $timeout, $filter, lodash, $ionicLoading, gettext, platformInfoService) {
  var root = {};
  var isCordova = platformInfoService.isCordova;

  var ongoingProcessService = {};

  var processNames = {
    'broadcastingTx': gettext('Broadcasting transaction'),
    'calculatingFee': gettext('Calculating fee'),
    'connectingledger': gettext('Waiting for Ledger...'),
    'connectingtrezor': gettext('Waiting for Trezor...'),
    'creatingTx': gettext('Creating transaction'),
    'creatingWallet': gettext('Creating Wallet...'),
    'deletingWallet': gettext('Deleting Wallet...'),
    'extractingWalletInfo': gettext('Extracting Wallet information...'),
    'fetchingPayPro': gettext('Fetching payment information'),
    'generatingCSV': gettext('Generating .csv file...'),
    'gettingFeeLevels': gettext('Getting fee levels...'),
    'importingWallet': gettext('Importing Wallet...'),
    'joiningWallet': gettext('Joining Wallet...'),
    'recreating': gettext('Recreating Wallet...'),
    'rejectTx': gettext('Rejecting payment proposal'),
    'removeTx': gettext('Deleting payment proposal'),
    'retrievingInputs': gettext('Retrieving inputs information'),
    'scanning': gettext('Scanning Wallet funds...'),
    'sendingTx': gettext('Sending transaction'),
    'signingTx': gettext('Signing transaction'),
    'sweepingWallet': gettext('Sweeping Wallet...'),
    'validatingWords': gettext('Validating recovery phrase...'),
    'loadingTxInfo': gettext('Loading transaction info...'),
    'sendingFeedback': gettext('Sending feedback...'),
    'generatingNewAddress': gettext('Generating new address...'),
    'sendingByEmail': gettext('Preparing addresses...'),
    'sending2faCode': gettext('Sending 2FA code...')
  };

  root.clear = function() {
    ongoingProcessService = {};
    if (isCordova) {
      window.plugins.spinnerDialog.hide();
    } else {
      $ionicLoading.hide();
    }
  };

  root.get = function(processName) {
    return ongoingProcessService[processName];
  };

  root.set = function(processName, isOn, customHandler) {
    $log.debug('ongoingProcessService', processName, isOn);
    root[processName] = isOn;
    ongoingProcessService[processName] = isOn;

    var name;
    root.any = lodash.any(ongoingProcessService, function(isOn, processName) {
      if (isOn)
        name = name || processName;
      return isOn;
    });
    // The first one
    root.onGoingProcessName = name;

    var showName = $filter('translate')(processNames[name] || name);

    if (customHandler) {
      customHandler(processName, showName, isOn);
    } else if (root.onGoingProcessName) {
      if (isCordova) {
        window.plugins.spinnerDialog.show(null, showName, root.clear);
      } else {

        var tmpl = '<div class="item-icon-left">' + showName + '<ion-spinner class="spinner-stable" icon="lines"></ion-spinner></div>';
        $ionicLoading.show({
          template: tmpl
        });
      }
    } else {
      if (isCordova) {
        window.plugins.spinnerDialog.hide();
      } else {
        $ionicLoading.hide();
      }
    }
  };

  return root;
});
