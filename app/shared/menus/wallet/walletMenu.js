'use strict';

angular.module('owsWalletApp.directives')
  .directive('walletMenu', function($timeout) {
    return {
      restrict: 'E',
      templateUrl: 'shared/menus/wallet/wallet.html',
      transclude: true,
      scope: {
        title: '=title',
        show: '=show',
        wallets: '=wallets',
        selectedWallet: '=selectedWallet',
        onSelect: '=onSelect',
        onCancel: '=onCancel'
      },
      link: function(scope, element, attrs) {
        scope.hasTabs = (attrs.hasTabs != undefined || (attrs.hasTabs == 'true') ? true : false);

        scope.hide = function() {
          scope.show = false;
          if (scope.onCancel) {
            scope.onCancel();
          }
        };
        
        scope.selectWallet = function(wallet) {
          $timeout(function() {
            scope.hide();
          }, 100);
          scope.onSelect(wallet);
        };
      }
    };
  });
