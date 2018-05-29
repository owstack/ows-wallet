'use strict';
angular.module('owsWalletApp.services').factory('feedbackService', function($http, $log, $httpParamSerializer, appConfig) {
  var root = {};

  root.send = function(dataSrc, cb) {
    $http(_post(dataSrc)).then(function() {
      $log.info("Feedback sent");
      return cb();
    }, function(err) {
      $log.info("Could not send feedback");
      return cb(err);
    });
  };

  // Get more info: https://mashe.hawksey.info/2014/07/google-sheets-as-a-database-insert-with-apps-script-using-postget-methods-with-ajax-example/
  var _post = function(dataSrc) {
    return {
      method: 'POST',
      url: appConfig.gappFeedbackUrl,
      headers: {
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8'
      },
      data: $httpParamSerializer(dataSrc)
    };
  };

  root.isVersionUpdated = function(currentVersion, savedVersion) {
    if (!verifyTagFormat(currentVersion))
      return 'Cannot verify the format of version tag: ' + currentVersion;
    if (!verifyTagFormat(savedVersion))
      return 'Cannot verify the format of the saved version tag: ' + savedVersion;

    var current = formatTagNumber(currentVersion);
    var saved = formatTagNumber(savedVersion);
    if (saved.major > current.major || (saved.major == current.major && saved.minor > current.minor))
      return false;

    return true;

    function verifyTagFormat(tag) {
      var regex = /^v?\d+\.\d+\.\d+$/i;
      return regex.exec(tag);
    };

    function formatTagNumber(tag) {
      var formattedNumber = tag.replace(/^v/i, '').split('.');
      return {
        major: +formattedNumber[0],
        minor: +formattedNumber[1],
        patch: +formattedNumber[2]
      };
    };
  };

  return root;
});
