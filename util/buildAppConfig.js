#!/usr/bin/env node

'use strict';

var path = require('path');
var appConfigBuilder = require(path.resolve(__dirname, './appConfigBuilder'));
var pluginCatalogBuilder = require(path.resolve(__dirname, './pluginCatalogBuilder'));
var themeCatalogBuilder = require(path.resolve(__dirname, './themeCatalogBuilder'));

var appConfig = appConfigBuilder.build();
pluginCatalogBuilder.build(appConfig);
themeCatalogBuilder.build(appConfig);
