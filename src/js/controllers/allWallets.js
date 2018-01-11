'use strict';

angular.module('owsWalletApp.controllers').controller('allWalletsController',
  function($scope, lodash) {

    var physicalScreenWidth = ((window.innerWidth > 0) ? window.innerWidth : screen.width); // TODO: use global value
    var physicalScreenHeight = ((window.innerHeight > 0) ? window.innerHeight : screen.height); // TODO: use global value

    var itemWidth = 150;
    var itemHeight = 150;
    var itemMargin = 5;

    var maxCols = Math.floor(physicalScreenWidth / (itemWidth + 2 * itemMargin));
    var maxRows = Math.floor(physicalScreenHeight / (itemHeight + 2 * itemMargin));
    var rowHeight = itemHeight + 2* itemMargin;

    $scope.gridsterOpts = {
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
      minColumns: 1, // the minimum columns the grid must have
      minRows: 1, // the minimum height of the grid, in rows
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
          saveWalletState($scope.wallets);
        }
      }
    };

    $scope.walletLayoutMap = {
      row: 'wallet.prefs.layout.position[0]',
      col: 'wallet.prefs.layout.position[1]'
    };

    function saveWalletState(wallets) {
      // Don't do anything if there is no layout.
//      if (lodash.isEmpty(wallets)) return;
//      if (lodash.isUndefined(wallets[wallets.length-1].layout)) return;
//      if (lodash.isEmpty(wallets[wallets.length-1].layout)) return;

    };
/*
    function initWalletPositions() {
      // Get the collection of wallets that need positioning.
      var wallets = lodash.filter($scope.wallets, function(wallet) {
        return lodash.isUndefined(wallet.layout) || lodash.isEmpty(wallet.layout) || lodash.isEqual(wallet.layout, {position:{'0':9999,'1':9999}});
      });

      if (lodash.isEmpty(wallets)) return;

      // Walk through each row and column looking for a place the wallets will fit.
      var i = 0;
      initLayout:
      for (var rowIndex = 0; rowIndex < $scope.gridsterOpts.maxRows; ++rowIndex) {
        for (var colIndex = 0; colIndex < $scope.gridsterOpts.columns; ++colIndex) {

          var testWallet = lodash.find($scope.wallets, function(wallet) {
            return lodash.isEqual(wallet.layout, {
              position: {'0': rowIndex, '1': colIndex}
            });
          });

          if (lodash.isUndefined(testWallet)) {
            // Position available.
            $scope.wallets[i++].layout = {
              position: {'0': rowIndex, '1': colIndex}
            };

            if (i >= $scope.wallets.length) {
              break initLayout;
            }
          }
        }
      }
    };

    initWalletPositions();
*/
  });
