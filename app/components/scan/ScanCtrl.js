'use strict';

angular.module('owsWalletApp.controllers').controller('ScanCtrl', function($scope, $log, $timeout, scannerService, incomingDataService, $state, $ionicHistory, $rootScope) {

  var passthroughMode = false;

  var scannerStates = {
    unauthorized: 'unauthorized',
    denied: 'denied',
    unavailable: 'unavailable',
    loading: 'loading',
    visible: 'visible'
  };
  $scope.scannerStates = scannerStates;

  function _updateCapabilities() {
    var capabilities = scannerService.getCapabilities();
    $scope.scannerIsAvailable = capabilities.isAvailable;
    $scope.scannerHasPermission = capabilities.hasPermission;
    $scope.scannerIsDenied = capabilities.isDenied;
    $scope.scannerIsRestricted = capabilities.isRestricted;
    $scope.canEnableLight = capabilities.canEnableLight;
    $scope.canChangeCamera = capabilities.canChangeCamera;
    $scope.canOpenSettings = capabilities.canOpenSettings;
  }

  function _handleCapabilities() {
    // always update the view
    $timeout(function() {
      if(!scannerService.isInitialized()) {
        $scope.currentState = scannerStates.loading;
      } else if(!$scope.scannerIsAvailable){
        $scope.currentState = scannerStates.unavailable;
      } else if($scope.scannerIsDenied){
        $scope.currentState = scannerStates.denied;
      } else if($scope.scannerIsRestricted){
        $scope.currentState = scannerStates.denied;
      } else if(!$scope.scannerHasPermission){
        $scope.currentState = scannerStates.unauthorized;
      }
      $log.debug('Scan view state set to: ' + $scope.currentState);
    });
  }

  function _refreshScanView() {
    _updateCapabilities();
    _handleCapabilities();
    if($scope.scannerHasPermission) {
      activate();
    }
  }

  // This could be much cleaner with a Promise API
  // (needs a polyfill for some platforms)
  $rootScope.$on('scannerServiceInitialized', function() {
    $log.debug('Scanner initialization finished, reinitializing scan view...');
    _refreshScanView();
  });

  $scope.$on("$ionicView.beforeEnter", function() {
    passthroughMode = $state.params.passthroughMode;
    $scope.canShowSideMenuButton = (passthroughMode == null);
  });

  $scope.$on("$ionicView.afterEnter", function() {
    // try initializing and refreshing status any time the view is entered
    if(!scannerService.isInitialized()) {
      scannerService.gentleInitialize();
    }
    activate();
  });

  $scope.$on("$ionicView.afterLeave", function() {
    scannerService.deactivate();
  });

  $rootScope.$on('incomingDataMenu.menuHidden', function() {
    activate();
  });

  function activate() {
    // Ensure that the scan view background is transparent (allows video to be visible). It may have a
    if (angular.element(document.querySelector('#scan'))[0]) {
      angular.element(document.querySelector('#scan'))[0].style.backgroundColor = 'transparent';
    }

    scannerService.activate(function() {
      _updateCapabilities();
      _handleCapabilities();
      $log.debug('Scanner activated, setting to visible...');
      $scope.currentState = scannerStates.visible;

      $timeout(function() {
        scannerService.scan(function(err, contents) {
          if(err) {
            $log.debug('Scan canceled.');
          } else if (passthroughMode) {
            $rootScope.scanResult = contents;
            $scope.goBack();
          } else {
            handleSuccessfulScan(contents);
          }
        });
        // resume preview if paused
        scannerService.resumePreview();
      });
    });
  }
  $scope.activate = activate;

  $scope.authorize = function(){
    scannerService.initialize(function() {
      _refreshScanView();
    });
  };

  function handleSuccessfulScan(contents) {
    if (typeof contents == 'object' && contents.result) {
      contents = contents.result;
    }

    $log.debug('Scan returned: "' + contents + '"');
    scannerService.pausePreview();
    incomingDataService.redir(contents);
  };

  $scope.openSettings = function() {
    scannerService.openSettings();
  };

  $scope.attemptToReactivate = function() {
    scannerService.reinitialize();
  };

  $scope.toggleLight = function() {
    scannerService.toggleLight(function(lightEnabled){
      $scope.lightActive = lightEnabled;
      $scope.$apply();
    });
  };

  $scope.toggleCamera = function() {
    $scope.cameraToggleActive = true;
    scannerService.toggleCamera(function(status){
      // A short delay for the user to see the visual feedback.
      $timeout(function(){
        $scope.cameraToggleActive = false;
        $log.debug('Camera toggle control deactivated.');
      }, 200);
    });
  };

  $scope.canGoBack = function() {
    return passthroughMode;
  };

  $scope.goBack = function() {
    $ionicHistory.nextViewOptions({
      disableAnimate: true
    });
    $ionicHistory.goBack();
  };

});
