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
  'bchWalletClientModule',
  'btcWalletClientModule',
//  'ltcWalletClientModule',
  'bitauthModule',
  'owsWalletApp.filters',
  'owsWalletApp.model',
  'owsWalletApp.services',
  'owsWalletApp.controllers',
  'owsWalletApp.directives',
  'owsWalletApp.pluginApi',
  'owsWalletApp.pluginModel',
  'owsWalletApp.pluginServices'
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
