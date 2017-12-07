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
  ])
  .directive('validAmount', ['configService', 'networkService',
    function(configService, networkService) {

      return {
        require: 'ngModel',
        link: function(scope, element, attrs, ctrl) {
          var val = function(value) {
            // Support only livenet/btc
            var atomicUnit = networkService.getAtomicUnit('livenet/btc');
            var configNetwork = configService.getSync().currencyNetworks['livenet/btc'];
            var vNum = Number((value * configNetwork.unitToAtomicUnit).toFixed(atomicUnit.decimals));
            if (typeof value == 'undefined' || value == 0) {
              ctrl.$pristine = true;
            }

            if (typeof vNum == "number" && vNum > 0) {
              if (vNum > Number.MAX_SAFE_INTEGER) {
                ctrl.$setValidity('validAmount', false);
              } else {
                var decimals = Number(configNetwork.unitDecimals);
                var sep_index = ('' + value).indexOf('.');
                var str_value = ('' + value).substring(sep_index + 1);
                if (sep_index >= 0 && str_value.length > decimals) {
                  ctrl.$setValidity('validAmount', false);
                  return;
                } else {
                  ctrl.$setValidity('validAmount', true);
                }
              }
            } else {
              ctrl.$setValidity('validAmount', false);
            }
            return value;
          }
          ctrl.$parsers.unshift(val);
          ctrl.$formatters.unshift(val);
        }
      };
    }
  ])
  .directive('walletSecret', function() {
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
  })
  .directive('ngFileSelect', function() {
    return {
      link: function($scope, el) {
        el.bind('change', function(e) {
          $scope.formData.file = (e.srcElement || e.target).files[0];
          $scope.getFile();
        });
      }
    }
  })
  .directive('contact', ['addressbookService', 'lodash',
    function(addressbookService, lodash) {
      return {
        restrict: 'E',
        link: function(scope, element, attrs) {
          var addr = attrs.address;
          addressbookService.get(addr, function(err, ab) {
            if (ab) {
              var name = lodash.isObject(ab) ? ab.name : ab;
              element.append(name);
            } else {
              element.append(addr);
            }
          });
        }
      };
    }
  ])
  .directive('ignoreMouseWheel', function($rootScope, $timeout) {
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        element.bind('mousewheel', function(event) {
          element[0].blur();
          $timeout(function() {
            element[0].focus();
          }, 1);
        });
      }
    }
  });
