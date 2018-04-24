'use strict';

angular.module('owsWalletApp.pluginServices').factory('appletDataService', function($log, lodash, storageService, PluginStates) {

  var root = {};

  function trackAppletData(appletId) {
    var states = PluginStates.getInstance();

    var index = lodash.findIndex(states.appletState, function(state) {
      return (state.appletId == appletId);
    });

    if (index >= 0 && !lodash.isUndefined(states.appletState[index].data)) {
      // Update the existing applet state data entry.
      states.appletState[index].data.updated = new Date();
    } else {
      // Applet state entry not found; create a new applet state entry with data.
      var now = new Date();
      var data = {
        updated: now,
        created: now
      };

      states.appletState.push({
        appletId: appletId,
        data: data
      });
    }

    states.save(states.appletState, function(err) {
      if (err) {
        $rootScope.$emit('Local/DeviceError', err);
        return;
      }
    });
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
      storageService.storeValueByKey(appletId, JSON.stringify(data), cb);
      trackAppletData(appletId);
    });
  };

  return root;
});
