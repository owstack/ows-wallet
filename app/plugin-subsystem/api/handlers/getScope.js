'use strict';

angular.module('owsWalletApp.pluginApi').service('getScope', function($rootScope, platformInfoService) {

	var root = {};

  root.respond = function(message, callback) {
    message.response = {
      statusCode: 200,
      statusText: 'OK',
      data: {
      	applet: $rootScope.applet,
        env: {
          isCordova: platformInfoService.isCordova,
          isNodeWebkit: platformInfoService.isNW,
          isMobile: {
            any: platformInfoService.isMobile,
            iOS: platformInfoService.isIOS,
            Android: platformInfoService.isAndroid
          },
          hasStatusBar: platformInfoService.isIOS && platformInfoService.isCordova
        }
      }
    };
    return callback(message);
  };

  return root;
});
