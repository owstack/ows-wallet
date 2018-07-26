'use strict';

angular.module('owsWalletApp.controllers').controller('AppletViewCtrl', function($rootScope, $scope, $timeout, $log, $ionicModal, lodash, gettextCatalog, profileService) {

  var selectedWallet;

  $scope.wallets = profileService.getWallets();
  $scope.singleWallet = $scope.wallets.length == 1;
  $scope.hasWallets = lodash.isEmpty($scope.wallets) ? false : true;

  if ($scope.hasWallets) {
    // Select first wallet if no wallet selected previously.
    $scope.wallet = $scope.wallet || $scope.wallets[0];
  }

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

  $scope.openSettings = function() {
    $ionicModal.fromTemplateUrl('views/applet-view/settings/settings.html', {
      scope: $scope,
      backdropClickToClose: true,
      hardwareBackButtonClose: true
    }).then(function(modal) {
      $scope.settingsModal = modal;
      $scope.settingsModal.show();
    });

    $scope.close = function() {
      $scope.settingsModal.remove();
    };
  };

  $scope.onDragEnd = function(draggable, droppable) {
    if (!draggable) {
      return;
    }

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

        $scope.appletMenuState = 'closed';
        $timeout(function() {
          $scope.$apply();
        });

        return false;
      }
    });
  };

  $scope.onWalletSelect = function(wallet) {
    $rootScope.$emit("Local/WalletForApplet", wallet);
    $scope.wallet = wallet;
  };

  $scope.onCancel = function() {
    $rootScope.$emit("Local/WalletForApplet");
  };

});
