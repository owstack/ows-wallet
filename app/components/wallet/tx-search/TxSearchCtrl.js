'use strict';

angular.module('owsWalletApp.controllers').controller('TxSearchCtrl', function($scope, $interval, $timeout, $log, $ionicScrollDelegate, lodash, gettext, gettextCatalog, platformInfoService, uxLanguageService, addressBookService) {

  var HISTORY_SHOW_LIMIT = 10;
  var currentTxHistoryPage = 0;
  var wallet;
  var isCordova = platformInfoService.isCordova;

  // From parent view controller.
  $scope.txHistorySearchResults = $scope.txHistory;

  $scope.updateSearchInput = function(search) {
    if (isCordova) {
      window.plugins.toast.hide();
    }
    currentTxHistoryPage = 0;
    throttleSearch(search);
    $timeout(function() {
      $ionicScrollDelegate.$getByHandle('txSearchScroll').resize();
    }, 10);
  }

  var throttleSearch = lodash.throttle(function(search) {
    function filter(search) {
      $scope.filteredTxHistory = [];

      function computeSearchableString(tx) {
        var addrbook = '';
        if (tx.addressTo && $scope.addressbook) {
          var abEntries = addressBookService.findByAddress($scope.addressbook, tx.addressTo);
          lodash.forEach(abEntries, function(entry) {
            addrbook += entry.name;
          });
        }

        var searchableDate = computeSearchableDate(new Date(tx.time * 1000));
        var message = tx.message ? tx.message : '';
        var comment = tx.note ? tx.note.body : '';
        var outputs = computeSearchableOutputs(tx.outputs);
        var txid = tx.txid ? tx.txid : '';
        var action = tx.action ? tx.action : '';
        return ((action + tx.amountStr + message + addrbook + searchableDate + comment + txid + outputs).toString()).toLowerCase();
      }

      function computeSearchableDate(date) {
        var lang = uxLanguageService.getCurrentLanguage();
        var monthLong = date.toLocaleString(lang, {month: 'long'});
        var monthShort = date.toLocaleString(lang, {month: 'short'});
        var weekday = date.toLocaleString(lang, {weekday: 'long'});
        var day = ('' + date.getDate()).slice(-2).toString();
        var month = ('' + (date.getMonth() + 1)).slice(-2).toString();
        var year = date.getFullYear();
        var monthDayYear = monthShort + ' ' + day + ', ' + year;
        return [month, day, year].join('/') + monthDayYear + monthLong + weekday;
      };

      function computeSearchableOutputs(outputs) {
        var result = '';
        lodash.forEach(outputs, function(output) {
          result += output.address;
          result += output.message ? output.message : '';
        });
        return result;
      };

      if (lodash.isEmpty(search)) {
        $scope.txHistoryShowMore = false;
        return $scope.txHistory;
      }

      var searchTerms = search.split('+');
      var searchResults = $scope.completeTxHistory;

      lodash.forEach(searchTerms, function(searchTerm) {
        if (searchTerm.length > 0) {
          searchResults = lodash.filter(searchResults, function(tx) {
            if (!tx.searchableString) {
              tx.searchableString = computeSearchableString(tx);
            }
            return lodash.includes(tx.searchableString, searchTerm.toLowerCase());
          });
        }
      });
      
      $scope.filteredTxHistory = searchResults;

      if ($scope.filteredTxHistory.length > HISTORY_SHOW_LIMIT) {
        $scope.txHistoryShowMore = true;
      }
      else {
        $scope.txHistoryShowMore = false;
      }
      return $scope.filteredTxHistory;
    };

    $scope.txHistorySearchResults = filter(search).slice(0, HISTORY_SHOW_LIMIT);

    if (isCordova) {
      window.plugins.toast.showShortBottom(gettextCatalog.getString('Matches: ' + $scope.filteredTxHistory.length));
    }

    $timeout(function() {
      $scope.$apply();
    });

  }, 1000);

  $scope.moreSearchResults = function() {
    currentTxHistoryPage++;
    $scope.showHistory();
    $scope.$broadcast('scroll.infiniteScrollComplete');
  };

  $scope.showHistory = function() {
    $scope.txHistorySearchResults = $scope.filteredTxHistory ? $scope.filteredTxHistory.slice(0, (currentTxHistoryPage + 1) * HISTORY_SHOW_LIMIT) : [];
    $scope.txHistoryShowMore = $scope.filteredTxHistory.length > $scope.txHistorySearchResults.length;
  };

});
