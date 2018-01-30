'use strict';

angular.module('owsWalletApp.directives')
  .directive('itemSelectorWallet', function($timeout) {
    return {
      restrict: 'E',
      templateUrl: 'views/includes/itemSelectorWallet.html',
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
