#!/usr/bin/env node

'use strict';

//

var templates = {
  'package-template.json': '/',
  'index.html': 'www/',
  'config-template.xml': '/',
  'ionic.config.json': '/',
  '.desktop': 'webkitbuilds/',
  'setup-win.iss': 'webkitbuilds/',
  'build-macos.sh': 'webkitbuilds/',
  'manifest.json': 'chrome-app/',
  //  'bower.json': '/',
};
var configDir = process.argv[2] || 'owl';
var JSONheader = ' { ' + "\n" + '  "//":"Changes to this file will be overwritten",' + "\n" + '  "//":"        Modify it in the app-template directory", ' + "\n";

var MakefileHeader = "# PLEASE! Do not edit this file directly \n#       Modify it at app-template/\n";

var fs = require('fs-extra');
var path = require('path');

var configBlob = fs.readFileSync(configDir + '/appConfig.json', 'utf8');
var config = JSON.parse(configBlob, 'utf8');

/////////////////
console.log('Applying ' + config.nameCase + ' template');

Object.keys(templates).forEach(function(k) {
  var targetDir = templates[k];
  console.log(' #    ' + k + ' => ' + targetDir);

  var content = fs.readFileSync(k, 'utf8');


  if (k.indexOf('.json') > 0) {
    content = content.replace('{', JSONheader);

  } else if (k.indexOf('Makefile') >= 0) {
    content = MakefileHeader + content;
  }


  Object.keys(config).forEach(function(k) {
    if (k.indexOf('_') == 0) return;

    var r = new RegExp("\\*" + k.toUpperCase() + "\\*", "g");
    content = content.replace(r, config[k]);
  });

  var r = new RegExp("\\*[A-Z]{3,30}\\*", "g");
  var s = content.match(r);
  if (s) {
    console.log('UNKNOWN VARIABLE', s);
    process.exit(1);
  }

  if (k === 'config-template.xml') {
    k = 'config.xml';
  } else if (k === 'package-template.json') {
    k = 'package.json';
  }

  if (!fs.existsSync('../' + targetDir)) {
    fs.mkdirSync('../' + targetDir);
  }
  fs.writeFileSync('../' + targetDir + k, content, 'utf8');
});

/////////////////
console.log('Copying ' + configDir + '/appConfig.json' + ' to root');
configBlob = configBlob.replace('{', JSONheader);
fs.writeFileSync('../appConfig.json', configBlob, 'utf8');

////////////////
var externalServices;
try {
  var confName = configDir.toUpperCase();
  var externalServicesConf = confName + '_EXTERNAL_SERVICES_CONFIG_LOCATION';
  console.log('Looking for ' + externalServicesConf + '...');
  if (typeof process.env[externalServicesConf] !== 'undefined') {
    var location = process.env[externalServicesConf]
    if (location.charAt(0) === '~') {
      location = location.replace(/^\~/, process.env.HOME || process.env.USERPROFILE);
    }
    console.log('Found at: ' + location);
    console.log('Copying ' + location + ' to root');
    externalServices = fs.readFileSync(location, 'utf8');
  } else {
    throw externalServicesConf + ' environment variable not set.';
  }
} catch (err) {
  console.log(err);
  externalServices = '{}';
  console.log('External services not configured');
}
fs.writeFileSync('../externalServices.json', externalServices, 'utf8');

function copyDir(from, to) {
  console.log('Copying dir ' + from + ' to ' + to);
  if (fs.existsSync(to)) fs.removeSync(to); // remove previous app directory
  if (!fs.existsSync(from)) return; // nothing to do
  fs.copySync(from, to);
}

// Push Notification
fs.copySync(configDir + '/GoogleService-Info.plist', '../GoogleService-Info.plist');
fs.copySync(configDir + '/google-services.json', '../google-services.json');

copyDir(configDir + '/img', '../www/img/app');
copyDir(configDir + '/sass', '../src/sass/app');
console.log("apply.js finished. \n\n");
