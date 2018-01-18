'use strict';

angular.module('owsWalletApp.controllers').controller('aboutController',
  function($scope, $window, appConfigService, gettextCatalog, externalLinkService) {

    $scope.title = gettextCatalog.getString('About') + ' ' + appConfigService.nameCase;
    $scope.version = $window.version;
    $scope.commitHash = $window.commitHash;

    $scope.openExternalLink = function() {
      var url = appConfigService.gitHubRepoUrl + '/tree/' + $window.commitHash + '';
      var optIn = true;
      var title = gettextCatalog.getString('Open GitHub Project');
      var message = gettextCatalog.getString('You can see the latest developments and contribute to this open source app by visiting our project on GitHub.');
      var okText = gettextCatalog.getString('Open GitHub');
      var cancelText = gettextCatalog.getString('Go Back');
      externalLinkService.open(url, optIn, title, message, okText, cancelText);
    };
  });
