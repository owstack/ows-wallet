'use strict';

angular.module('owsWalletApp.directives')
  .directive('copyToClipboard', function(platformInfoService, nodeWebkitService, gettextCatalog, ionicToast, clipboard) {
    return {
      restrict: 'A',
      link: function(scope, elem, attrs, ctrl) {
        var isCordova = platformInfoService.isCordova;
        var isNW = platformInfoService.isNW;

        elem.bind('mouseover', function() {
          elem.css('cursor', 'pointer');
        });

        var msg = gettextCatalog.getString('Copied to clipboard');
        elem.bind('click', function() {
          var data = attrs.copyToClipboard;
          if (!data) {
            return;
          }

          if (isCordova) {
            cordova.plugins.clipboard.copy(data);
          } else if (isNW) {
            nodeWebkitService.writeToClipboard(data);
          } else if (clipboard.supported) {
            clipboard.copyText(data);
          } else {
            // No supported
            return;
          }
          scope.$apply(function() {
            ionicToast.show(msg, 'bottom', false, 1000);
          });
        });
      }
    }
  });
