'use strict';

angular.module('owsWalletApp.controllers').controller('AppletViewCtrl', function($rootScope, $scope, $timeout, $log, $ionicPopup, lodash, gettextCatalog, appletService, pluginSessionService, profileService) {

  var session;

  initForSettingsInteraction();
  initForWalletInteraction();

  /**
   * Applet interaction controls
   */

  $scope.closeApplet = function(sessionId) {
    saveViewSettings();
    appletService.closeApplet(sessionId, {
      confirm: $scope.viewSettings.confirmOnClose
    });
  };

  /**
   * Applet settings controls
   */

  function initForSettingsInteraction() {
    session = pluginSessionService.getActiveSession();
    getViewSettings();
  };

  $scope.openSettings = function() {
    $ionicPopup.show({
      templateUrl: 'views/applet-view/settings/settings.html',
      cssClass: 'applet-view-settings',
      title: 'title',
      subTitle: 'subtitle',
      scope: $scope,
      buttons: [{
        text: 'Done',
        type: 'button-positive',
        onTap: function(e) {
          saveViewSettings();
        }
      }]
    });
  };

  $scope.onAppletMenuMove = function(draggable, droppable) {
    if (!draggable) {
      return;
    }

    $scope.menuPosition = {
      x: draggable.x,
      y: draggable.y
    };

    var physicalScreenWidth = ((window.innerWidth > 0) ? window.innerWidth : screen.width);
    var physicalScreenHeight = ((window.innerHeight > 0) ? window.innerHeight : screen.height);

    var lr = (draggable.midPoint[0] < physicalScreenWidth / 2 ? 'l' : 'r');
    var tb = (draggable.midPoint[1] < physicalScreenHeight / 2 ? 't' : 'b');
    var targetQuadrant = tb + lr;

    lodash.forEach(['tl', 'tr', 'br', 'bl'], function(q) {
      var elem = angular.element(document.getElementsByClassName('applet-menu mfb-component--' + q));
      if (elem[0] && q != targetQuadrant) {
        elem.removeClass('mfb-component--' + q);
        elem.addClass('mfb-component--' + targetQuadrant);
        return false;
      }
    });
  };

  function getViewSettings() {
    $scope.viewSettings = session.getValue('$viewSettings') || {
      // Default settings
      confirmOnClose: true,
      stickyMenu: true,
      menuPosition: {x: 0, y: 0}
    };

    $scope.menuPosition = $scope.viewSettings.menuPosition;

    $timeout(function() {
      $scope.$apply();
    });
  };

  function saveViewSettings() {
    if ($scope.viewSettings.stickyMenu) {
      $scope.viewSettings.menuPosition = $scope.menuPosition;
    }

    $scope.viewSettings = session.setValue('$viewSettings', $scope.viewSettings);
  };

  /**
   * Wallet interaction controls
   */

  function initForWalletInteraction() {
    $scope.wallets = profileService.getWallets();
    $scope.singleWallet = $scope.wallets.length == 1;
    $scope.hasWallets = lodash.isEmpty($scope.wallets) ? false : true;

    if ($scope.hasWallets) {
      // Select first wallet if no wallet selected previously.
      $scope.wallet = $scope.wallet || $scope.wallets[0];
    }
  };

  $scope.onWalletSelect = function(wallet) {
    $rootScope.$emit("Local/WalletForApplet", wallet);
    $scope.wallet = wallet;
  };

  $scope.onWalletSelectCancel = function() {
    $rootScope.$emit("Local/WalletForApplet");
  };

  $rootScope.$on("Local/ChooseWalletForApplet", function(event) {
    if ($scope.singleWallet) {
      return;
    }
    $scope.walletSelectorTitle = gettextCatalog.getString('Select a wallet');
    $scope.showWallets = true;

    $timeout(function() {
      $scope.$apply();
    });
  });

});
