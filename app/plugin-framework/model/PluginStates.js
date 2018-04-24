'use strict';
angular.module('owsWalletApp.pluginModel').factory('PluginStates', function ($log, lodash, Constants, storageService) {

  var self = this;

  var _instance;

  var defaultStates = {
    metadata: {},
    environment: {
      presentation: Constants.LAYOUT_DEFAULT
    },
    categoryState: [],
    appletState: []
  };

  // Constructor
  //
  function PluginStates(cb) {
    var self = this;
    get(function(err, states) {
      lodash.assign(self, states);
      _instance = self;
      cb(err, _instance);
    });
  };

  // Static methods
  //
  PluginStates.getInstance = function() {
    if (!_instance) {
      throw new Error('PluginStates has not been created, call create() before getInstance()');
    }
    return _instance;
  };

  // Public methods
  //
  PluginStates.prototype.save = function(states, cb) {
    set(states, cb);
  };

  // Private methods
  //
  function get(cb) {
    storageService.getPluginStates(function(err, storedStates) {
      var statesCache;
      if (storedStates) {
        statesCache = JSON.parse(storedStates);
      } else {
        $log.debug('Initializing plugin states from default');
        statesCache = lodash.clone(defaultStates);
      }
      $log.debug('Plugin states read:', statesCache);
      return cb(err, statesCache);
    });
  };

  function set(newStates, cb) {
    var states = lodash.cloneDeep(defaultStates);

    storageService.getPluginStates(function(err, oldStates) {
      if (lodash.isString(oldstates)) {
        if (oldStates.length == 0)
          oldStates = '{}';
        oldStates = JSON.parse(oldStates);
      }
      if (lodash.isString(states)) {
        states = JSON.parse(states);
      }
      if (lodash.isString(newStates)) {
        newStates = JSON.parse(newStates);
      }
      lodash.assign(states, oldStates, newStates);

      storageService.storePluginStates(JSON.stringify(states), function(err) {
        cb(err, states);
      });
    });
  };

  return PluginStates;
});
