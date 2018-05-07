'use strict';

angular.module('owsWalletApp.controllers').controller('VersionCtrl', function(appConfig) {
  this.version = appConfig.version;
  this.commitHash = appConfig.commitHash;
});
