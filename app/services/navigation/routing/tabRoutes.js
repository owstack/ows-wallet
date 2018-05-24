'use strict';

angular.module('owsWalletApp.services').factory('tabRoutes', function(lodash) {
  var root = {};

  root.init = function(stateProvider) {
    stateProvider.state('tabs', {
      url: '/tabs',
      abstract: true,
      controller: 'TabsCtrl',
      templateUrl: 'views/navigation/tabs/tabs.html'
    });
  };

  root.sref = function(id) {
    return map[id].stateName;
  };

  root.stateId = function(stateName) {
    return lodash.findKey(map, function(entry) {
      return entry.stateName == stateName;
    });
  };

  root.vref = function(id, index) {
    index = index || 0;
    return map[id].viewNames[index];
  };

  var map = {
    'about':                          { stateName: 'tabs.about',                          viewNames: ['tab-settings@tabs'] },
    'about.log':                      { stateName: 'tabs.about.log',                      viewNames: ['tab-settings@tabs'] },
    'about.terms-of-use':             { stateName: 'tabs.about.terms-of-use',             viewNames: ['tab-settings@tabs'] },
    'activity':                       { stateName: 'tabs.activity',                       viewNames: ['tab-home@tabs'] },
    'add':                            { stateName: 'tabs.add',                            viewNames: ['tab-home@tabs'] },
    'add.create-personal':            { stateName: 'tabs.add.create-personal',            viewNames: ['tab-home@tabs'] },
    'add.create-shared':              { stateName: 'tabs.add.create-shared',              viewNames: ['tab-home@tabs'] },
    'add.import':                     { stateName: 'tabs.add.import',                     viewNames: ['tab-home@tabs'] },
    'add.join':                       { stateName: 'tabs.add.join',                       viewNames: ['tab-home@tabs'] },
    'address-book':                   { stateName: 'tabs.address-book',                   viewNames: ['tab-settings@tabs'] },
    'address-book.add':               { stateName: 'tabs.address-book.add',               viewNames: ['tab-settings@tabs'] },
    'address-book.edit':              { stateName: 'tabs.address-book.edit',              viewNames: ['tab-settings@tabs'] },
    'address-book.entry':             { stateName: 'tabs.address-book.entry',             viewNames: ['tab-settings@tabs'] },
    'advanced':                       { stateName: 'tabs.advanced',                       viewNames: ['tab-settings@tabs'] },
    'advanced.experiments':           { stateName: 'tabs.advanced-experiments',           viewNames: ['tab-settings@tabs'] },
    'alternative-currency':           { stateName: 'tabs.alternative-currency',           viewNames: ['tab-settings@tabs'] },
    'app-lock':                       { stateName: 'tabs.app-lock',                       viewNames: ['tab-settings@tabs'] },
    'copayers':                       { stateName: 'tabs.copayers',                       viewNames: ['tab-home'] },
    'fee':                            { stateName: 'tabs.fee',                            viewNames: ['tab-settings@tabs'] },
    'feedback':                       { stateName: 'tabs.feedback',                       viewNames: ['tab-settings@tabs'] },
    'help':                           { stateName: 'help',                                viewNames: ['tab-settings@tabs'] },
    'help.tour':                      { stateName: 'help.tour',                           viewNames: ['tab-settings@tabs'] },
    'home':                           { stateName: 'tabs.home',                           viewNames: ['tab-home'] },
    'home.all-wallets':               { stateName: 'tabs.home.all-wallets',               viewNames: ['tab-home@tabs'] },
    'home.paper-wallet':              { stateName: 'tabs.home.paper-wallet',              viewNames: ['tab-home@tabs'] },
    'language':                       { stateName: 'tabs.language',                       viewNames: ['tab-settings@tabs'] },
    'network-settings':               { stateName: 'tabs.network-settings',               viewNames: ['tab-settings@tabs'] },
    'networks':                       { stateName: 'tabs.networks',                       viewNames: ['tab-settings@tabs'] },
    'notifications':                  { stateName: 'tabs.notifications',                  viewNames: ['tab-settings@tabs'] },
    'onboarding':                     { stateName: 'onboarding',                          viewNames: null }, // Abstract state
    'onboarding.backup':              { stateName: 'onboarding.backup',                   viewNames: ['onboarding'] },
    'onboarding.backup-request':      { stateName: 'onboarding.backup-request',           viewNames: ['onboarding'] },
    'onboarding.backup-warning':      { stateName: 'onboarding.backup-warning',           viewNames: ['onboarding'] },
    'onboarding.collect-email':       { stateName: 'onboarding.collect-email',            viewNames: ['onboarding'] },
    'onboarding.create-first-wallet': { stateName: 'onboarding.create-first-wallet',      viewNames: ['onboarding'] },
    'onboarding.disclaimer':          { stateName: 'onboarding.disclaimer',               viewNames: ['onboarding'] },
    'onboarding.import':              { stateName: 'onboarding.import',                   viewNames: ['onboarding'] },
    'onboarding.start':               { stateName: 'onboarding.start',                    viewNames: ['onboarding'] },
    'onboarding.tour':                { stateName: 'onboarding.tour',                     viewNames: ['onboarding'] },
    'payment-request':                { stateName: 'tabs.payment-request',                viewNames: null }, // Abstract state
    'payment-request.amount':         { stateName: 'tabs.payment-request.amount',         viewNames: ['tab-receive@tabs'] },
    'passcode':                       { stateName: 'tabs.passcode',                       viewNames: ['tab-settings@tabs'] },
    'pattern':                        { stateName: 'tabs.pattern',                        viewNames: ['tab-settings@tabs'] },
    'plugins':                        { stateName: 'tabs.plugins',                        viewNames: ['tab-settings@tabs'] },
    'plugins.plugin':                 { stateName: 'tabs.plugins-plugin',                 viewNames: ['tab-settings@tabs'] },
    'plugins.plugin-details':         { stateName: 'tabs.plugins-plugin-details',         viewNames: ['tab-settings@tabs'] },
    'preferences':                    { stateName: 'tabs.preferences',                    viewNames: ['tab-settings@tabs'] },
    'preferences.advanced':           { stateName: 'tabs.preferences.advanced',           viewNames: ['tab-settings@tabs'] },
    'preferences.alias':              { stateName: 'tabs.preferences.alias',              viewNames: ['tab-settings@tabs'] },
    'preferences.backup':             { stateName: 'tabs.preferences.backup',             viewNames: ['tab-settings@tabs'] },
    'preferences.backup-warning':     { stateName: 'tabs.preferences.backup-warning',     viewNames: ['tab-settings@tabs'] },
    'preferences.color':              { stateName: 'tabs.preferences.color',              viewNames: ['tab-settings@tabs'] },
    'preferences.delete':             { stateName: 'tabs.preferences.delete',             viewNames: ['tab-settings@tabs'] },
    'preferences.export':             { stateName: 'tabs.preferences.export',             viewNames: ['tab-settings@tabs'] },
    'preferences.external':           { stateName: 'tabs.preferences.external',           viewNames: ['tab-settings@tabs'] },
    'preferences.history':            { stateName: 'tabs.preferences.history',            viewNames: ['tab-settings@tabs'] },
    'preferences.information':        { stateName: 'tabs.preferences.information',        viewNames: ['tab-settings@tabs'] },
    'preferences.wallet-service-url': { stateName: 'tabs.preferences.wallet-service-url', viewNames: ['tab-settings@tabs'] },
    'proposals':                      { stateName: 'tabs.proposals',                      viewNames: ['tab-home@tabs'] },
    'rate':                           { stateName: 'tabs.rate',                           viewNames: null }, // Abstract state
    'rate.complete':                  { stateName: 'tabs.rate.complete',                  viewNames: ['tab-home@tabs'] },
    'rate.rate-app':                  { stateName: 'tabs.rate.rate-app',                  viewNames: ['tab-home@tabs'] },
    'rate.send':                      { stateName: 'tabs.rate.send',                      viewNames: ['tab-home@tabs'] },
    'receive':                        { stateName: 'tabs.receive',                        viewNames: ['tab-receive'] },
    'receive.backup':                 { stateName: 'tabs.receive.backup',                 viewNames: ['tab-receive@tabs'] },
    'receive.backup-warning':         { stateName: 'tabs.receive.backup-warning',         viewNames: ['tab-receive@tabs'] },
    'scan':                           { stateName: 'tabs.scan',                           viewNames: ['tab-scan@tabs'] },
    'scanner':                        { stateName: 'scanner',                             viewNames: null },
    'send':                           { stateName: 'tabs.send',                           viewNames: ['tab-send'] },
    'send.address-book':              { stateName: 'tabs.send.address-book',              viewNames: ['tab-send@tabs'] },
    'send.amount':                    { stateName: 'tabs.send.amount',                    viewNames: ['tab-send@tabs'] },
    'send.confirm':                   { stateName: 'tabs.send.confirm',                   viewNames: ['tab-send@tabs'] },
    'settings':                       { stateName: 'tabs.settings',                       viewNames: ['tab-settings'] },
    'settings.addresses':             { stateName: 'tabs.settings.addresses',             viewNames: ['tab-settings@tabs'] },
    'settings.all-addresses':         { stateName: 'tabs.settings.all-addresses',         viewNames: ['tab-settings@tabs'] },
    'share-app':                      { stateName: 'tabs.share-app',                      viewNames: ['tab-settings@tabs'] },
    'starting':                       { stateName: 'starting',                            viewNames: null }, // Body
    'unit':                           { stateName: 'tabs.unit',                           viewNames: ['tab-settings@tabs'] },
    'unsupported':                    { stateName: 'unsupported',                         viewNames: null }, // Body
    'uri':                            { stateName: 'uri',                                 viewNames: ['tab-home'] },
    'wallet':                         { stateName: 'tabs.wallet',                         viewNames: ['tab-home'] },
    'wallet.addresses':               { stateName: 'tabs.wallet.addresses',               viewNames: ['tab-home@tabs'] },
    'wallet.all-addresses':           { stateName: 'tabs.wallet.all-addresses',           viewNames: ['tab-home@tabs'] },
    'wallet.backup':                  { stateName: 'tabs.wallet.backup',                  viewNames: ['tab-home@tabs'] },
    'wallet.backup-warning':          { stateName: 'tabs.wallet.backup-warning',          viewNames: ['tab-home@tabs'] },
    'wallet.tx-details':              { stateName: 'tabs.wallet.tx-details',              viewNames: ['tab-home@tabs'] }
  };  

  return root;

});
