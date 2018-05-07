'use strict';
angular.module('owsWalletApp.pluginModel').factory('ServiceDelegate', function () {

  /**
   * Constructor (See https://medium.com/opinionated-angularjs/angular-model-objects-with-javascript-classes-2e6a067c73bc#.970bxmciz)
   */

  function ServiceDelegate(service) {
    this.service = service;
    return this;
  };

  /**
   * Public methods
   */

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
