'use strict';

angular.module('owsWalletApp.controllers').controller('ExperimentsAppSettingsCtrl', function($scope, $log, lodash, configService, navigationService, applicationService, popupService, gettextCatalog) {

  var updateConfig = function() {
    $scope.experiments = lodash.cloneDeep(configService.getSync().experiments);
    $scope.appNavigation = lodash.cloneDeep(configService.getSync().appNavigation);
  };

  $scope.onAppNavigationSchemeChange = function() {
    var title = gettextCatalog.getString('App Restart Required');
    var message = gettextCatalog.getString('Changing app navigation requires the app to restart. Restart app now?');
    popupService.showConfirm(title, message, null, null, function(result) {
      if (result) {
        var opts = {
          appNavigation: $scope.appNavigation
        };

        configService.set(opts, function(err) {
          if (err) {
            $log.debug(err);
            title = gettextCatalog.getString('Error');
            message = gettextCatalog.getString('Could not change app navigation scheme.');
            return popupService.showAlert(title, message);
          }
          applicationService.restart();
        });
      } else {
        updateConfig();
      }
    });
  };

  $scope.onChange = function(cb) {
    cb = cb || function(){};
    var opts = {
      experiments: $scope.experiments
    };
    configService.set(opts, function(err) {
      if (err) {
      	$log.debug(err);
      }
	    $log.info('Experiments: ' + JSON.stringify($scope.experiments));
      cb();
    });
  };

  $scope.schemeLabelFor = function(scheme) {
    return navigationService.schemeLabelFor(scheme);
  };

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    $scope.availableAppNavigationSchemes = navigationService.getSchemes();
    updateConfig();
  });

});
