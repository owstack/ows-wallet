'use strict';

angular.module('owsWalletApp.pluginServices').factory('appletDataService', function($log, lodash, storageService) {

  var root = {};
  var ctx;

  // Set our context (state)
  root.init = function(context) {
    $log.debug('Initializing applet data service');
    ctx = context;
  };

  root.getData = function(appletId, cb) {
    storageService.getValueByKey(appletId, function(err, data) {
      if (data) {
        data = JSON.parse(data);
      } else {
        data = {};
      }
      $log.debug('Applet data read (' + appletId + '):', data);
      return cb(err, data);
    });
  };

  root.setData = function(appletId, newData, cb) {
    storageService.getValueByKey(appletId, function(err, oldData) {
      oldData = oldData || {};
      if (lodash.isString(oldData)) {
        if (oldData.length == 0)
          oldData = '{}';
        oldData = JSON.parse(oldData);
      }
      if (lodash.isString(newData)) {
        newData = JSON.parse(newData);
      }
      var data = oldData;
      lodash.merge(data, newData);
      storageService.storeValueByKey(appletId, JSON.stringify(data), function() {
        if (!err) {
          // Track the write operation.
          trackAppletData(appletId);
        }
      });
    });
  };

  function trackAppletData(appletId, opts) {
    var state = ctx.state;
    state.timestampApplet(appletId, function(err) {
      if (err) {
        $rootScope.$emit('Local/DeviceError', err);
        return;
      }
    });
  };

  return root;
});
