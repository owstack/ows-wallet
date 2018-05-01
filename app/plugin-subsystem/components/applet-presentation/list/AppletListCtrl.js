'use strict';

angular.module('owsWalletApp.pluginControllers').controller('AppletListCtrl', function($scope, $rootScope, $log, $timeout, $ionicSideMenuDelegate, $ionicSlideBoxDelegate, $ionicModal, lodash, appletService, appletCatalogService, FocusedWallet, Constants, isMobile, isCordova) {

  var self = this;
  this.applets = [];
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
        compactAppletList();
        saveAppletState(self.applets);
      }
    }
  };

  $scope.appletLayoutMap = {
    row: 'applet.layout.position[0]',
    col: 'applet.layout.position[1]'
  };

  function saveAppletState(applets, callback) {
    // Don't do anything if there is no layout.
    if (lodash.isEmpty(applets)) return;
    if (lodash.isUndefined(applets[applets.length-1].layout)) return;
    if (lodash.isEmpty(applets[applets.length-1].layout)) return;

    // Choose the layout based on the active category.
    appletService.updateAppletState(applets, {
      presentation: currentLayout()
    }, callback);
  };

  function currentLayout() {
    return (lodash.isEmpty(appletService.getActiveCategory()) ? Constants.PRESENTATION_LIST : Constants.PRESENTATION_CATEGORIES);
  };

  function initAppletPositions() {
    // Get the collection of applets that need positioning.
    var applets = lodash.filter(self.applets, function(applet) {
      return lodash.isUndefined(applet.layout) || lodash.isEmpty(applet.layout) || lodash.isEqual(applet.layout, {position:{'0':9999,'1':9999}});
    });

    if (lodash.isEmpty(applets)) return;

    // Walk through each row and column looking for a place the applets will fit.
    var i = 0;
    initLayout:
    for (var rowIndex = 0; rowIndex < self.gridsterOpts.maxRows; ++rowIndex) {
      for (var colIndex = 0; colIndex < self.gridsterOpts.columns; ++colIndex) {

        var testApplet = lodash.find(self.applets, function(applet) {
          return lodash.isEqual(applet.layout, {
            position: {'0': rowIndex, '1': colIndex}
          });
        });

        if (lodash.isUndefined(testApplet)) {
          // Position available.
          applets[i++].layout = {
            position: {'0': rowIndex, '1': colIndex}
          };

          if (i >= applets.length) {
            break initLayout;
          }
        }
      }
    }
  };

  // Eliminate any whitespace gaps in the list.
  function compactAppletList() {
    self.applets = lodash.sortBy(self.applets, function(applet) {
      return applet.layout.position[0];
    });

    // The first entry must be at the top.
    self.applets[0].layout.position[0] = 0;

    for (var i = 0; i < self.applets.length - 1; i++) {
      if (self.applets[i+1].layout.position[0] > self.applets[i].layout.position[0] + 1) {
        self.applets[i+1].layout.position[0] = self.applets[i].layout.position[0] + 1;
      }
    }
  };

  function refresh() {
    self.applets = appletService.getAppletsWithState({
      category: appletService.getActiveCategory(),
      visible: true
    });
    initAppletPositions();
    compactAppletList();
  };

  this.init = function() {
    $ionicSlideBoxDelegate.$getByHandle('appletPresentationSlideBox').enableSlide(false);
    refresh();
    saveAppletState(self.applets);
  };

  this.activeCategoryName = function() {
    var name = '';
    var activeCategory = appletService.getActiveCategory();
    if (!lodash.isEmpty(activeCategory)) {
      name = activeCategory.header.name;
    }
    return name;
  };

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

  this.saveApplet = function(oldApplet, newApplet) {
    if (lodash.isEqual(oldApplet, newApplet)) {
      return;
    }

    // Category name - reassign the applet to another category.
    if (oldApplet.preferences.category != newApplet.preferences.category) {
      saveAppletState([newApplet], function() {
        appletService.createAppletCategory(newApplet.preferences.category, function(appletCategory) {
          appletService.setActiveCategoryByName(newApplet.preferences.category);
          refresh();
        });
      });
    }
  }

  this.goAppletCategories = function() {
    $ionicSlideBoxDelegate.$getByHandle('appletPresentationSlideBox').slide(0);
    this.endEdit();

    // Wait for animation to complete before removing the category.
    $timeout(function() {
      appletService.clearActiveCategory();
    }, 100);
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

  this.openPreferences = function(applet) {
    $scope.oldApplet = lodash.cloneDeep(applet);
    $scope.newApplet = lodash.cloneDeep(applet);

    $ionicModal.fromTemplateUrl('views/modals/applet-preferences.html', {
      scope: $scope,
      backdropClickToClose: false,
      hardwareBackButtonClose: false,
      animation: 'slide-in-up',
    }).then(function(modal) {
      $scope.appletPreferencesModal = modal;
      $scope.appletPreferencesModal.show();
    });
  };

  this.closeModal = function() {
    $scope.appletPreferencesModal.hide();
    $scope.appletPreferencesModal.remove();
  };

  // Applets change when the theme is changed.
  var removeThemeUpdated = $rootScope.$on('Local/ThemeUpdated', function(event) {
    $log.debug('applet refresh - Local/ThemeUpdated');
    self.applets = appletService.getAppletsWithState({
      category: appletService.getActiveCategory(),
      visible: true
    });
  });

  // Applets change when the theme is changed.
  var removeAppletPreferencesUpdated = $rootScope.$on('Local/AppletPreferencesUpdated', function(event) {
    self.applets = appletService.getAppletsWithState({
      category: appletService.getActiveCategory(),
      visible: true
    });
    compactAppletList();
  });

  // Listen for changes to wallet skins and update wallet applets.
  // TODO: manage only the change rather than refreshing the whole collection.
  var removeSkinUpdated = $rootScope.$on('Local/SkinUpdated', function(event, skin, walletId) {
    $log.debug('applet refresh - Local/SkinUpdated ' + skin.header.name + ' for ' + walletId);
    self.applets = appletService.getAppletsWithState({
      category: appletService.getActiveCategory(),
      visible: true
    });
  });

  // Listen for new or deleted wallets.
  // TODO: manage only the change rather than refreshing the whole collection.
  var removeNewFocusedWallet = $rootScope.$on('Local/NewFocusedWallet', function(event, fc) {
    $log.debug('applet refresh - Local/NewFocusedWallet');
    self.applets = appletService.getAppletsWithState();
  });

  var removeWalletAppletUpdated = $rootScope.$on('Local/WalletAppletUpdated', function(event, walletApplet) {
    $log.debug('wallet update - Local/WalletAppletUpdated');
    // Replace the existing wallet applet with the updated wallet applet.
    var index = lodash.findIndex(self.applets, function(applet) {
      return applet.header.id == walletApplet.header.id;
    });
    if (index >= 0) {
      // Attach the applet preferences and layout to the updated applet before replacing it.
      walletApplet.preferences = self.applets[index].preferences;
      walletApplet.layout = self.applets[index].layout;
      self.applets[index] = walletApplet;

      $timeout(function() {
        $rootScope.$apply();
      });
    }
  });

  // Listen for wallet name changes.
  // TODO: manage only the change rather than refreshing the whole collection.
  var removeAliasUpdated = $rootScope.$on('Local/AliasUpdated', function(event) {
    self.applets = appletService.getAppletsWithState({
      category: appletService.getActiveCategory(),
      visible: true
    });
  });

  $scope.$on('$destroy', function() {
    removeThemeUpdated();
    removeAppletPreferencesUpdated();
    removeSkinUpdated();
    removeNewFocusedWallet();
    removeWalletAppletUpdated();
    removeAliasUpdated();
  });

});
