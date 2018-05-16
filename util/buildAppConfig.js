#!/usr/bin/env node

'use strict';

var path = require('path');
var appConfigBuilder = require(path.resolve(__dirname, './appConfigBuilder'));
var pluginCatalogBuilder = require(path.resolve(__dirname, './pluginCatalogBuilder'));
var themeCatalogBuilder = require(path.resolve(__dirname, './themeCatalogBuilder'));

var mode = process.argv[2];

var appConfig = appConfigBuilder.build(mode);
pluginCatalogBuilder.build(appConfig, mode);
themeCatalogBuilder.build(appConfig, mode);
