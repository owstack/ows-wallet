'use strict';

angular.module('owsWalletApp.pluginModel').factory('Constants', function () {

   // Constructor
   // See https://medium.com/opinionated-angularjs/angular-model-objects-with-javascript-classes-2e6a067c73bc#.970bxmciz
  function Constants() {
    return this;
  };

  // Only one envronment state is defined.
  Constants.ENVIRONMENT_ID = 'default';

  // The options for applet and applet category presenation in a view.
  Constants.PRESENTATION_CATEGORIES = 'Categories';
  Constants.PRESENTATION_GRID = 'Grid';
  Constants.PRESENTATION_LIST = 'List';

  Constants.APPLET_PRESENTATION_DEFAULT = Constants.PRESENTATION_GRID;
  Constants.APPLET_CATEGORY_PRESENTATION_DEFAULT = Constants.PRESENTATION_LIST;

  Constants.appletPresentationOptions = [
    Constants.PRESENTATION_CATEGORIES,
    Constants.PRESENTATION_GRID,
    Constants.PRESENTATION_LIST
  ];

  Constants.appletCategoryPresentationOptions = [
    Constants.PRESENTATION_LIST
  ];

  return Constants;
});