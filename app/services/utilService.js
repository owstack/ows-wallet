'use strict';

angular.module('owsWalletApp.services').factory('utilService', function(lodash) {
  var root = {};

  root.uuidv4 = function() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  // See https://github.com/JamesMGreene/lodash-pickDeep
	root.pick = function(obj) {
	  var keys = lodash.flatten(lodash.drop(lodash.toArray(arguments), 1));
	  var copy = {};
	  lodash.forEach(keys, function(key) {
	    if (lodash.has(obj, key)) {
	      var val = lodash.get(obj, key);
	      lodash.set(copy, key, val);
	    }
	  });
	  return copy;
	}

  return root;

});
