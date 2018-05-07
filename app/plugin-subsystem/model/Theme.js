'use strict';

angular.module('owsWalletApp.pluginModel').factory('Theme', function (lodash) {

  /**
   * Constructor (See https://medium.com/opinionated-angularjs/angular-model-objects-with-javascript-classes-2e6a067c73bc#.970bxmciz)
   */

  function Theme(obj) {
    lodash.assign(this, obj);
    return this;
  };

  /**
   * Public methods
   */

  Theme.prototype.canDelete = function() {
    return this.header.permissions['delete'];
  };

  Theme.prototype.setDelete = function(b) {
    this.header.permissions['delete'] = b;
  };

  Theme.prototype.toggleLike = function() {
    this.header.social.iLikeThis = !this.header.social.iLikeThis;
  };

  return Theme;
});