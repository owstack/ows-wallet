'use strict';

angular.module('owsWalletApp.controllers').controller('GetHelpCtrl', function($scope, appConfigService, gettextCatalog, externalLinkService) {

  $scope.appName = appConfigService.nameCase;

  $scope.openExternalLink = function() {
    var appName = appConfigService.name;
    var url = appConfigService.gitHubRepoBugs;
    var optIn = true;
    var title = gettextCatalog.getString('Report a Bug');
    var message = gettextCatalog.getString('You may browse or submit bugs at the website.');
    var okText = gettextCatalog.getString('Open');
    var cancelText = gettextCatalog.getString('Go Back');
    externalLinkService.open(url, optIn, title, message, okText, cancelText);
  };

});