'use strict';

angular.module('owsWalletApp.controllers').controller('VersionCtrl', function() {
  this.version = window.version;
  this.commitHash = window.commitHash;
});
