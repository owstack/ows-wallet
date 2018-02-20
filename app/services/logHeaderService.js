'use strict';
angular.module('owsWalletApp.services')
  .factory('logHeaderService', function($window, appConfigService, $log, platformInfoService) {
    $log.info(appConfigService.nameCase + ' v' + $window.version + ' #' + $window.commitHash);
    $log.info('Client: ' + JSON.stringify(platformInfoService));
    return {};
  });
