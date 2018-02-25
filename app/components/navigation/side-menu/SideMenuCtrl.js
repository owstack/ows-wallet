'use strict';

angular.module('owsWalletApp.controllers').controller('SideMenuCtrl', function($scope, platformInfoService) {
	$scope.isCordova = platformInfoService.isCordova;
});
