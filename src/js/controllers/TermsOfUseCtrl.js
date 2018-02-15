'use strict';

angular.module('owsWalletApp.controllers').controller('TermsOfUseCtrl', function($scope, appConfigService, uxLanguageService, externalLinkService, gettextCatalog) {
  $scope.lang = uxLanguageService.currentLanguage;

  $scope.openExternalLink = function() {
    var url = appConfigService.disclaimerUrl;
    var optIn = true;
    var title = gettextCatalog.getString('View Terms of Service');
    var message = gettextCatalog.getString('The official English Terms of Service are available on the Open Wallet Stack website.');
    var okText = gettextCatalog.getString('Open Website');
    var cancelText = gettextCatalog.getString('Go Back');
    externalLinkService.open(url, optIn, title, message, okText, cancelText);
  };

});
