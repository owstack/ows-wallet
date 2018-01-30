'use strict';

angular.module('owsWalletApp.directives')
  .directive('itemSelectorContactAddress', function($timeout, networkService) {
    return {
      restrict: 'E',
      templateUrl: 'views/includes/itemSelectorContactAddress.html',
      transclude: true,
      scope: {
        title: '=title',
        show: '=show',
        contact: '=contact',
        addresses: '=addresses',
        selected: '=selected',
        onSelect: '=onSelect'
      },
      link: function(scope, element, attrs) {
        scope.hide = function() {
          scope.show = false;
        };

        scope.selectAddress = function(index) {
          $timeout(function() {
            scope.hide();
          }, 100);
          scope.onSelect(scope.contact, index);
        };

        scope.currencyFor = function(networkURI) {
          return networkService.parseCurrency(networkURI);
        };

      }
    };
  });
