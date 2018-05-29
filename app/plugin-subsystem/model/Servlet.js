'use strict';

angular.module('owsWalletApp.pluginModel').factory('Servlet', function ($rootScope, $log, lodash, ApiRouter, platformInfoService) {

  // Bit values for settings.
  // Avoids having to update schema to add booleans, also allows plugin schema to remain as a class.
  Servlet.FLAGS_NONE = 0;

  // Configuration schema and default values.
  var defaultConfiguration = {
    flags: Servlet.FLAGS_NONE
  };

  /**
   * Constructor (See https://medium.com/opinionated-angularjs/angular-model-objects-with-javascript-classes-2e6a067c73bc#.970bxmciz)
   */

  function Servlet(obj) {
    var self = this;

    lodash.assign(this, lodash.cloneDeep(obj));
    this.configuration = lodash.merge(lodash.cloneDeep(defaultConfiguration), obj.configuration);

    var container;

    /**
     * Priviledged methods
     */

    this.start = function(session) {
      var src = this.uri + 'index.html?sessionId=' + session.id + '&isCordova=' + platformInfoService.isCordova;
      
      container = angular.element('<iframe class="ng-hide" src="' + src + '"></iframe>');
      angular.element(document.body).append(container);
    };

    this.shutdown = function() {
      container.remove();
    };

    this.finalize = function(session, callback) {
      // Remove my host routes.
      ApiRouter.removeRoutes(session);
      callback();
    };

    return this;
  };
  
  return Servlet;
});
