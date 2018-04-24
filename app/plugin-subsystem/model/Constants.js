'use strict';

angular.module('owsWalletApp.pluginModel').factory('Constants', function () {

   // Constructor
   // See https://medium.com/opinionated-angularjs/angular-model-objects-with-javascript-classes-2e6a067c73bc#.970bxmciz
  function Constants() {
    return this;
  };

  Constants.LAYOUT_CATEGORIES = 'Categories';
  Constants.LAYOUT_DESKTOP = 'Desktop';
  Constants.LAYOUT_LIST = 'List';
  Constants.LAYOUT_DEFAULT = Constants.LAYOUT_DESKTOP;

  Constants.appletPresentationOptions = [Constants.LAYOUT_CATEGORIES, Constants.LAYOUT_DESKTOP, Constants.LAYOUT_LIST];

  return Constants;
});