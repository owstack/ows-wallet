'use strict';

angular.module('owsWalletApp.pluginControllers').controller('AppletCategoryCtrl', function($scope, $rootScope, $log, $ionicSlideBoxDelegate, $ionicSideMenuDelegate, $ionicModal, $timeout, lodash, appletService, appletCatalogService, FocusedWallet, Constants, isMobile, isCordova, go) {

  var self = this;
  this.categories = [];
  this.editing = false;
  this.editingDone = false;

  var useViewManagedStatusBar = isMobile.iOS() && isCordova; // TODO: use global value
  var physicalScreenWidth = ((window.innerWidth > 0) ? window.innerWidth : screen.width); // TODO: use global value
  var physicalScreenHeight = ((window.innerHeight > 0) ? window.innerHeight : screen.height); // TODO: use global value

  // Usable screen height considers the device status bar height and the wallet bar height.
  var usableScreenHeight = (useViewManagedStatusBar ? physicalScreenHeight - 40 : physicalScreenHeight - 20);
  var itemHeight = 90;
  var maxCols = 1;
  var maxRows = 1000;
  var rowHeight = 90;

  this.gridsterOpts = {
    columns: maxCols, // the width of the grid, in columns
    pushing: true, // whether to push other items out of the way on move or resize
    floating: false, // whether to automatically float items up so they stack (you can temporarily disable if you are adding unsorted items with ng-repeat)
    swapping: true, // whether or not to have items of the same size switch places instead of pushing down if they are the same size
    width: 'auto', // can be an integer or 'auto'. 'auto' scales gridster to be the full width of its containing element
    colWidth: 'auto', // can be an integer or 'auto'.  'auto' uses the pixel width of the element divided by 'columns'
    rowHeight: rowHeight, // can be an integer or 'match'.  Match uses the colWidth, giving you square widgets.
    margins: [0, 0], // the pixel distance between each widget
    outerMargin: true, // whether margins apply to outer edges of the grid
    isMobile: false, // stacks the grid items if true
    mobileBreakPoint: 600, // if the screen is not wider that this, remove the grid layout and stack the items
    mobileModeEnabled: false, // whether or not to toggle mobile mode when screen width is less than mobileBreakPoint
    minColumns: 4, // the minimum columns the grid must have
    minRows: 2, // the minimum height of the grid, in rows
    maxRows: maxRows,
    defaultSizeX: 1, // the default width of a gridster item, if not specifed
    defaultSizeY: 1, // the default height of a gridster item, if not specified
    minSizeX: 1, // minimum column width of an item
    maxSizeX: null, // maximum column width of an item
    minSizeY: 1, // minumum row height of an item
    maxSizeY: null, // maximum row height of an item
    resizable: {
      enabled: false,
      handles: ['n', 'e', 's', 'w', 'ne', 'se', 'sw', 'nw'],
      start: function(event, $element, widget) {}, // optional callback fired when resize is started,
      resize: function(event, $element, widget) {}, // optional callback fired when item is resized,
      stop: function(event, $element, widget) {} // optional callback fired when item is finished resizing
    },
    draggable: {
      enabled: true, // whether dragging items is supported
      handle: '.applet-card-drag-handle', // optional selector for resize handle
      scrollSensitivity: 20, // Distance in pixels from the edge of the viewport after which the viewport should scroll, relative to pointer
      scrollSpeed: 15, // Speed at which the window should scroll once the mouse pointer gets within scrollSensitivity distance
      start: function(event, $element, widget) {}, // optional callback fired when drag is started,
      drag: function(event, $element, widget) {}, // optional callback fired when item is moved,
      stop: function(event, $element, widget) { // optional callback fired when item is finished dragging
        compactCategoryList();
        saveCategoryState(self.categories);
      }
    }
  };

  $scope.categoryLayoutMap = {
    row: 'category.layout.position[0]',
    col: 'category.layout.position[1]'
  };

  function saveCategoryState(categories) {
    if (lodash.isEmpty(categories)) return;
    appletService.updateAppletCategoryState(categories);
  };

  function initCategoryPositions() {
    // Get the collection of categories that need positioning.
    var categories = lodash.filter(self.categories, function(category) {
      return lodash.isUndefined(category.layout) || lodash.isEmpty(category.layout) || lodash.isEqual(category.layout, {position:{'0':9999,'1':9999}});
    });

    if (lodash.isEmpty(categories)) return;

    // Walk through each row and column looking for a place the categories will fit.
    var i = 0;
    initLayout:
    for (var rowIndex = 0; rowIndex < self.gridsterOpts.maxRows; ++rowIndex) {
      for (var colIndex = 0; colIndex < self.gridsterOpts.columns; ++colIndex) {

        var testCategory = lodash.find(self.categories, function(category) {
          return lodash.isEqual(category.layout, {
            position: {'0': rowIndex, '1': colIndex}
          });
        });

        if (lodash.isUndefined(testCategory)) {
          // Position available.
          categories[i++].layout = {
            position: {'0': rowIndex, '1': colIndex}
          };

          if (i >= categories.length) {
            break initLayout;
          }
        }
      }
    }
  };

  function compactCategoryList() {
    // Eliminate any whitespace gaps in the list.
    self.categories = lodash.sortBy(self.categories, function(category) {
      // Categories with no layout are sorted to the top.
      return (!lodash.isUndefined(category.layout) ? category.layout.position[0] : 0);
    });

    // The first entry must be at the top.
    self.categories[0].layout.position[0] = 0;

    for (var i = 0; i < self.categories.length - 1; i++) {
      if (self.categories[i+1].layout.position[0] > self.categories[i].layout.position[0] + 1) {
        self.categories[i+1].layout.position[0] = self.categories[i].layout.position[0] + 1;
      }
    }
  };

  function refresh() {
    self.categories = appletService.getAppletCategoriesWithState();
    initCategoryPositions();
    compactCategoryList();
  };

  this.init = function() {
    appletService.clearActiveCategory();
    refresh();
    saveCategoryState(this.categories);
  };

  this.saveCategory = function(oldCategory, newCategory) {
    if (lodash.isEqual(oldCategory, newCategory)) return;

    // Category name - renaming a category is accomplished by re-assigning member applets to a new or existing category.
    if (oldCategory.header.name != newCategory.header.name) {

      var applets = appletService.getAppletsWithState({
        category: oldCategory
      });

      for (var i = 0; i < applets.length; i++) {
        applets[i].preferences.category = newCategory.header.name;
      }

      appletService.updateAppletState(applets, {
        presentation: Constants.PRESENTATION_CATEGORIES
      }, function() {
        refresh();
        saveCategoryState(self.categories);
      });
    }
  }

  this.openApplet = function(applet) {
    if (this.editing) return;

    // The caller may pass a string indicating an appletId.
    if (typeof applet === 'string' || applet instanceof String) {
      applet = appletService.getAppletWithStateById(applet);
      // Do nothing if the applet was not found.
      if (lodash.isUndefined(applet)) return;
    }

    applet.open();
    if (!appletService.isAppletPlugin(applet)) {
      $ionicSideMenuDelegate.$getByHandle('app-side-menus').toggleRight();
    }
  };

  this.goAppletCategoryList = function(category) {
    appletService.setActiveCategory(category);
    $ionicSlideBoxDelegate.$getByHandle('appletPresentationSlideBox').slide(1);
    this.endEdit();
  };

  this.beginEdit = function() {
    this.editing = true;
    this.editingDone = false;
  };

  this.endEdit = function() {
    this.editing = false;
    this.editingDone = true;
  };

  this.isEditing = function() {
    return this.editing;
  };

  this.doneEditing = function() {
    return this.editingDone;
  };

  this.openPreferences = function(category) {
    $scope.oldCategory = lodash.cloneDeep(category);
    $scope.newCategory = lodash.cloneDeep(category);

    $ionicModal.fromTemplateUrl('views/modals/applet-category-preferences.html', {
      scope: $scope,
      backdropClickToClose: false,
      hardwareBackButtonClose: false,
      animation: 'slide-in-up',
    }).then(function(modal) {
      $scope.appletCategoryPreferencesModal = modal;
      $scope.appletCategoryPreferencesModal.show();
    });
  };

  this.closeModal = function() {
    $scope.appletCategoryPreferencesModal.hide();
    $scope.appletCategoryPreferencesModal.remove();
  };

  // Categories may change when preferences are updated.
  var removeAppletPreferencesUpdated = $rootScope.$on('Local/AppletPreferencesUpdated', function(event) {
    refresh();
  });

  // The active category was changed.
  var removeAppletCategoryUpdated = $rootScope.$on('Local/AppletCategoryUpdated', function(event, category) {
    refresh();
  });

  $scope.$on('$destroy', function() {
    removeAppletPreferencesUpdated();
    removeAppletCategoryUpdated();
  });

});
