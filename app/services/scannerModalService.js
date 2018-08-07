'use strict';

angular.module('owsWalletApp.services').service('scannerModalService', function($rootScope, $ionicModal, incomingDataService) {

  var root = {};

  // Launch a modal presentation of the scanner and return a promise for the scanned and parsed result.
  // The provided 'id' is passed through on the scanner activate and decativate events (modal show and hide).
  root.scan = function(id) {
    return new Promise(function(resolve, reject) {

      try {
        var scope = $rootScope.$new(true);

        $ionicModal.fromTemplateUrl('views/scan/modal/modal.html', {
          scope: scope,
          backdropClickToClose: false,
          hardwareBackButtonClose: false,
          animation: 'none'
        }).then(function(modal) {
          $rootScope.$emit('Local/ModalActivateQrScanner', id);
          scope.scannerModal = modal;
          scope.scannerModal.show();

          // Kill the modal backdrop for this instance of modal.
          angular.element(modal.el).css('background', 'none');
          angular.element(modal.el.getElementsByClassName('modal-backdrop-bg')[0]).css('opacity', '0');

          var cancelModalQrScannerResultListener =
          $rootScope.$on('Local/ModalQrScannerResult', function(e, data) {
            scope.close();

            incomingDataService.process(data, {parseOnly: true}, function(handled, result) {
              resolve(result);
            });
          });

          scope.close = function() {
            cancelModalQrScannerResultListener();
            $rootScope.$emit('Local/ModalDeactivateQrScanner', id);
            scope.scannerModal.remove();
          };
        });

      } catch(error) {
        reject(error);
      };
    });
  };

  return root;
});
