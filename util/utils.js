'use strict';

var fs = require('fs-extra');
var p = require('path');
var shell = require('shelljs');

var readJSON = function(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
};

var cleanJSONQuotesOnKeys = function(json) {
  return json.replace(/"(\w+)"\s*:/g, '$1:');
};

var getAllFoldersFromFolder = function(dir) {
  var results = [];
  var path;
  fs.readdirSync(dir).forEach(function(item) {
    path = dir + '/' + item;
    var stat = fs.statSync(path);
    if (stat && stat.isDirectory()) {
      results.push(item);
    }
  });
  return results;
};

var getAllFilesByExpr = function(matchExpr, path) {
  var list = [];
  var stats;
  fs.readdirSync(path).forEach(function (file) {
    stats = fs.lstatSync(p.join(path, file));
    if(stats.isDirectory()) {
      list = list.concat(getAllFilesByExpr(matchExpr, p.join(path, file)));
    } else {
      if (file.match(matchExpr)) {
        list.push(p.join(path, file));
      }
    }
  });
  return list;
};

var removeFilesByTypeRecursive = function(rootDir, type) {
  var cmd = 'find ' + rootDir + ' -name \\\*.' + type + ' -type f -delete';
  shell.exec(cmd);
};

module.exports = {
  readJSON: readJSON,
  cleanJSONQuotesOnKeys: cleanJSONQuotesOnKeys,
  getAllFoldersFromFolder: getAllFoldersFromFolder,
  getAllFilesByExpr: getAllFilesByExpr,
  removeFilesByTypeRecursive: removeFilesByTypeRecursive
};
