'use strict';

angular.module('owsWalletApp.directives')
  .directive('validAddress', ['$rootScope', 'lodash', 'networkService',
    function($rootScope, lodash, networkService) {
      return {
        require: 'ngModel',
        link: function(scope, elem, attrs, ctrl) {
          var validator = function(value) {

            if (typeof value == 'undefined') {
              ctrl.$pristine = true;
              return;
            }

            // Check regular url
            if (/^https?:\/\//.test(value)) {
              ctrl.$setValidity('validAddress', true);
              return value;
            }

            networkService.isValidAddress(value, function(result) {
              ctrl.$setValidity('validAddress', result.isValid);
              return value;
            });
          };

          ctrl.$parsers.unshift(validator);
          ctrl.$formatters.unshift(validator);
        }
      };
    }
  ]);