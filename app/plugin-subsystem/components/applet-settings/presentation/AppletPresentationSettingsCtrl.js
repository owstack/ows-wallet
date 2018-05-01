'use strict';

angular.module('owsWalletApp.pluginControllers').controller('AppletPresentationSettingsCtrl', function($rootScope, $ionicSlideBoxDelegate, go, Constants, appletCatalogService, appletService) {

  var self = this;

  this.init = function() {
    var catalog = appletCatalogService.getSync();
    this.appletPresentationOptions = Constants.appletPresentationOptions;
    this.selectedPresentation = catalog.environment.presentation;
  };

  this.setPresentation = function(presentation) {
    appletService.setAppletPresentation(presentation, function() {
      if (presentation != Constants.PRESENTATION_CATEGORIES) {
        appletService.clearActiveCategory();
        $ionicSlideBoxDelegate.$getByHandle('appletPresentationSlideBox').slide(0);
      }

      go.path('preferencesApplets');      
    });
  };

});
