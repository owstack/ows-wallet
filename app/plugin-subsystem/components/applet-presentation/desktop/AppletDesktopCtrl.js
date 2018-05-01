'use strict';

angular.module('owsWalletApp.pluginControllers').controller('AppletDesktopCtrl', function($scope, $rootScope, $log, $ionicSlideBoxDelegate, lodash, appletService, appletCatalogService, FocusedWallet, Constants, isMobile, isCordova) {

  var self = this;
  this.applets = [];

  var useViewManagedStatusBar = isMobile.iOS() && isCordova; // TODO: use global value
  var physicalScreenWidth = ((window.innerWidth > 0) ? window.innerWidth : screen.width); // TODO: use global value
  var physicalScreenHeight = ((window.innerHeight > 0) ? window.innerHeight : screen.height); // TODO: use global value

  // Usable screen height considers the device status bar height and the wallet bar height.
  var usableScreenHeight = (useViewManagedStatusBar ? physicalScreenHeight - 40 : physicalScreenHeight - 20);
  var itemHeight = 90;
  var maxCols = (physicalScreenWidth < 768 ? 4 : 5);
  var maxRows = Math.floor(physicalScreenHeight / itemHeight);
  var rowHeight = Math.floor(usableScreenHeight / maxRows);

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
      handle: '', // optional selector for resize handle
      start: function(event, $element, widget) {}, // optional callback fired when drag is started,
      drag: function(event, $element, widget) {}, // optional callback fired when item is moved,
      stop: function(event, $element, widget) { // optional callback fired when item is finished dragging
        saveAppletState(self.applets);
      }
    }
  };

  $scope.appletLayoutMap = {
    row: 'applet.layout.position[0]',
    col: 'applet.layout.position[1]'
  };

  function saveAppletState(applets) {
    // Don't do anything if there is no layout.
    if (lodash.isEmpty(applets)) return;
    if (lodash.isUndefined(applets[applets.length-1].layout)) return;
    if (lodash.isEmpty(applets[applets.length-1].layout)) return;

    appletService.updateAppletState(applets, {
      presentation: Constants.PRESENTATION_GRID
    });
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

  function refresh() {
    self.applets = appletService.getAppletsWithState({
      visible: true
    });
    initAppletPositions();
  };

  this.init = function() {
    $ionicSlideBoxDelegate.$getByHandle('appletPresentationSlideBox').enableSlide(false);
    refresh();
    saveAppletState(self.applets);
  };

  // Applets change when the theme is changed.
  var removeThemeUpdated = $rootScope.$on('Local/ThemeUpdated', function(event) {
    $log.debug('applet refresh - Local/ThemeUpdated');
    self.applets = appletService.getAppletsWithState({
      visible: true
    });
  });

  // Applets change when the theme is changed.
  var removeAppletPreferencesUpdated = $rootScope.$on('Local/AppletPreferencesUpdated', function(event) {
    self.applets = appletService.getAppletsWithState({
      visible: true
    });
    initAppletPositions();
  });

  // Listen for changes to wallet skins and update wallet applets.
  // TODO: manage only the change rather than refreshing the whole collection.
  var removeSkinUpdated = $rootScope.$on('Local/SkinUpdated', function(event, skin, walletId) {
    $log.debug('applet refresh - Local/SkinUpdated ' + skin.header.name + ' for ' + walletId);
    self.applets = appletService.getAppletsWithState({
      visible: true
    });
  });

  // Listen for new or deleted wallets.
  // TODO: manage only the change rather than refreshing the whole collection.
  var removeNewFocusedWallet = $rootScope.$on('Local/NewFocusedWallet', function(event, fc) {
    $log.debug('applet refresh - Local/NewFocusedWallet');
    self.applets = appletService.getAppletsWithState({
      visible: true
    });
  });

  // Listen for wallet name changes.
  // TODO: manage only the change rather than refreshing the whole collection.
  var removeAliasUpdated = $rootScope.$on('Local/AliasUpdated', function(event) {
    self.applets = appletService.getAppletsWithState({
      visible: true
    });
  });

  $scope.$on('$destroy', function() {
    removeThemeUpdated();
    removeAppletPreferencesUpdated();
    removeSkinUpdated();
    removeNewFocusedWallet();
    removeAliasUpdated();
  });

});
