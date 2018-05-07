'use strict';

angular.module('owsWalletApp.pluginApi').service('getPlatformInfo', function($rootScope, platformInfoService) {

	var root = {};

  root.respond = function(message, callback) {
    message.response = {
      statusCode: 200,
      statusText: 'OK',
      data: {
        isCordova: platformInfoService.isCordova,
        isNodeWebkit: platformInfoService.isNW,
        isSafari: platformInfoService.isSafari,
        userAgent: platformInfoService.ua,
        isMobile: {
          any: platformInfoService.isMobile,
          iOS: platformInfoService.isIOS,
          iPhoneX: platformInfoService.isIPhoneX,
          Android: platformInfoService.isAndroid
        }
      }
    };
    return callback(message);
  };

  return root;
});
