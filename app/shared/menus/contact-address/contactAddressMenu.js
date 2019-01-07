'use strict';

angular.module('owsWalletApp.directives').directive('contactAddressMenu', function($timeout, networkService) {
  return {
    restrict: 'E',
    templateUrl: 'shared/menus/contact-address/contact-address.html',
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
      scope.hasTabs = (attrs.hasTabs != undefined || (attrs.hasTabs == 'true') ? true : false);

      scope.hide = function() {
        scope.show = false;
      };

      scope.selectAddress = function(index) {
        $timeout(function() {
          scope.hide();
        }, 100);
        scope.onSelect(scope.contact, index);
      };

      scope.currencyFor = function(networkName) {
        return networkService.getNetworkByName(networkName).currency;
      };

    }
  };
});
