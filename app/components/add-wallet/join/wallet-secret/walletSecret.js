'use strict';

angular.module('owsWalletApp.directives').directive('walletSecret', function() {
  return {
    require: 'ngModel',
    link: function(scope, elem, attrs, ctrl) {
      var validator = function(value) {
        if (value.length > 0) {
          var m = value.match(/^[0-9A-HJ-NP-Za-km-z]{70,80}$/);
          ctrl.$setValidity('walletSecret', m ? true : false);
        }
        return value;
      };

      ctrl.$parsers.unshift(validator);
    }
  };
});
