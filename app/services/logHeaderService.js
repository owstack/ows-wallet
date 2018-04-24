'use strict';
angular.module('owsWalletApp.services')
  .factory('logHeaderService', function($window, appConfig, $log, platformInfoService) {
    $log.info(appConfig.nameCase + ' v' + $window.version + ' #' + $window.commitHash);
    $log.info('Client: ' + JSON.stringify(platformInfoService));
    return {};
  });
