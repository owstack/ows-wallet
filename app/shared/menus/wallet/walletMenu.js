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
        onSelect: '=onSelect'
      },
      link: function(scope, element, attrs) {
        scope.hide = function() {
          scope.show = false;
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
