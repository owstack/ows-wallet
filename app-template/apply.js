#!/usr/bin/env node

'use strict';

var fs = require('fs-extra');
var path = require('path');

function copyDir(from, to) {
  console.log('Copying dir ' + from + ' to ' + to);

  if (!fs.existsSync(from)) {
    return;
  }
  if (fs.existsSync(to)) {
    fs.removeSync(to);
  }

  fs.copySync(from, to);
}

var templates = {
  'package-template.json': '/',
  'index-template.html': 'app/',
  'config-template.xml': '/',
  'ionic.config.json': '/',
  '.desktop': 'webkitbuilds/',
  'setup-win.iss': 'webkitbuilds/',
  'build-macos.sh': 'webkitbuilds/'
};

var configDir = process.argv[2];
if (!fs.existsSync(configDir)) {
  console.log('No distribution found for: ' + configDir + '. Use \'npm run set-dist <app-template>\' to set a distribution.');
  process.exit(1);
}

var JSONheader = '{ ' + "\n" + '  "//": "Changes to this file will be overwritten, modify it at app-template/ only.",';
var HTTPheader = '<!-- Changes to this file will be overwritten, modify it at app-template/ only. -->\n<';

var configBlob = fs.readFileSync(configDir + '/app.config.json', 'utf8');
var config = JSON.parse(configBlob, 'utf8');

console.log('Applying ' + config.nameCase + ' template');

// Generate image resources from sketch
console.log('Creating resources for ' + config.nameCase);
var execSync = require('child_process').execSync;
execSync('sh ./generate.sh ' + configDir, { cwd: '../util/resources', stdio: [0,1,2] });
console.log('Done creating resources');

// Replace key-value strings in template files and add installable plugins to package.json
console.log('Configuring application...');
Object.keys(templates).forEach(function(k) {
  var targetDir = templates[k];
  console.log(' #    ' + k + ' => ' + targetDir);

  var content = fs.readFileSync(k, 'utf8');

  if (k.indexOf('.json') > 0) {
    content = content.replace('{', JSONheader);
  }
  if (k.indexOf('.html') > 0) {
    content = content.replace('<', HTTPheader);
  }

  // Replace placeholders in template file with values from config.
  Object.keys(config).forEach(function(k) {
    if (k.indexOf('_') == 0) {
      return;
    }

    var r = new RegExp("\\*" + k.toUpperCase() + "\\*", "g");
    content = content.replace(r, config[k]);
  });

  var r = new RegExp("\\*[A-Z]{3,30}\\*", "g");
  var s = content.match(r);
  if (s) {
    console.log('UNKNOWN VARIABLE', s);
    process.exit(1);
  }

  // Remove any template designation from file name
  k = k.replace('-template', '');
  if (k === 'package.json') {

    // Add configured plugins to package.json dependencies
    console.log(' #      Plugins to install:');
    if (Object.keys(config.plugins).length > 0) {
      content = JSON.parse(content);
      Object.keys(config.plugins).forEach(function(p) {
        if (!p.includes('builtin')) { // Don't add builtin plugins to package dependencies
          content.dependencies[p] = config.plugins[p];
          console.log(' #        ' + p + ' ' + config.plugins[p]);
        }
      });

      // Sort dependencies (for convenience)
      var orderedDependencies = {};
      Object.keys(content.dependencies).sort().forEach(function(key) {
        orderedDependencies[key] = content.dependencies[key];
      });
      content.dependencies = orderedDependencies;
      
      content = JSON.stringify(content, null, 2);

    } else {
      console.log(' #        None configured');
    }
  }

  if (!fs.existsSync('../' + targetDir)) {
    fs.mkdirSync('../' + targetDir);
  }
  fs.writeFileSync('../' + targetDir + k, content, 'utf8');
});
console.log('Done configuring application');

// Write app configuration file
console.log('Copying ' + configDir + '/app.config.json' + ' to root');
configBlob = configBlob.replace('{', JSONheader);
fs.writeFileSync('../app.config.json', configBlob, 'utf8');

// Push Notification
console.log('Configuring Google service info');
fs.copySync(configDir + '/GoogleService-Info.plist', '../GoogleService-Info.plist');
fs.copySync(configDir + '/google-services.json', '../google-services.json');

// Create www directory
if (!fs.existsSync('../www')) {
  fs.mkdirSync('../www');
}

// Move assets
copyDir('../resources/' + configDir + '/img', '../app/assets/img');
copyDir(configDir + '/sass', '../app/shared/sass/overrides');
copyDir(configDir + '/content', '../app/content');
copyDir(configDir + '/fonts', '../app/assets/fonts');
copyDir(configDir + '/builtin-plugins', '../app/builtin-plugins');
copyDir(configDir + '/theme-catalog', '../app/theme-catalog');

// Done
console.log("apply.js finished. \n\n");
