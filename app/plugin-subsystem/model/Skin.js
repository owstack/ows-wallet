'use strict';
angular.module('owsWalletApp.pluginModel').factory('Skin', function ($log, lodash, Applet) {

  /**
   * Constructor (See https://medium.com/opinionated-angularjs/angular-model-objects-with-javascript-classes-2e6a067c73bc#.970bxmciz)
   */

  function Skin(obj, theme) {
    lodash.assign(this, obj);
//    this.theme = theme;
    return this;
  };

  /**
   * Public methods
   */

  Skin.prototype.canDelete = function() {
    return this.permissions['delete'];
  };

  Skin.prototype.setDelete = function(b) {
    this.permissions['delete'] = b;
  };

  Skin.prototype.toggleLike = function() {
//    this.header.social.iLikeThis = !this.header.social.iLikeThis;
  };
/*
  Skin.prototype.isApplet = function() {
    return this.header.kind == 'applet';
  };

  Skin.prototype.isVanity = function() {
    return this.header.kind == 'vanity';
  };

  Skin.prototype.getApplet = function() {
    if (!this.isApplet()) {
      return null;
    }
    return new Applet(this.applet, this);
  };
*/
  return Skin;
});
