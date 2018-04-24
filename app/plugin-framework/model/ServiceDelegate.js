'use strict';
angular.module('owsWalletApp.pluginModel').factory('ServiceDelegate', function () {

   // Constructor
   // 
  function ServiceDelegate(service) {
    this.service = service;
    return this;
  };

  // Public methods
  // 
  ServiceDelegate.prototype.call = function(fnStr, args) {
    var fn = this.service[fnStr];
    if (typeof fn === "function") {
      return fn.apply(null, args);
    } else {
      throw new Error('Could not execute service function \'' + fnStr + '\', not a function');
    }
  };

  return ServiceDelegate;
});
