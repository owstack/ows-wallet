'use strict';

angular.module('owsWalletApp.pluginServices').factory('jsonValidatorService', function($log, lodash, djv) {
  var root = {};

  var validator = djv.get();
  var schemas = [];

  root.validate = function(obj, jsonSchema) {
  	if (lodash.indexOf(schemas, jsonSchema.title) < 0) {
			validator.addSchema(jsonSchema.title, jsonSchema);
			schemas.push(jsonSchema.title);  		
  	}

		var result = validator.validate(jsonSchema.title, obj);
		return result;
  };

  root.clean = function() {
  	for (var i=0; i < schemas.length; i++) {
  		validator.removeSchema(schemas[i]);
  	}
    schemas = [];
  };

  return root;
});
