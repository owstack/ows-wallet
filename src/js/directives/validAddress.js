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

            // Check BIP21 uri and regular address
            lodash.forEach(networkService.getNetworks(), function(n) {
              var netLib = networkService.walletClientFor(n.getURI()).getLib();
              var URI = netLib.URI;
              var Address = netLib.Address;

              var hasProtocol = value.includes(':');
              if (hasProtocol) {

                // Check BIP21 uri
                if (value.startsWith(n.protocol)) {
                  var uri;
                  var isAddressValid;
                  var isUriValid = URI.isValid(value);

                  if (isUriValid) {
                    uri = new URI(value);
                    isAddressValid = Address.isValid(uri.address.toString(), 'livenet');

                    if (networkService.hasTestnet(n.currency)) {
                      isAddressValid = isAddressValid || Address.isValid(uri.address.toString(), 'testnet');
                    }
                  }
                  ctrl.$setValidity('validAddress', isUriValid && isAddressValid);
                  return false; // break loop
                }

              } else {

                // Check regular address
                var isAddressValid = Address.isValid(value, 'livenet');
                if (networkService.hasTestnet(n.currency)) {
                  isAddressValid = isAddressValid || Address.isValid(value, 'testnet');
                }

                ctrl.$setValidity('validAddress', isAddressValid);
                if (isAddressValid) {
                  return false; // break loop
                }
              }
            });

            return value;
          };

          ctrl.$parsers.unshift(validator);
          ctrl.$formatters.unshift(validator);
        }
      };
    }
  ]);