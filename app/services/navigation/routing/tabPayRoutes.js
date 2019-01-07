'use strict';

angular.module('owsWalletApp.services').factory('tabPayRoutes', function() {
  var root = {};

  root.init = function(stateProvider) {
    stateProvider.state('tabsPay', {
      url: '/tabsPay',
      abstract: true,
      controller: 'TabsCtrl',
      templateUrl: 'views/navigation/tabs/pay/tabs.html'
    });
  };

  // State map for navigation routing.
  // Use 'alias' to map a state name used in the app implementation to a custom state for this navigation scheme.
  // Each 'entry' represents a well known state name and returns the state and view names for this navigaton scheme.
  root.map = {
    alias: {
      'home': 'dashboard'
    },
    entry: {
      'about':                          { stateName: 'tabsPay.about',                          viewNames: ['tab-more@tabsPay'] },
      'about.log':                      { stateName: 'tabsPay.about.log',                      viewNames: ['tab-more@tabsPay'] },
      'about.terms-of-use':             { stateName: 'tabsPay.about.terms-of-use',             viewNames: ['tab-more@tabsPay'] },
      'activity':                       { stateName: 'tabsPay.activity',                       viewNames: ['tab-dashboard@tabsPay'] },
      'add':                            { stateName: 'tabsPay.add',                            viewNames: ['tab-wallets@tabsPay'] },
      'add.create-personal':            { stateName: 'tabsPay.add.create-personal',            viewNames: ['tab-wallets@tabsPay'] },
      'add.create-shared':              { stateName: 'tabsPay.add.create-shared',              viewNames: ['tab-wallets@tabsPay'] },
      'add.import':                     { stateName: 'tabsPay.add.import',                     viewNames: ['tab-wallets@tabsPay'] },
      'add.join':                       { stateName: 'tabsPay.add.join',                       viewNames: ['tab-wallets@tabsPay'] },
      'address-book':                   { stateName: 'tabsPay.address-book',                   viewNames: ['tab-more@tabsPay'] },
      'address-book.add':               { stateName: 'tabsPay.address-book.add',               viewNames: ['tab-more@tabsPay'] },
      'address-book.edit':              { stateName: 'tabsPay.address-book.edit',              viewNames: ['tab-more@tabsPay'] },
      'address-book.entry':             { stateName: 'tabsPay.address-book.entry',             viewNames: ['tab-more@tabsPay'] },
      'advanced':                       { stateName: 'tabsPay.advanced',                       viewNames: ['tab-more@tabsPay'] },
      'advanced.experiments':           { stateName: 'tabsPay.advanced-experiments',           viewNames: ['tab-more@tabsPay'] },
      'all-wallets':                    { stateName: 'tabsPay.all-wallets',                    viewNames: ['tab-wallets@tabsPay'] },
      'alternative-currency':           { stateName: 'tabsPay.alternative-currency',           viewNames: ['tab-more@tabsPay'] },
      'app-lock':                       { stateName: 'tabsPay.app-lock',                       viewNames: ['tab-more@tabsPay'] },
      'apps':                           { stateName: 'tabsPay.apps',                           viewNames: ['tab-apps'] },
      'copayers':                       { stateName: 'tabsPay.copayers',                       viewNames: ['tab-dashboard'] },
      'dashboard':                      { stateName: 'tabsPay.dashboard',                      viewNames: ['tab-dashboard'] },
      'fee':                            { stateName: 'tabsPay.fee',                            viewNames: ['tab-more@tabsPay'] },
      'feedback':                       { stateName: 'tabsPay.feedback',                       viewNames: ['tab-more@tabsPay'] },
      'help':                           { stateName: 'tabsPay.help',                           viewNames: ['tab-more@tabsPay'] },
      'help.tour':                      { stateName: 'tabsPay.help.tour',                      viewNames: ['tab-more@tabsPay'] },
      //'home':                           { stateName: 'tabsPay.home',                           viewNames: ['tab-wallets'] },
      'language':                       { stateName: 'tabsPay.language',                       viewNames: ['tab-more@tabsPay'] },
      'more':                           { stateName: 'tabsPay.more',                           viewNames: ['tab-more'] },
      'network-settings':               { stateName: 'tabsPay.network-settings',               viewNames: ['tab-more@tabsPay'] },
      'networks':                       { stateName: 'tabsPay.networks',                       viewNames: ['tab-more@tabsPay'] },
      'notifications':                  { stateName: 'tabsPay.notifications',                  viewNames: ['tab-more@tabsPay'] },
      'onboarding':                     { stateName: 'onboarding',                             viewNames: null }, // Abstract state
      'onboarding.backup':              { stateName: 'onboarding.backup',                      viewNames: ['onboarding'] },
      'onboarding.backup-request':      { stateName: 'onboarding.backup-request',              viewNames: ['onboarding'] },
      'onboarding.backup-warning':      { stateName: 'onboarding.backup-warning',              viewNames: ['onboarding'] },
      'onboarding.collect-email':       { stateName: 'onboarding.collect-email',               viewNames: ['onboarding'] },
      'onboarding.create-first-wallet': { stateName: 'onboarding.create-first-wallet',         viewNames: ['onboarding'] },
      'onboarding.disclaimer':          { stateName: 'onboarding.disclaimer',                  viewNames: ['onboarding'] },
      'onboarding.import':              { stateName: 'onboarding.import',                      viewNames: ['onboarding'] },
      'onboarding.start':               { stateName: 'onboarding.start',                       viewNames: ['onboarding'] },
      'onboarding.tour':                { stateName: 'onboarding.tour',                        viewNames: ['onboarding'] },
      'pay':                            { stateName: 'tabsPay.pay',                            viewNames: ['tab-pay@tabsPay'] },
      'payment-request':                { stateName: 'tabsPay.payment-request',                viewNames: null }, // Abstract state
      'payment-request.amount':         { stateName: 'tabsPay.payment-request.amount',         viewNames: ['tab-wallets@tabsPay'] },
      'passcode':                       { stateName: 'tabsPay.passcode',                       viewNames: ['tab-more@tabsPay'] },
      'pattern':                        { stateName: 'tabsPay.pattern',                        viewNames: ['tab-more@tabsPay'] },
      'plugins':                        { stateName: 'tabsPay.plugins',                        viewNames: ['tab-more@tabsPay'] },
      'plugins.plugin':                 { stateName: 'tabsPay.plugins-plugin',                 viewNames: ['tab-more@tabsPay'] },
      'plugins.plugin-details':         { stateName: 'tabsPay.plugins-plugin-details',         viewNames: ['tab-more@tabsPay'] },
      'plugins.plugin-others':          { stateName: 'tabsPay.plugins-plugin-others',          viewNames: ['tab-more@tabsPay'] },
      'preferences':                    { stateName: 'tabsPay.preferences',                    viewNames: ['tab-more@tabsPay'] },
      'preferences.advanced':           { stateName: 'tabsPay.preferences.advanced',           viewNames: ['tab-more@tabsPay'] },
      'preferences.alias':              { stateName: 'tabsPay.preferences.alias',              viewNames: ['tab-more@tabsPay'] },
      'preferences.backup':             { stateName: 'tabsPay.preferences.backup',             viewNames: ['tab-more@tabsPay'] },
      'preferences.backup-warning':     { stateName: 'tabsPay.preferences.backup-warning',     viewNames: ['tab-more@tabsPay'] },
      'preferences.color':              { stateName: 'tabsPay.preferences.color',              viewNames: ['tab-more@tabsPay'] },
      'preferences.delete':             { stateName: 'tabsPay.preferences.delete',             viewNames: ['tab-more@tabsPay'] },
      'preferences.export':             { stateName: 'tabsPay.preferences.export',             viewNames: ['tab-more@tabsPay'] },
      'preferences.external':           { stateName: 'tabsPay.preferences.external',           viewNames: ['tab-more@tabsPay'] },
      'preferences.history':            { stateName: 'tabsPay.preferences.history',            viewNames: ['tab-more@tabsPay'] },
      'preferences.information':        { stateName: 'tabsPay.preferences.information',        viewNames: ['tab-more@tabsPay'] },
      'preferences.wallet-service':     { stateName: 'tabsPay.preferences.wallet-service',     viewNames: ['tab-more@tabsPay'] },
      'proposals':                      { stateName: 'tabsPay.proposals',                      viewNames: ['tab-dashboard@tabsPay'] },
      'rate':                           { stateName: 'tabsPay.rate',                           viewNames: null }, // Abstract state
      'rate.complete':                  { stateName: 'tabsPay.rate.complete',                  viewNames: ['tab-dashboard@tabsPay'] },
      'rate.rate-app':                  { stateName: 'tabsPay.rate.rate-app',                  viewNames: ['tab-dashboard@tabsPay'] },
      'rate.send':                      { stateName: 'tabsPay.rate.send',                      viewNames: ['tab-dashboard@tabsPay'] },
      'receive':                        { stateName: 'tabsPay.receive',                        viewNames: ['tab-wallets@tabsPay'] },
      'receive.backup':                 { stateName: 'tabsPay.receive.backup',                 viewNames: ['tab-wallets@tabsPay'] },
      'receive.backup-warning':         { stateName: 'tabsPay.receive.backup-warning',         viewNames: ['tab-wallets@tabsPay'] },
      'scan':                           { stateName: 'tabsPay.scan',                           viewNames: ['tab-dashboard@tabsPay'] },
      'scanner':                        { stateName: 'scanner',                                viewNames: null },
      'send':                           { stateName: 'tabsPay.send',                           viewNames: ['tab-wallets@tabsPay'] },
      'send.address-book':              { stateName: 'tabsPay.send.address-book',              viewNames: ['tab-wallets@tabsPay'] },
      'send.amount':                    { stateName: 'tabsPay.send.amount',                    viewNames: ['tab-wallets@tabsPay'] },
      'send.confirm':                   { stateName: 'tabsPay.send.confirm',                   viewNames: ['tab-wallets@tabsPay'] },
      'settings':                       { stateName: 'tabsPay.settings',                       viewNames: ['tab-more'] },
      'settings.addresses':             { stateName: 'tabsPay.settings.addresses',             viewNames: ['tab-more@tabsPay'] },
      'settings.all-addresses':         { stateName: 'tabsPay.settings.all-addresses',         viewNames: ['tab-more@tabsPay'] },
      'share-app':                      { stateName: 'tabsPay.share-app',                      viewNames: ['tab-more@tabsPay'] },
      'starting':                       { stateName: 'starting',                               viewNames: null }, // Body
      'unit':                           { stateName: 'tabsPay.unit',                           viewNames: ['tab-more@tabsPay'] },
      'unsupported':                    { stateName: 'unsupported',                            viewNames: null }, // Body
      'uri':                            { stateName: 'uri',                                    viewNames: ['tab-dashboard'] },
      'wallet':                         { stateName: 'tabsPay.wallet',                         viewNames: ['tab-wallets@tabsPay'] },
      'wallet.addresses':               { stateName: 'tabsPay.wallet.addresses',               viewNames: ['tab-wallets@tabsPay'] },
      'wallet.all-addresses':           { stateName: 'tabsPay.wallet.all-addresses',           viewNames: ['tab-wallets@tabsPay'] },
      'wallet.backup':                  { stateName: 'tabsPay.wallet.backup',                  viewNames: ['tab-wallets@tabsPay'] },
      'wallet.backup-warning':          { stateName: 'tabsPay.wallet.backup-warning',          viewNames: ['tab-wallets@tabsPay'] },
      'wallet.paper-wallet':            { stateName: 'tabsPay.wallets.paper-wallet',           viewNames: ['tab-wallets@tabsPay'] },
      'wallet.tx-details':              { stateName: 'tabsPay.wallet.tx-details',              viewNames: ['tab-wallets@tabsPay'] },
      'wallets':                        { stateName: 'tabsPay.wallets',                        viewNames: ['tab-wallets'] }
    }
  };  

  return root;

});
