'use strict';

var modules = [
'angularMoment',
  'monospaced.qrcode',
  'gettext',
  'ionic',
  'ionic-toast',
  'angular-clipboard',
  'ngTouch',
  'ngLodash',
  'ngCsv',
  'angular-md5',
  'gridster',
  'angular-pattern-lock',
  'pathToRegexpModule',
  'djvModule',
  'ng-mfb',
  'laneolson.ui.dragdrop',
  'bitauthModule',
  'bchWalletClientModule',
  'btcWalletClientModule',
//  'ltcWalletClientModule',
  'owsWalletApp.filters',
  'owsWalletApp.model',
  'owsWalletApp.services',
  'owsWalletApp.controllers',
  'owsWalletApp.directives',
  'owsWalletApp.pluginApi',
  'owsWalletApp.pluginModel',
  'owsWalletApp.pluginServices',
  'owsWalletApp.pluginControllers'
];

var owsWalletApp = window.owsWalletApp = angular.module('owsWalletApp', modules);

angular.module('owsWalletApp.filters', []);
angular.module('owsWalletApp.model', []);
angular.module('owsWalletApp.services', []);
angular.module('owsWalletApp.controllers', []);
angular.module('owsWalletApp.directives', []);
angular.module('owsWalletApp.pluginApi', []);
angular.module('owsWalletApp.pluginModel', []);
angular.module('owsWalletApp.pluginServices', []);
angular.module('owsWalletApp.pluginControllers', []);
