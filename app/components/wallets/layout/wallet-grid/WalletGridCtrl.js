'use strict';

angular.module('owsWalletApp.controllers').controller('WalletGridCtrl', function($scope, lodash, uiService, walletService) {

  $scope.showOptionsMenu = false;
  $scope.editMode = false;

  var physicalScreenWidth = ((window.innerWidth > 0) ? window.innerWidth : screen.width);
  var physicalScreenHeight = ((window.innerHeight > 0) ? window.innerHeight : screen.height);

  var itemWidth = 150; // px
  var itemHeight = 150; // px
  var itemMargin = 5; // px

  var maxCols = Math.floor(physicalScreenWidth / (itemWidth + 2 * itemMargin));
  var maxRows = 100;
  var rowHeight = itemHeight + 2 * itemMargin;

  var maxFavorites = 6;

  $scope.gridsterOpts = {
    columns: maxCols, // the width of the grid, in columns
    pushing: true, // whether to push other items out of the way on move or resize
    floating: false, // whether to automatically float items up so they stack (you can temporarily disable if you are adding unsorted items with ng-repeat)
    swapping: true, // whether or not to have items of the same size switch places instead of pushing down if they are the same size
    width: 'auto', // can be an integer or 'auto'. 'auto' scales gridster to be the full width of its containing element
    colWidth: 'auto', // can be an integer or 'auto'.  'auto' uses the pixel width of the element divided by 'columns'
    rowHeight: 'match',//rowHeight, // can be an integer or 'match'.  Match uses the colWidth, giving you square widgets.
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
      enabled: false, // whether dragging items is supported
      handle: '', // optional selector for resize handle
      start: function(event, $element, widget) {}, // optional callback fired when drag is started,
      drag: function(event, $element, widget) {}, // optional callback fired when item is moved,
      stop: function(event, $element, widget) { // optional callback fired when item is finished dragging
        updateGroupMembership();
        saveWalletLayout();
      }
    }
  };

  $scope.walletLayoutMap = {
    row: 'wallet.layout.position[0]',
    col: 'wallet.layout.position[1]'
  };

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    $scope.wallets = data.stateParams.wallets;
    $scope.openWallet = data.stateParams.openWallet;
    initWalletPositions();
  });

  $scope.openOptionsMenu = function() {
    $scope.showOptionsMenu = true;
  };

  $scope.startEditFavorites = function() {
    $scope.showOptionsMenu = false;
    $scope.editMode = true;
    $scope.gridsterOpts.draggable.enabled = true;
  };

  $scope.stopEdit = function() {
    $scope.editMode = false;
    $scope.gridsterOpts.draggable.enabled = false;
  };

  function saveWalletLayout() {
    function save(n) {
      if (n < wallets.length) {
        walletService.setPreference(wallets[n].id, 'layout', wallets[n].layout, function(err) {
          save(n + 1);
        });
      }
    }

    // Clone needed since writing preferences for each wallet would otherwise refresh the underlying scope object.
    var wallets = lodash.cloneDeep($scope.wallets);
    save(0);
  };

  function initWalletPositions() {
    // Get the collection of wallets that need positioning.
    var wallets = lodash.filter($scope.wallets, function(wallet) {
      return lodash.isEmpty(wallet.layout.position);
    });

    if (lodash.isEmpty(wallets)) {
      return;
    }

    // Walk through each row and column looking for a place the wallets will fit.
    var i = 0;
    loop:
    for (var rowIndex = 0; rowIndex < $scope.gridsterOpts.maxRows; ++rowIndex) {
      for (var colIndex = 0; colIndex < $scope.gridsterOpts.columns; ++colIndex) {

        var foundWallet = lodash.find($scope.wallets, function(wallet) {
          return lodash.isEqual(wallet.layout, {
            position: {'0': rowIndex, '1': colIndex}
          });
        });

        if (lodash.isUndefined(foundWallet)) {
          // No wallet at this position.
          wallets[i++].layout.position = {
            '0': rowIndex,
            '1': colIndex
          };

          if (i >= wallets.length) {
            break loop;
          }
        }
      }
    }
  };

  function updateGroupMembership() {
    var n = 0;
    loop:
    for (var rowIndex = 0; rowIndex < $scope.gridsterOpts.maxRows; ++rowIndex) {
      for (var colIndex = 0; colIndex < $scope.gridsterOpts.columns; ++colIndex) {

        var wallet = lodash.find($scope.wallets, function(w) {
          return lodash.isEqual(w.layout.position, {
            '0': rowIndex,
            '1': colIndex
          });
        });

        if (!lodash.isUndefined(wallet)) {
          var pos = (rowIndex * $scope.gridsterOpts.columns) + colIndex + 1;
          if (pos <= maxFavorites) {
            // Assign to group
            wallet.layout.group = uiService.newWalletGroup('favorite', pos);
          } else {
            // Remove group assignment
            wallet.layout.group = uiService.newWalletGroup('');
          }
          n++;
        }

        if (n >= $scope.wallets.length) {
          break loop;
        }
      }
    }
  };

});
