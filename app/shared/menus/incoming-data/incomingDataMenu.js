'use strict';

angular.module('owsWalletApp.directives')
  .directive('incomingDataMenu', function($timeout, $rootScope, $state, externalLinkService) {
    return {
      restrict: 'E',
      templateUrl: 'shared/menus/incoming-data/incoming-data.html',
      link: function(scope, element, attrs) {
        scope.hasTabs = (attrs.hasTabs != undefined || (attrs.hasTabs == 'true') ? true : false);

        $rootScope.$on('incomingDataMenu.showMenu', function(event, data) {
          $timeout(function() {
            scope.networkURI = data.networkURI;
            scope.currency = data.currency;
            scope.currencyLabel = data.currencyLabel;
            scope.data = data.data;
            scope.type = data.type;
            scope.showMenu = true;
            scope.https = false;

            if (scope.type === 'url') {
              if (scope.data.indexOf('https://') === 0) {
                scope.https = true;
              }
            }
          });
        });

        scope.hide = function() {
          scope.showMenu = false;
          $rootScope.$broadcast('incomingDataMenu.menuHidden');
        };

        scope.goToUrl = function(url) {
          externalLinkService.open(url);
        };

        scope.sendPaymentToAddress = function(networkURI, address) {
          scope.showMenu = false;
          $state.go($rootScope.sref('send')).then(function() {
            $timeout(function() {
              $state.transitionTo($rootScope.sref('send.amount'), {
                networkURI: networkURI,
                toAddress: address
              });
            }, 50);
          });
        };

        scope.addToAddressBook = function(networkURI, address) {
          scope.showMenu = false;
          $timeout(function() {
            $state.go($rootScope.sref('settings')).then(function() {
              $timeout(function() {
                $state.transitionTo($rootScope.sref('address-book.add'), {
                  networkURI: networkURI,
                  address: address,
                  from: 'scan'
                });
              });
            });
          }, 100);
        };

        scope.scanPaperWallet = function(privateKey) {
          scope.showMenu = false;
          $state.go($rootScope.sref('wallets')).then(function() {
            $timeout(function() {
              $state.transitionTo($rootScope.sref('wallet.paper-wallet'), {
                privateKey: privateKey
              });
            }, 50);
          });
        };
      }
    };
  });
