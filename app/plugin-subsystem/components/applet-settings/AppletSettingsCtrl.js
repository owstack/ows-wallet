'use strict';

angular.module('owsWalletApp.pluginControllers').controller('AppletSettingsCtrl', function($scope, $rootScope, lodash, configService, appletService, appletCatalogService, Applet, Constants) {

  var self = this;
  this.applets = [];

  this.init = function() {
    var catalog = appletCatalogService.getSync();

    this.applets = appletService.getAppletsWithState();
    this.selectedPresentation = catalog.environment.presentation;
  };

  this.appletMayHide = function(applet) {
    return (applet.flags & Applet.FLAGS_MAY_NOT_HIDE) == 0;
  };

  this.savePreferences = function() {
    // If the applet is not visible then remove its layout to force repositioning if it's made visible later.
    for (var i = 0; i < self.applets.length; i++) {
      if (!self.applets[i].preferences.visible) {
        self.applets[i].layout = {position:{'0':9999,'1':9999}};
      }
    }

    appletService.updateAppletState(self.applets, {
      layoutKind: self.selectedPresentation,
      invalidateCache: true
    }, function() {
      $scope.$emit('Local/AppletPreferencesUpdated');
    });
  };

  var unwatchApplets = $scope.$watch(function () {
    return self.applets;
   }, function(newVal, oldVal) {
    if (newVal == oldVal) return;
    self.savePreferences();
  }, true);

  $scope.$on('$destroy', function() {
    unwatchApplets();
  });

});
