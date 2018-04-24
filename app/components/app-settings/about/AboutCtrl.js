'use strict';

angular.module('owsWalletApp.controllers').controller('AboutCtrl',
  function($scope, $window, appConfig, gettextCatalog, externalLinkService) {

    $scope.title = gettextCatalog.getString('About') + ' ' + appConfig.nameCase;
    $scope.version = $window.version;
    $scope.commitHash = $window.commitHash;

    $scope.openExternalLink = function() {
      var url = appConfig.gitHubRepoUrl + '/tree/' + $window.commitHash + '';
      var optIn = true;
      var title = gettextCatalog.getString('Open GitHub Project');
      var message = gettextCatalog.getString('You can see the latest developments and contribute to this open source app by visiting our project on GitHub.');
      var okText = gettextCatalog.getString('Open GitHub');
      var cancelText = gettextCatalog.getString('Go Back');
      externalLinkService.open(url, optIn, title, message, okText, cancelText);
    };
  });
