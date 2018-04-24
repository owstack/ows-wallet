(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
var djvModule = angular.module('djvModule', []);
var djv = require('../node_modules/djv');

djvModule.constant('MODULE_VERSION', '1.0.0');

djvModule.provider("djv", function() {
  var provider = {};

  provider.$get = function() {
    var service = {};

    service.get = function() {
      return new djv();
    };
    return service;
  };

  return provider;
});

},{"../node_modules/djv":2}],2:[function(require,module,exports){
const { head } = require('./utils/uri');
const { restore } = require('./utils/template');
const formats = require('./utils/formats');
const { generate, State } = require('./utils/state');
const { add, use } = require('./utils/environment.js');

/**
 * Configuration for template
 * @typedef {object} DjvConfig
 * @property {string?} version - defines which version of json-schema draft to use,
 * draft-04 by default
 * @property {function?} versionConfigure - handler to apply for environment version
 * @property {boolean?} inner - a generating object should be considered as inner
 * Default value is false/undefined.
 * If true, then it avoid creating variables in a generated function body,
 * however without proper wrapper function approach will not work.
 * @see template/body, template/body
 * @property {object?} formats - an object containing list of formatters to add for environment
 * @property {function?} errorHandler - a handler to use for generating custom error messages
 */

/**
 * @name Environment
 * @description
 * Key constructor used for creating enivornment instance
 * @type {function} constructor
 * @param {DjvConfig} options passed to templater and utilities
 *
 * Usage
 *
 * ```javascript
 * const env = djv();
 * const env = new djv();
 * const env = new djv({ errorHandler: () => ';' });
 * ```
 */
function Environment(options = {}) {
  if (!(this instanceof Environment)) { return new Environment(options); }

  this.options = options;
  this.resolved = {};
  this.state = new State(null, this);

  this.useVersion(options.version, options.versionConfigure);
  this.addFormat(options.formats);
}

Environment.prototype = {
  /**
   * check if object correspond to schema
   *
   * Usage
   *
   * ```javascript
   * env.validate('test#/common', { type: 'common' });
   * // => undefined
   *
   * env.validate('test#/common', { type: 'custom' });
   * // => 'required: data'
   *
   * @param {string} name
   * @param {object} object
   * @returns {string} error - undefined if it is valid
   */
  validate(name, object) {
    return this.resolve(name).fn(object);
  },

  /**
   * add schema to djv environment
   *
   * Usage
   *
   * ```javascript
   * env.addSchema('test', jsonSchema);
   * ```
   *
   * @param {string?} name
   * @param {object} schema
   * @param {object} schema
   * @returns {resolved}
   */
  addSchema(name, schema) {
    const realSchema = typeof name === 'object' ? name : schema;
    const resolved = {
      schema: realSchema,
      fn: generate(this, realSchema, undefined, this.options),
    };

    [name, schema.id]
      .filter(id => typeof id === 'string')
      .map(head)
      .forEach((id) => {
        this.resolved[id] = Object.assign({ name: id }, resolved);
      });

    return resolved;
  },

  /**
   * removes a schema or the whole structure from djv environment
   *
   * Usage
   *
   * ```javascript
   * env.removeSchema('test');
   * ```
   *
   * @param {string} name
   */
  removeSchema(name) {
    if (name) {
      delete this.resolved[name];
    } else {
      this.resolved = {};
    }
  },

  /**
   * resolves name by existing environment
   *
   * Usage
   *
   * ```javascript
   * env.resolve('test');
   * // => { name: 'test', schema: {} }, fn: ... }
   * ```
   *
   * @param {string} name
   * @returns {resolved}
   */
  resolve(name) {
    if (typeof name === 'object' || !this.resolved[name]) {
      return this.addSchema(
        name,
        this.state.resolve(name)
      );
    }

    return this.resolved[name];
  },

  /**
   * exports the whole structure object from environment or by resolved name
   *
   * Usage
   *
   * ```javascript
   * env.export();
   * // => { test: { name: 'test', schema: {}, ... } }
   * ```
   *
   * @param {string} name
   * @returns {serializedInternalState}
   */
  export(name) {
    let resolved;
    if (name) {
      resolved = this.resolve(name);
      resolved = {
        name,
        schema: resolved.schema,
        fn: resolved.fn.toString()
      };
    } else {
      resolved = {};
      Object.keys(this.resolved).forEach((key) => {
        resolved[key] = {
          name: key,
          schema: this.resolved[key].schema,
          fn: this.resolved[key].fn.toString()
        };
      });
    }

    return JSON.stringify(resolved);
  },

  /**
   * imports all found structure objects to internal environment structure
   * Usage
   *
   * ```javascript
   * env.import(config);
   * ```
   *
   * @param {object} config - internal structure or only resolved schema object
   */
  import(config) {
    const item = JSON.parse(config);
    let restoreData = item;
    if (item.name && item.fn && item.schema) {
      restoreData = { [item.name]: item };
    }

    Object.keys(restoreData).forEach((key) => {
      const { name, schema, fn: source } = restoreData[key];
      const fn = restore(source, schema, this.options);
      this.resolved[name] = { name, schema, fn };
    });
  },

  /**
   * @name addFormat
   * @type function
   * @description
   * Add formatter to djv environment.
   * When a string is passed it is interpreted as an expression which
   * when returns `true` goes with an error, when returns `false` then a property is valid.
   * When a function is passed it will be executed during schema compilation
   * with a current schema and template helper arguments.
   * @see utils/formats
   *
   * Usage
   *
   * ```javascript
   * env.addFormat('UpperCase', '%s !== %s.toUpperCase()');
   * // or
   * env.addFormat('isOk', function(schema, tpl){
   *   return `!${schema.isOk} || %s !== %s.toUpperCase()`;
   * });
   * ```
   *
   * @param {string/object?} name
   * @param {string/function} formatter
   */
  addFormat(name, formatter) {
    if (typeof name === 'string') {
      formats[name] = formatter;
      return;
    }

    if (typeof name === 'object') {
      Object.assign(formats, name);
    }
  },

  /**
   * @name setErrorHandler
   * @type function
   * @description
   * Specify custom error handler which will be used in generated functions when problem found.
   * The function should return a string expression, which will be executed when generated
   * validator function is executed. The simpliest use case is the default one
   * @see template/defaultErrorHandler
   * ```javascript
   *  function defaultErrorHandler(errorType) {
   *    return `return "${errorType}: ${tpl.data}";`;
   *  }
   * ```
   * It returns an expression 'return ...', so the output is an error string.
   * Usage
   * ```javascript
   * djv({ errorHandler: () => 'return { error: true };' }) // => returns an object
   * djv({
   *  errorHandler: function customErrorHandler(errorType, property) {
   *    return `errors.push({
   *      type: '${type}',
   *      schema: '${this.schema[this.schema.length - 1]}',
   *      data: '${this.data[this.data.length - 1]}'
   *    });
   *  }
   * })`;
   * ```
   * When a custom error handler is used, the template body function adds a `error` variable inside
   * a generated validator, which can be used to put error information. `errorType` is always
   * passed to error handler function. Some validate utilities put extra argument, like f.e.
   * currently processed property value. Inside the handler context is a templater instance,
   * which contains `this.schema`, `this.data` paths arrays to identify validator position.
   * @see test/index/setErrorHandler for more examples
   * @param {function} errorHandler - a function called each time compiler creates an error branch
   * @returns void
   */
  setErrorHandler(errorHandler) {
    Object.assign(this.options, { errorHandler });
  },
  /**
  * @name useVersion
  * @type {function}
  * @description
  * Add a specification version for environment
  * A configure function is called with exposed environments, like keys, formats, etc.
  * Updates internals utilities and configurations to fix versions implementation conflicts
  * @param {string} version of json-schema specification to use
  * @param {function} configure
  * @returns void
  */
  useVersion(version, configure) {
    if (typeof configure !== 'function' && version === 'draft-04') {
      /* eslint-disable no-param-reassign, global-require, import/no-extraneous-dependencies */
      configure = require('@korzio/djv-draft-04');
      /* eslint-enable no-param-reassign, global-require, import/no-extraneous-dependencies */
    }
    if (typeof configure === 'function') {
      add(version, configure);
    }
    use(version);
  },
};

module.exports = Environment;

},{"./utils/environment.js":3,"./utils/formats":4,"./utils/state":9,"./utils/template":10,"./utils/uri":12,"@korzio/djv-draft-04":30}],3:[function(require,module,exports){
/**
 * @module environment
 * @description
 * Update the given environment
 */
const exposedProperties = require('./properties');
const exposedKeywords = require('./keywords');
const exposedValidators = require('../validators');
const exposedFormats = require('./formats');
const { keys: exposedKeys } = require('./uri');
const { transformation: exposedTransformation } = require('./schema');

const exposed = {
  properties: exposedProperties,
  keywords: exposedKeywords,
  validators: exposedValidators,
  formats: exposedFormats,
  keys: exposedKeys,
  transformation: exposedTransformation,
};

const environmentConfig = {};

function add(version, config) {
  environmentConfig[version] = config;
}

function use(version) {
  if (!version || !environmentConfig[version]) {
    return;
  }

  const patchEnvironment = environmentConfig[version];
  patchEnvironment(exposed);
}

module.exports = {
  add,
  use,
};

},{"../validators":20,"./formats":4,"./keywords":6,"./properties":7,"./schema":8,"./uri":12}],4:[function(require,module,exports){
/**
 * @module formats
 * @description
 * Validators as string for format keyword rules.
 * A validator is a string, which when executed returns `false` if test is failed, `true` otherwise.
 */
module.exports = {
  alpha: '!/^[a-zA-Z]+$/.test(%s)',
  alphanumeric: '!/^[a-zA-Z0-9]+$/.test(%s)',
  identifier: '!/^[-_a-zA-Z0-9]+$/.test(%s)',
  hexadecimal: '!/^[a-fA-F0-9]+$/.test(%s)',
  numeric: '!/^[0-9]+$/.test(%s)',
  'date-time': 'isNaN(Date.parse(%s)) || ~%s.indexOf(\'/\')',
  uppercase: '%s !== %s.toUpperCase()',
  lowercase: '%s !== %s.toLowerCase()',
  hostname: '%s.length >= 256 || !/^([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\\-]{0,61}[a-zA-Z0-9])(\\.([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\\-]{0,61}[a-zA-Z0-9]))*$/.test(%s)',
  uri: '!/^[A-Za-z][A-Za-z0-9+\\-.]*:(?:\\/\\/(?:(?:[A-Za-z0-9\\-._~!$&\'()*+,;=:]|%[0-9A-Fa-f]{2})*@)?(?:\\[(?:(?:(?:(?:[0-9A-Fa-f]{1,4}:){6}|::(?:[0-9A-Fa-f]{1,4}:){5}|(?:[0-9A-Fa-f]{1,4})?::(?:[0-9A-Fa-f]{1,4}:){4}|(?:(?:[0-9A-Fa-f]{1,4}:){0,1}[0-9A-Fa-f]{1,4})?::(?:[0-9A-Fa-f]{1,4}:){3}|(?:(?:[0-9A-Fa-f]{1,4}:){0,2}[0-9A-Fa-f]{1,4})?::(?:[0-9A-Fa-f]{1,4}:){2}|(?:(?:[0-9A-Fa-f]{1,4}:){0,3}[0-9A-Fa-f]{1,4})?::[0-9A-Fa-f]{1,4}:|(?:(?:[0-9A-Fa-f]{1,4}:){0,4}[0-9A-Fa-f]{1,4})?::)(?:[0-9A-Fa-f]{1,4}:[0-9A-Fa-f]{1,4}|(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))|(?:(?:[0-9A-Fa-f]{1,4}:){0,5}[0-9A-Fa-f]{1,4})?::[0-9A-Fa-f]{1,4}|(?:(?:[0-9A-Fa-f]{1,4}:){0,6}[0-9A-Fa-f]{1,4})?::)|[Vv][0-9A-Fa-f]+\\.[A-Za-z0-9\\-._~!$&\'()*+,;=:]+)\\]|(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)|(?:[A-Za-z0-9\\-._~!$&\'()*+,;=]|%[0-9A-Fa-f]{2})*)(?::[0-9]*)?(?:\\/(?:[A-Za-z0-9\\-._~!$&\'()*+,;=:@]|%[0-9A-Fa-f]{2})*)*|\\/(?:(?:[A-Za-z0-9\\-._~!$&\'()*+,;=:@]|%[0-9A-Fa-f]{2})+(?:\\/(?:[A-Za-z0-9\\-._~!$&\'()*+,;=:@]|%[0-9A-Fa-f]{2})*)*)?|(?:[A-Za-z0-9\\-._~!$&\'()*+,;=:@]|%[0-9A-Fa-f]{2})+(?:\\/(?:[A-Za-z0-9\\-._~!$&\'()*+,;=:@]|%[0-9A-Fa-f]{2})*)*|)(?:\\?(?:[A-Za-z0-9\\-._~!$&\'()*+,;=:@\\/?]|%[0-9A-Fa-f]{2})*)?(?:\\#(?:[A-Za-z0-9\\-._~!$&\'()*+,;=:@\\/?]|%[0-9A-Fa-f]{2})*)?$/.test(%s)',
  email: '!/^[^@]+@[^@]+\\.[^@]+$/.test(%s)',
  ipv4: '!/^(\\d?\\d?\\d){0,255}\\.(\\d?\\d?\\d){0,255}\\.(\\d?\\d?\\d){0,255}\\.(\\d?\\d?\\d){0,255}$/.test($1) || $1.split(".")[3] > 255',
  ipv6: '!/^((?=.*::)(?!.*::.+::)(::)?([\\dA-F]{1,4}:(:|\\b)|){5}|([\\dA-F]{1,4}:){6})((([\\dA-F]{1,4}((?!\\3)::|:\\b|$))|(?!\\2\\3)){2}|(((2[0-4]|1\\d|[1-9])?\\d|25[0-5])\\.?\\b){4})$/.test(%s)',
  regex: '/[^\\\\]\\\\[^.*+?^${}()|[\\]\\\\bBcdDfnrsStvwWxu0-9]/i.test(%s)',
  // TODO optimize uri-reference regex... too long
  'json-pointer': '!/^$|^\\/(?:~(?=[01])|[^~])*$/i.test(%s)', // add empty valid string,
  'uri-reference': '!/^(?:[A-Za-z][A-Za-z0-9+\\-.]*:(?:\\/\\/(?:(?:[A-Za-z0-9\\-._~!$&\'()*+,;=:]|%[0-9A-Fa-f]{2})*@)?(?:\\[(?:(?:(?:(?:[0-9A-Fa-f]{1,4}:){6}|::(?:[0-9A-Fa-f]{1,4}:){5}|(?:[0-9A-Fa-f]{1,4})?::(?:[0-9A-Fa-f]{1,4}:){4}|(?:(?:[0-9A-Fa-f]{1,4}:){0,1}[0-9A-Fa-f]{1,4})?::(?:[0-9A-Fa-f]{1,4}:){3}|(?:(?:[0-9A-Fa-f]{1,4}:){0,2}[0-9A-Fa-f]{1,4})?::(?:[0-9A-Fa-f]{1,4}:){2}|(?:(?:[0-9A-Fa-f]{1,4}:){0,3}[0-9A-Fa-f]{1,4})?::[0-9A-Fa-f]{1,4}:|(?:(?:[0-9A-Fa-f]{1,4}:){0,4}[0-9A-Fa-f]{1,4})?::)(?:[0-9A-Fa-f]{1,4}:[0-9A-Fa-f]{1,4}|(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))|(?:(?:[0-9A-Fa-f]{1,4}:){0,5}[0-9A-Fa-f]{1,4})?::[0-9A-Fa-f]{1,4}|(?:(?:[0-9A-Fa-f]{1,4}:){0,6}[0-9A-Fa-f]{1,4})?::)|[Vv][0-9A-Fa-f]+\\.[A-Za-z0-9\\-._~!$&\'()*+,;=:]+)\\]|(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)|(?:[A-Za-z0-9\\-._~!$&\'()*+,;=]|%[0-9A-Fa-f]{2})*)(?::[0-9]*)?(?:\\/(?:[A-Za-z0-9\\-._~!$&\'()*+,;=:@]|%[0-9A-Fa-f]{2})*)*|\\/(?:(?:[A-Za-z0-9\\-._~!$&\'()*+,;=:@]|%[0-9A-Fa-f]{2})+(?:\\/(?:[A-Za-z0-9\\-._~!$&\'()*+,;=:@]|%[0-9A-Fa-f]{2})*)*)?|(?:[A-Za-z0-9\\-._~!$&\'()*+,;=:@]|%[0-9A-Fa-f]{2})+(?:\\/(?:[A-Za-z0-9\\-._~!$&\'()*+,;=:@]|%[0-9A-Fa-f]{2})*)*|)(?:\\?(?:[A-Za-z0-9\\-._~!$&\'()*+,;=:@\\/?]|%[0-9A-Fa-f]{2})*)?(?:\\#(?:[A-Za-z0-9\\-._~!$&\'()*+,;=:@\\/?]|%[0-9A-Fa-f]{2})*)?|(?:\\/\\/(?:(?:[A-Za-z0-9\\-._~!$&\'()*+,;=:]|%[0-9A-Fa-f]{2})*@)?(?:\\[(?:(?:(?:(?:[0-9A-Fa-f]{1,4}:){6}|::(?:[0-9A-Fa-f]{1,4}:){5}|(?:[0-9A-Fa-f]{1,4})?::(?:[0-9A-Fa-f]{1,4}:){4}|(?:(?:[0-9A-Fa-f]{1,4}:){0,1}[0-9A-Fa-f]{1,4})?::(?:[0-9A-Fa-f]{1,4}:){3}|(?:(?:[0-9A-Fa-f]{1,4}:){0,2}[0-9A-Fa-f]{1,4})?::(?:[0-9A-Fa-f]{1,4}:){2}|(?:(?:[0-9A-Fa-f]{1,4}:){0,3}[0-9A-Fa-f]{1,4})?::[0-9A-Fa-f]{1,4}:|(?:(?:[0-9A-Fa-f]{1,4}:){0,4}[0-9A-Fa-f]{1,4})?::)(?:[0-9A-Fa-f]{1,4}:[0-9A-Fa-f]{1,4}|(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))|(?:(?:[0-9A-Fa-f]{1,4}:){0,5}[0-9A-Fa-f]{1,4})?::[0-9A-Fa-f]{1,4}|(?:(?:[0-9A-Fa-f]{1,4}:){0,6}[0-9A-Fa-f]{1,4})?::)|[Vv][0-9A-Fa-f]+\\.[A-Za-z0-9\\-._~!$&\'()*+,;=:]+)\\]|(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)|(?:[A-Za-z0-9\\-._~!$&\'()*+,;=]|%[0-9A-Fa-f]{2})*)(?::[0-9]*)?(?:\\/(?:[A-Za-z0-9\\-._~!$&\'()*+,;=:@]|%[0-9A-Fa-f]{2})*)*|\\/(?:(?:[A-Za-z0-9\\-._~!$&\'()*+,;=:@]|%[0-9A-Fa-f]{2})+(?:\\/(?:[A-Za-z0-9\\-._~!$&\'()*+,;=:@]|%[0-9A-Fa-f]{2})*)*)?|(?:[A-Za-z0-9\\-._~!$&\'()*+,;=@]|%[0-9A-Fa-f]{2})+(?:\\/(?:[A-Za-z0-9\\-._~!$&\'()*+,;=:@]|%[0-9A-Fa-f]{2})*)*|)(?:\\?(?:[A-Za-z0-9\\-._~!$&\'()*+,;=:@\\/?]|%[0-9A-Fa-f]{2})*)?(?:\\#(?:[A-Za-z0-9\\-._~!$&\'()*+,;=:@\\/?]|%[0-9A-Fa-f]{2})*)?)$/i.test(%s)',
  'uri-template': '!/^(?:(?:[^\\x00-\\x20"\'<>%\\\\^`{|}]|%[0-9a-f]{2})|\\{[+#.\\/;?&=,!@|]?(?:[a-z0-9_]|%[0-9a-f]{2})+(?:\\:[1-9][0-9]{0,3}|\\*)?(?:,(?:[a-z0-9_]|%[0-9a-f]{2})+(?:\\:[1-9][0-9]{0,3}|\\*)?)*\\})*$/i.test(%s)',
};

},{}],5:[function(require,module,exports){
/**
 * @module utils
 * @description
 * Basic utilities for djv project
 */

/**
 * @name asExpression
 * @type {function}
 * @description
 * Transform function or string to expression
 * @see validators
 * @param {function|string} fn
 * @param {object} schema
 * @param {object} tpl templater instance
 * @returns {string} expression
 */
function asExpression(fn, schema, tpl) {
  if (typeof fn !== 'function') {
    return fn;
  }

  return fn(schema, tpl);
}

/**
 * @name hasProperty
 * @type {function}
 * @description
 * Check if the property exists in a given object
 * @param {object} object
 * @param {string} property
 * @returns {boolean} exists
 */
function hasProperty(object, property) {
  return (
    typeof object === 'object' &&
    Object.prototype.hasOwnProperty.call(object, property)
  );
}

module.exports = {
  asExpression,
  hasProperty,
};

},{}],6:[function(require,module,exports){
/**
 * @module keywords
 * @description
 * A list of keywords used in specification.
 */
module.exports = [
  '$ref',
  '$schema',
  'type',
  'not',
  'anyOf',
  'allOf',
  'oneOf',
  'properties',
  'patternProperties',
  'additionalProperties',
  'items',
  'additionalItems',
  'required',
  'default',
  'title',
  'description',
  'definitions',
  'dependencies',
  '$id',
  'contains',
  'const',
  'examples'
];

},{}],7:[function(require,module,exports){
/**
 * @module properties
 * @description
 * Validators as string for properties keyword rules.
 * A validator is a function, which when executed returns
 * - `false` if test is failed,
 * - `true` otherwise.
 */
module.exports = {
  readOnly: 'false',
  exclusiveMinimum(schema) {
    return `%s <= ${schema.exclusiveMinimum}`;
  },
  minimum(schema) {
    return `%s < ${schema.minimum}`;
  },
  exclusiveMaximum(schema) {
    return `%s >= ${schema.exclusiveMaximum}`;
  },
  maximum(schema) {
    return `%s > ${schema.maximum}`;
  },
  multipleOf: '($1/$2) % 1 !== 0 && typeof $1 === "number"',
  // When the instance value is a string
  // this provides a regular expression that a string instance MUST match in order to be valid.
  pattern(schema) {
    let pattern;
    let modifiers;

    if (typeof schema.pattern === 'string') { pattern = schema.pattern; } else {
      pattern = schema.pattern[0];
      modifiers = schema.pattern[1];
    }

    const regex = new RegExp(pattern, modifiers);
    return `typeof ($1) === "string" && !${regex}.test($1)`;
  },
  /**
  * Creates an array containing the numeric code points of each Unicode
  * character in the string. While JavaScript uses UCS-2 internally,
  * this function will convert a pair of surrogate halves (each of which
  * UCS-2 exposes as separate characters) into a single code point,
  * matching UTF-16.
  * @see `punycode.ucs2.encode`
  * @see <https://mathiasbynens.be/notes/javascript-encoding>
  * @memberOf punycode.ucs2
  * @name decode
  * @param {String} string The Unicode input string (UCS-2).
  * @returns {Array} The new array of code points.
  */
  minLength: 'typeof $1 === "string" && function dltml(b,c){for(var a=0,d=b.length;a<d&&c;){var e=b.charCodeAt(a++);55296<=e&&56319>=e&&a<d&&56320!==(b.charCodeAt(a++)&64512)&&a--;c--}return!!c}($1, $2)',
  maxLength: 'typeof $1 === "string" && function dmtml(b,c){for(var a=0,d=b.length;a<d&&0<=c;){var e=b.charCodeAt(a++);55296<=e&&56319>=e&&a<d&&56320!==(b.charCodeAt(a++)&64512)&&a--;c--}return 0>c}($1, $2)',
  // This attribute defines the minimum number of values
  // in an array when the array is the instance value.
  minItems: '$1.length < $2 && Array.isArray($1)',
  // This attribute defines the maximum number of values
  // in an array when the array is the instance value.
  maxItems: '$1.length > $2 && Array.isArray($1)',
  // TODO without some
  uniqueItems(schema, fn) {
    if (!schema.uniqueItems) {
      return 'true';
    }

    fn(fn.cache('{}'));
    return `Array.isArray($1) && $1.some(function(item, key) {
        if(item !== null && typeof item === "object") key = JSON.stringify(item);
        else key = item;
        if(${fn.cache('{}')}.hasOwnProperty(key)) return true;
        ${fn.cache('{}')}[key] = true;
    })`;
  },
  // ***** object validation ****
  minProperties: '!Array.isArray($1) && typeof $1 === "object" && Object.keys($1).length < $2',
  // An object instance is valid against "maxProperties"
  // if its number of properties is less than, or equal to, the value of this keyword.
  maxProperties: '!Array.isArray($1) && typeof $1 === "object" && Object.keys($1).length > $2',
  // ****** all *****
  enum(schema, fn) {
    return schema.enum.map((value) => {
      let $1 = '$1';
      let comparedValue = value;

      if (typeof value === 'object') {
        comparedValue = `'${JSON.stringify(value)}'`;
        $1 = fn.cache('JSON.stringify($1)');
      } else if (typeof value === 'string') {
        comparedValue = `'${value}'`;
      }

      return `${$1} !== ${comparedValue}`;
    }).join(' && ');
  }
};

},{}],8:[function(require,module,exports){
/**
 * @module schema
 * @description
 * Low-level utilities to check, create and transform schemas
 */

/**
 * @name transformation
 * @type {object}
 * @description
 * Schema values transformation
 */
const transformation = {
  ANY_SCHEMA: {},
  NOT_ANY_SCHEMA: { not: {} },
};

/**
 * @name is
 * @type {function}
 * @description
 * Verify the object could be a schema
 * Since draft-06 supports boolean as a schema definition
 * @param {object} schema
 * @returns {boolean} isSchema
 */
function is(schema) {
  return (
    typeof schema === 'object' ||
    typeof schema === 'boolean'
  );
}

/**
 * @name transform
 * @type {function}
 * @description
 * Transform a schema pseudo presentation
 * Since draft-06 supports boolean as a schema definition
 * @param {object} schema
 * @returns {object} schema
 */
function transform(schema) {
  if (schema === true) {
    return transformation.ANY_SCHEMA;
  } else if (schema === false) {
    return transformation.NOT_ANY_SCHEMA;
  }
  return schema;
}

/**
 * @name make
 * @type {function}
 * @description
 * Generate a simple schema by a given object
 * @param {any} instance
 * @returns {object} schema
 */
function make(instance) {
  if (typeof instance !== 'object' || instance === null) {
    return { enum: [instance] };
  }

  if (Array.isArray(instance)) {
    return {
      items: instance.map(make),
        // other items should be valid by `false` schema, aka not exist at all
      additionalItems: false
    };
  }

  const required = Object.keys(instance);
  return {
    properties: required.reduce((memo, key) => (
      Object.assign({}, memo, {
        [key]: make(instance[key])
      })
    ), {}),
    required,
    // other properties should be valid by `false` schema, aka not exist at all
    // additionalProperties: false,
  };
}

module.exports = {
  is,
  make,
  transform,
  transformation,
};

},{}],9:[function(require,module,exports){
/**
 * @module state
 * @description
 * State module is responsible for scope schemas resolution.
 * It also exports a main `generate` function.
 */

const { list: validators } = require('../validators');
const { body, restore, template } = require('./template');
const { hasProperty } = require('./');
const {
  normalize,
  makePath,
  head,
  isFullUri,
  fragment,
  keys,
} = require('./uri');
const {
  is: isSchema,
  transform: transformSchema,
} = require('./schema');

function State(schema = {}, env) {
  Object.assign(this, {
    context: [],
    entries: new Map(),
    env,
  });
}

/**
 * @name generate
 * @type {function}
 * @description
 * The main schema process function.
 * Available and used both in external and internal generation.
 * Saves the state for internal recursive calls.
 * @param {object} env - djv environment
 * @param {object} schema - to process
 * @param {State} state - saved state
 * @param {Environment} options
 * @returns {function} restoredFunction
 */
function generate(env, schema, state = new State(schema, env), options) {
  const tpl = template(state, options);
  tpl.visit(schema);

  const source = body(tpl, state, options);
  return restore(source, schema, options);
}

State.prototype = Object.assign(Object.create(Array.prototype), {
  /**
   * @name addEntry
   * @type {function}
   * @description
   * Generates an internal function.
   * Usually necessary for `allOf` types of validators.
   * Caches generated functions by schema object key.
   * Checks for an existing schema in a context stack to avoid double parsing and generation.
   * @param {string} url
   * @param {object} schema
   * @returns {number/boolean} index
   */
  addEntry(url, schema) {
    let entry = this.entries.get(schema);
    if (entry === false) {
      // has already been added to process queue
      // will be revealed as an entry
      return this.context.push(schema);
    }

    if (typeof entry === 'undefined') {
      // start to process schema
      this.entries.set(schema, false);
      entry = generate(this.env, schema, this, { inner: true });
      this.entries.set(schema, entry);
      this.revealReference(schema);
    }

    return this.context.push(entry);
  },
  /**
   * @name revealReference
   * @type {function}
   * @description
   * If a schema was added during the add entry phase
   * Then it should be revealed in this step
   * @param {object} schema
   * @returns {void}
   */
  revealReference(schema) {
    for (
      let doubled = this.context.indexOf(schema);
      doubled !== -1;
      doubled = this.context.indexOf(schema)
    ) {
      this.context[doubled] = this.context.length;
    }
  },
  /**
   * @name link
   * @type {function}
   * @description
   * Returns an entry's index in a context stack.
   * @param {string} url
   * @returns {string} entry
   */
  link(url) {
    const schema = this.resolve(url);
    const entry = this.addEntry(url, schema);
    return entry;
  },
  /**
   * @name resolveReference
   * @type {function}
   * @description
   * Resolve reference against the stack.
   * @param {string} reference
   * @returns {string} resolvedReference
   */
  resolveReference(reference) {
    if (isFullUri(reference)) {
      return reference;
    }

    // find last full URI schema
    let lastFullURIReference;
    let lastFullURISchemaIndex;

    for (let i = this.length - 1; i >= 0; i -= 1, lastFullURIReference = false) {
      const { [keys.id]: id, $ref } = this[i];
      lastFullURIReference = id || $ref;
      if (isFullUri(lastFullURIReference)) {
        lastFullURISchemaIndex = i;
        break;
      }
    }

    // collect all partial routes for it
    const partialReferences = [];
    for (let i = this.length - 1; i > lastFullURISchemaIndex; i -= 1) {
      const { [keys.id]: id, $ref } = this[i];
      const partialReference = id || $ref;
      if (head(partialReference)) {
        partialReferences.push(partialReference);
      }
    }

    // attach reference and make path
    const path = makePath([lastFullURIReference, ...partialReferences, reference]);
    return path;
  },
  /**
   * @name ascend
   * @private
   * @type {function}
   * @description
   * Search for a parent schema by reference.
   * Iterates over the chain of schemas.
   * @param {string} reference
   * @returns {object} parentSchema
   */
  ascend(reference) {
    const path = head(reference);
    let { schema: parentSchema = this[0] } = this.env.resolved[path] || {};

    // Search while it is a full schema, not a ref
    while (
      parentSchema.$ref &&
      // avoid infinite loop
      head(parentSchema.$ref) !== head(reference) &&
      // > All other properties in a "$ref" object MUST be ignored.
      // @see https://tools.ietf.org/html/draft-wright-json-schema-01#section-8
      Object.keys(parentSchema).length === 1
    ) {
      parentSchema = this.ascend(parentSchema.$ref);
    }

    return parentSchema;
  },
  /**
   * @name descend
   * @private
   * @type {function}
   * @description
   * Search for a child schema by reference.
   * Iterates over the chain of schemas.
   * @param {string} reference
   * @returns {object} currentSchema
   */
  descend(reference, parentSchema) {
    let uriFragment = fragment(reference);
    if (!uriFragment && isFullUri(reference)) {
      return parentSchema;
    }

    if (!uriFragment) {
      uriFragment = reference;
    }

    const parts = uriFragment.split('/');
    const currentSchema = parts
      .map(normalize)
      .reduce((schema, part, index) => {
        let subSchema = schema[part];
        if (!isSchema(subSchema)) {
          subSchema = schema.definitions && schema.definitions[part];
        }

        if (
          // last will be pushed on visit
          // @see /draft4/refRemote.json:http://localhost:1234/scope_change_defs2.json
          index !== parts.length - 1 &&
          hasProperty(subSchema, keys.id)
        ) {
          this.push(subSchema);
        }

        return subSchema;
      }, parentSchema);

    return isSchema(currentSchema) ? currentSchema : parentSchema;
  },
  /**
   * @name resolve
   * @type {function}
   * @description
   * Resolves schema by given reference and current registered context stack.
   * @param {string} url
   * @returns {object} schema
   */
  resolve(reference) {
    if (typeof reference !== 'string') {
      return reference;
    }

    const fullReference = this.resolveReference(reference);
    const parentSchema = this.ascend(fullReference);
    const subSchema = this.descend(reference, parentSchema);

    return subSchema;
  },
  /**
   * @name visit
   * @type {function}
   * @description
   * Calls each registered validator with given schema and template instance.
   * Validator may or may not add code to generated validator function.
   * @param {object} pseudoSchema
   * @param {object} tpl
   * @returns {void}
   */
  visit(pseudoSchema, tpl) {
    const schema = transformSchema(pseudoSchema);
    const initialLength = this.length;
    this.push(schema);

    validators.some(validator => (
      validator(schema, tpl)
    ));

    this.length = initialLength;
  },
});

module.exports = {
  State,
  generate,
};

},{"../validators":20,"./":5,"./schema":8,"./template":10,"./uri":12}],10:[function(require,module,exports){
/**
 * @module template
 * @description
 * Defines a small templater functionality for creating functions body.
 */

/**
 * @name template
 * @type function
 * @description
 * Provides a templater function, which adds a line of code into generated function body.
 *
 * @param {object} state - used in visit and reference method to iterate and find schemas.
 * @param {DjvConfig} options
 * @return {function} tpl
 */
function template(state, options) {
  function tpl(expression, ...args) {
    let last;

    tpl.lines.push(
      expression
        .replace(/%i/g, () => 'i')
        .replace(/\$(\d)/g, (match, index) => `${args[index - 1]}`)
        .replace(/(%[sd])/g, () => {
          if (args.length) {
            last = args.shift();
          }

          return `${last}`;
        })
    );

    return tpl;
  }

  const error = typeof options.errorHandler === 'function' ?
    options.errorHandler :
    function defaultErrorHandler(errorType) {
      return `return "${errorType}: ${tpl.data}";`;
    };

  Object.assign(tpl, {
    cachedIndex: 0,
    cached: [],
    cache(expression) {
      const layer = tpl.cached[tpl.cached.length - 1];
      if (layer[expression]) {
        return `i${layer[expression]}`;
      }

      tpl.cachedIndex += 1;
      layer[expression] = tpl.cachedIndex;
      return `(i${layer[expression]} = ${expression})`;
    },
    data: ['data'],
    error,
    lines: [],
    schema: ['schema'],
    push: tpl,
    /**
     * @name link
     * @description
     * Get schema validator by url
     * Call state link to generate or get cached function
     * @type {function}
     * @param {string} url
     * @return {string} functionName
     */
    link(url) {
      return `f${state.link(url)}`;
    },
    /**
     * @name visit
     * @description
     * Create new cache scope and visit given schema
     * @type {function}
     * @param {object} schema
     * @return {void}
     */
    visit(schema) {
      tpl.cached.push({});
      state.visit(schema, tpl);
      tpl.cached.pop();
    },
  });

  function dataToString() {
    return this.join('.').replace(/\.\[/g, '[');
  }
  tpl.data.toString = dataToString;
  tpl.schema.toString = dataToString;

  return tpl;
}

/**
 * @name restore
 * @type function
 * @description
 * Generate a function by given body with a schema in a closure
 *
 * @param {string} source - function inner & outer body
 * @param {object} schema - passed as argument to meta function
 * @param {DjvConfig} config
 * @return {function} tpl
 */
function restore(source, schema, { inner } = {}) {
  /* eslint-disable no-new-func */
  const tpl = new Function('schema', source)(schema);
  /* eslint-enable no-new-func */

  if (!inner) {
    tpl.toString = function toString() {
      return source;
    };
  }

  return tpl;
}

/**
 * @name body
 * @type function
 * @description
 * Generate a function body, containing internal variables and helpers
 *
 * @param {object} tpl - template instance, containing all analyzed schema related data
 * @param {object} state - state of schema generation
 * @param {DjvConfig} config
 * @return {string} body
 */
function body(tpl, state, { inner, errorHandler } = {}) {
  let dynamicVariables = '';
  let errors = '';
  let dynamicFunctions = '';

  if (tpl.cachedIndex) {
    // @see map array with holes trick
    // http://2ality.com/2013/11/initializing-arrays.html
    // TODO change var to const
    dynamicVariables = `var i${Array(...Array(tpl.cachedIndex))
      .map((value, i) => i + 1)
      .join(',i')};`;
  }
  if (errorHandler) {
    /**
     * @var {array} errors - empty array for pushing errors ability
     * @see errorHandler
     */
    dynamicVariables += 'var errors = [];';
    errors = 'if(errors.length) return errors;';
  }

  if (!inner && state.context.length) {
    const functions = [];
    const references = [];
    state.context
      .forEach((value, i) => {
        if (typeof value === 'number') {
          references.push(`${i + 1}=f${value + 1}`);
          return;
        }
        functions.push(`${i + 1}=${value}`);
      });
    dynamicFunctions = `var f${functions.concat(references).join(',f')};`;
  }

  const source = `${dynamicFunctions}
    function f0(data){
      "use strict";
      ${dynamicVariables}
      ${tpl.lines.join('\n')}
      ${errors}
    }
    return f0;`;

  return source;
}

module.exports = {
  body,
  restore,
  template,
};

},{}],11:[function(require,module,exports){
module.exports = {
  null: '%s !== null',
  string: 'typeof %s !== "string"',
  boolean: 'typeof %s !== "boolean"',
  number: 'typeof %s !== "number" || %s !== %s',
  integer: 'typeof %s !== "number" || %s % 1 !== 0',
  object: '!%s || typeof %s !== "object" || Array.isArray(%s)',
  array: '!Array.isArray(%s)',
  date: '!(%s instanceof Date)'
};

},{}],12:[function(require,module,exports){
/**
 * @module utils
 * @description
 * Utilities to check and normalize uri
 */
const REGEXP_URI = /:\/\//;
const REGEXP_URI_FRAGMENT = /#\/?/;
const REGEXP_URI_PATH = /(^[^:]+:\/\/[^?#]*\/).*/;

/**
 * @name keys
 * @type {object}
 * @description
 * Keys to apply schema attributes & values
 */
const keys = {
  id: '$id',
};

/**
 * @name head
 * @type {function}
 * @description
 * Clean an id from its fragment
 * @example
 * head('http://domain.domain:2020/test/a#test')
 * // returns 'http://domain.domain:2020/test/a'
 * @param {string} id
 * @returns {string} cleaned
 */
function head(uri) {
  if (typeof uri !== 'string') {
    return uri;
  }

  const parts = uri.split(REGEXP_URI_FRAGMENT);
  return parts[0];
}

function isFullUri(uri) {
  return REGEXP_URI.test(uri);
}

/**
 * @name path
 * @type {function}
 * @description
 * Gets a scheme, domain and a path part from the uri
 * @example
 * path('http://domain.domain:2020/test/a?test')
 * // returns 'http://domain.domain:2020/test/'
 * @param {string} uri
 * @returns {string} path
 */
function path(uri) {
  return uri.replace(REGEXP_URI_PATH, '$1');
}

/**
 * @description
 * Get the fragment (#...) part of the uri
 * @see https://tools.ietf.org/html/rfc3986#section-3
 * @param {string} uri
 * @returns {string} fragment
 */
function fragment(uri) {
  if (typeof uri !== 'string') {
    return uri;
  }

  const parts = uri.split(REGEXP_URI_FRAGMENT);
  return parts[1];
}

/**
 * @name makePath
 * @type function
 * @description
 * Concat parts into single uri
 * @see https://tools.ietf.org/html/rfc3986#section-3
 * @param {array<string>} parts
 * @returns {string} uri
 */
function makePath(parts) {
  return parts
    .filter(part => typeof part === 'string')
    .reduce((uri, id) => {
      // if id is full replace uri
      if (!uri.length || isFullUri(id)) {
        return id;
      }
      if (!id) {
        return uri;
      }

      // if fragment found
      if (id.indexOf('#') === 0) {
        // should replace uri's sharp with id
        const sharpUriIndex = uri.indexOf('#');
        if (sharpUriIndex === -1) {
          return uri + id;
        }

        return uri.slice(0, sharpUriIndex) + id;
      }

      // get path part of uri
      // and replace the rest with id
      const partialUri = path(uri) + id;
      return partialUri + (partialUri.indexOf('#') === -1 ? '#' : '');
    }, '');
}

/**
 * @name normalize
 * @type {function}
 * @description
 * Replace json-pointer special symbols in a given uri.
 * @param {string} uri
 * @returns {string} normalizedUri
 */
function normalize(uri) {
  return decodeURIComponent(uri.replace(/~1/g, '/').replace(/~0/g, '~'));
}

module.exports = {
  makePath,
  isFullUri,
  head,
  fragment,
  normalize,
  keys,
};

},{}],13:[function(require,module,exports){
const { hasProperty } = require('../utils');

module.exports = function $ref(schema, tpl) {
  if (!hasProperty(schema, '$ref')) {
    return false;
  }

  const condition = `${tpl.link(schema.$ref)}(%s)`;
  const error = tpl.error('$ref');

  tpl(`if (${condition}) ${error}`, tpl.data);

  // All other properties in a "$ref" object MUST be ignored.
  // @see https://tools.ietf.org/html/draft-wright-json-schema-01#section-8
  return true;
};

},{"../utils":5}],14:[function(require,module,exports){
const { hasProperty } = require('../utils');

module.exports = function allOf(schema, tpl) {
  if (!hasProperty(schema, 'allOf')) {
    return;
  }

  const condition = `${schema.allOf.map(reference => `${tpl.link(reference)}`).join('(%s) || ')}(%s)`;
  const error = tpl.error('allOf');

  tpl(`if (${condition}) ${error}`, tpl.data);
};

},{"../utils":5}],15:[function(require,module,exports){
const { hasProperty } = require('../utils');

module.exports = function anyOf(schema, tpl) {
  if (!hasProperty(schema, 'anyOf')) {
    return;
  }

  const condition = schema.anyOf.map(reference => `${tpl.link(reference)}(%s)`).join(' && ');
  const error = tpl.error('anyOf');

  tpl(`if (${condition}) ${error}`, tpl.data);
};

},{"../utils":5}],16:[function(require,module,exports){
const { hasProperty } = require('../utils');
const { make: makeSchema } = require('../utils/schema');

module.exports = function constant(schema, tpl) {
  if (!hasProperty(schema, 'const')) {
    return;
  }

  const constantInstanceSchema = makeSchema(schema.const);
  tpl.visit(constantInstanceSchema);
};

},{"../utils":5,"../utils/schema":8}],17:[function(require,module,exports){
const { hasProperty } = require('../utils');

module.exports = function contains(schema, tpl) {
  if (!hasProperty(schema, 'contains')) {
    return;
  }

  const error = tpl.error('contains');
  const fn = `${tpl.link(schema.contains)}`;
  const condition = `${fn}(%s)`;

  tpl('if (Array.isArray(%s)) {', tpl.data);
  tpl(`if (%s.length === 0) ${error}`, tpl.data);
  tpl('for ($1; $2 < $3.length; $2++) {', tpl.cache('0'), tpl.cache('0'), tpl.data);
  tpl.data.push(`[${tpl.cache('0')}]`);
  tpl(`if (!${condition}) break;`, tpl.data);
  tpl.data.pop();
  tpl(`if ($1 === $2.length - 1) ${error}`, tpl.cache('0'), tpl.data);
  tpl('}');
  tpl('}');
};

},{"../utils":5}],18:[function(require,module,exports){
const { hasProperty } = require('../utils');
const { is: isSchema } = require('../utils/schema');

module.exports = function dependencies(schema, tpl) {
  if (!hasProperty(schema, 'dependencies')) {
    return;
  }

  Object.keys(schema.dependencies)
    .forEach((dependency) => {
      tpl('if (%s.hasOwnProperty("%s")) {', tpl.data, dependency);
      if (Array.isArray(schema.dependencies[dependency]) || typeof schema.dependencies[dependency] === 'string') {
        [].concat(schema.dependencies[dependency]).forEach((property) => {
          tpl('if (!%s.hasOwnProperty("%s"))', tpl.data, property)(tpl.error('dependencies'));
        });
      } else if (isSchema(schema.dependencies[dependency])) {
        tpl.visit(schema.dependencies[dependency]);
      }
      tpl('}');
    });
};

},{"../utils":5,"../utils/schema":8}],19:[function(require,module,exports){
const formats = require('../utils/formats');
const { asExpression } = require('../utils');

module.exports = function format(schema, tpl) {
  if (typeof schema.format === 'undefined') {
    return;
  }

  const condition = asExpression(formats[schema.format], schema, tpl);
  if (!condition) {
    return;
  }
  const error = tpl.error('format');

  tpl(`if (${condition}) ${error}`, tpl.data);
};

},{"../utils":5,"../utils/formats":4}],20:[function(require,module,exports){
/**
 * @module validators
 * @description
 * Contains validators functions links
 * Provides an information about the order in which validators should be applied
 * Each validator may return true, which means, others will be ignored
 * @see $ref
 */
const required = require('./required');
const format = require('./format');
const property = require('./property');
const type = require('./type');
const $ref = require('./$ref');
const not = require('./not');
const anyOf = require('./anyOf');
const oneOf = require('./oneOf');
const allOf = require('./allOf');
const dependencies = require('./dependencies');
const properties = require('./properties');
const patternProperties = require('./patternProperties');
const items = require('./items');
const contains = require('../validators/contains');
const constant = require('../validators/const');
const propertyNames = require('../validators/propertyNames');

module.exports = {
  name: {
    $ref,
    required,
    format,
    property,
    type,
    not,
    anyOf,
    oneOf,
    allOf,
    dependencies,
    properties,
    patternProperties,
    items,
    contains,
    constant,
    propertyNames,
  },
  list: [
    $ref,
    required,
    format,
    property,
    type,
    not,
    anyOf,
    oneOf,
    allOf,
    dependencies,
    properties,
    patternProperties,
    items,
    contains,
    constant,
    propertyNames
  ]
};

},{"../validators/const":16,"../validators/contains":17,"../validators/propertyNames":27,"./$ref":13,"./allOf":14,"./anyOf":15,"./dependencies":18,"./format":19,"./items":21,"./not":22,"./oneOf":23,"./patternProperties":24,"./properties":25,"./property":26,"./required":28,"./type":29}],21:[function(require,module,exports){
const { hasProperty } = require('../utils');

module.exports = function items(schema, tpl) {
  if (!hasProperty(schema, 'items')) {
    return;
  }

  tpl('if(Array.isArray(%s)) {', tpl.data);
  if (Array.isArray(schema.items)) {
    if (schema.additionalItems === false) {
      tpl('if (%s.length > %s)', tpl.data, schema.items.length)(tpl.error('additionalItems'));
    }

    schema.items.forEach((subSchema, index) => {
      tpl(`if(%s.length > ${index}) {`, tpl.data);
      tpl.data.push(`[${index}]`);
      tpl.visit(subSchema);
      tpl.data.pop();
      tpl('}');
    });

    if (typeof schema.additionalItems === 'object') {
      tpl('for ($1; $2 < $3.length; $2++) {', tpl.cache(schema.items.length), tpl.cache(schema.items.length), tpl.data);
      tpl.data.push(`[${tpl.cache(schema.items.length)}]`);
      tpl.visit(schema.additionalItems);
      tpl.data.pop();
      tpl('}');
    }
  } else {
    tpl('for ($1; $2 < $3.length; $2++) {', tpl.cache('0'), tpl.cache('0'), tpl.data);
    tpl.data.push(`[${tpl.cache('0')}]`);
    tpl.visit(schema.items);
    tpl.data.pop();
    tpl('}');
  }
  tpl('}');
};

},{"../utils":5}],22:[function(require,module,exports){
const { hasProperty } = require('../utils');

module.exports = function not(schema, tpl) {
  if (!hasProperty(schema, 'not')) {
    return;
  }

  tpl(`if (!${tpl.link(schema.not)}(%s)) ${tpl.error('not')}`, tpl.data);
};

},{"../utils":5}],23:[function(require,module,exports){
const { hasProperty } = require('../utils');

module.exports = function oneOf(schema, tpl) {
  if (!hasProperty(schema, 'oneOf')) {
    return;
  }

  const fns = schema.oneOf.map(reference => tpl.link(reference));
  const arr = tpl.cache(`[${fns}]`);
  const cachedArr = tpl.cache(`[${fns}]`);
  const iterator = tpl.cache(`${cachedArr}.length - 1`);
  const cachedIterator = tpl.cache(`${cachedArr}.length - 1`);
  const count = tpl.cache('0');
  const cachedCount = tpl.cache('0');

  tpl(
    'for ($1, $3, $5; $4 >= 0 && $4 < $2.length; $4--) {',
    arr,
    cachedArr,
    iterator,
    cachedIterator,
    count
  )('if(!%s[%s](%s))', cachedArr, cachedIterator, tpl.data)('%s++', cachedCount)('}')('if (%s !== 1)', cachedCount)(tpl.error('oneOf'));
};

},{"../utils":5}],24:[function(require,module,exports){
const { hasProperty } = require('../utils');

module.exports = function patternProperties(schema, tpl) {
  const hasAdditionalProperties = hasProperty(schema, 'additionalProperties') && schema.additionalProperties !== true;
  const hasPatternProperties = hasProperty(schema, 'patternProperties');

  if (!hasAdditionalProperties && !hasPatternProperties) {
    return;
  }

  // When the instance value is an object,
  // the property values of the instance object
  // MUST conform to the property definitions in this object.
  tpl('if(typeof %s === \'object\' && !Array.isArray(%s)) {', tpl.data);

  tpl(tpl.cache('null'));
  const property = tpl.cache('null');
  const visitAdditionalProperties = () => {
    if (schema.additionalProperties === false) {
      tpl(tpl.error('additionalProperties'));
    } else if (schema.additionalProperties) {
      tpl.data.push(`[${property}]`);
      tpl.visit(schema.additionalProperties);
      tpl.data.pop();
    }
  };

  tpl('for (%s in %s) {', property, tpl.data);
  if (hasAdditionalProperties && hasPatternProperties) {
    tpl(tpl.cache('false'));
  }

  if (hasPatternProperties) {
    Object.keys(schema.patternProperties)
      .forEach((propertyKey) => {
        const propertySchema = schema.patternProperties[propertyKey];

        tpl('if (%s.test(%s)) {', new RegExp(propertyKey), property);
        if (hasAdditionalProperties) {
          tpl(`${tpl.cache('false')} = true;`);
        }

        tpl.data.push(`[${property}]`);
        tpl.visit(propertySchema);
        tpl.data.pop();
        tpl('}');

        if (schema.properties) {
          tpl(`if (${hasAdditionalProperties ? `${tpl.cache('false')} || ` : ''} %s.properties.hasOwnProperty(${property})) continue;`, tpl.schema);
        } else if (hasAdditionalProperties) {
          tpl(`if (${tpl.cache('false')}) continue;`);
        }

        visitAdditionalProperties();
      });
  } else {
    if (schema.properties) {
      tpl(`if(%s.properties.hasOwnProperty(${property})) continue;`, tpl.schema);
    }
    visitAdditionalProperties();
  }

  tpl('}}');
};

},{"../utils":5}],25:[function(require,module,exports){
const { hasProperty } = require('../utils');

module.exports = function properties(schema, tpl) {
  if (!hasProperty(schema, 'properties') || typeof schema.properties !== 'object') {
    return;
  }

  Object.keys(schema.properties)
    .forEach((propertyKey) => {
      const propertySchema = schema.properties[propertyKey];
      if (typeof propertySchema === 'object' && !Object.keys(propertySchema).length) {
        return;
      }

      const isNotRequired = !schema.required || schema.required.indexOf(propertyKey) === -1;
      if (isNotRequired) {
        tpl(`if (%s.hasOwnProperty("${propertyKey}")) {`, tpl.data);
      }

      tpl.data.push(`['${propertyKey}']`);
      tpl.visit(propertySchema);
      tpl.data.pop();

      if (isNotRequired) {
        tpl('}');
      }
    });
};

},{"../utils":5}],26:[function(require,module,exports){
const properties = require('../utils/properties');
const keywords = require('../utils/keywords');
const { asExpression } = require('../utils');

module.exports = function property(schema, tpl) {
  Object.keys(schema)
    .forEach((key) => {
      if (keywords.indexOf(key) !== -1 || key === 'format') {
        return;
      }

      const condition = asExpression(properties[key], schema, tpl);
      if (!condition) {
        return;
      }
      const error = tpl.error(key);

      tpl(`if (${condition}) ${error}`, tpl.data, schema[key]);
    });
};

},{"../utils":5,"../utils/keywords":6,"../utils/properties":7}],27:[function(require,module,exports){
const { hasProperty } = require('../utils');

module.exports = function propertyNames(schema, tpl) {
  if (!hasProperty(schema, 'propertyNames')) {
    return;
  }

  const fn = tpl.link(schema.propertyNames);
  const error = tpl.error('propertyNames');

  tpl(`if(Object.keys(%s).some(${fn})) ${error}`, tpl.data);
};

},{"../utils":5}],28:[function(require,module,exports){
module.exports = function required(schema, tpl) {
  if (!Array.isArray(schema.required)) {
    return;
  }

  tpl('if (typeof %s === \'object\' && !Array.isArray(%s)) {', tpl.data);
  schema.required.forEach((name) => {
    const condition = '!%s.hasOwnProperty("%s")';
    const error = tpl.error('required', name);

    tpl(`if (${condition}) ${error}`, tpl.data, name);
  });
  tpl('}');
};

},{}],29:[function(require,module,exports){
const types = require('../utils/types');
const { hasProperty } = require('../utils');

module.exports = function type(schema, tpl) {
  if (!hasProperty(schema, 'type')) {
    return;
  }

  const error = tpl.error('type');
  const condition = `(${[].concat(schema.type).map(key => types[key]).join(') && (')})`;

  tpl(`if (${condition}) ${error}`, tpl.data);
};

},{"../utils":5,"../utils/types":11}],30:[function(require,module,exports){
/* eslint no-param-reassign: [2, { "props": false }] */
const djvDraft04 = ({
  properties,
  keywords,
  validators,
  formats,
  keys,
  transformation,
}) => {
  Object.assign(properties, {
    minimum(schema) {
      return `%s <${schema.exclusiveMinimum ? '=' : ''} ${schema.minimum}`;
    },
    maximum(schema) {
      return `%s >${schema.exclusiveMaximum ? '=' : ''} ${schema.maximum}`;
    },
  });

  delete properties.exclusiveMaximum;
  delete properties.exclusiveMinimum;

  ['$id', 'contains', 'const', 'examples'].forEach((key) => {
    const index = keywords.indexOf(key);
    if (index === -1) {
      return;
    }

    keywords.splice(index, 1);
  });

  if (keywords.indexOf('exclusiveMaximum') === -1) {
    keywords.push('exclusiveMaximum', 'exclusiveMininum', 'id');
  }

  ['contains', 'constant', 'propertyNames'].forEach((key) => {
    const validator = validators.name[key];
    delete validators.name[key];

    const index = validators.list.indexOf(validator);
    if (index === -1) {
      return;
    }

    validators.list.splice(index, 1);
  });

  delete formats['json-pointer'];
  delete formats['uri-reference'];
  delete formats['uri-template'];

  Object.assign(keys, { id: 'id' });
  Object.assign(transformation, {
    ANY_SCHEMA: true,
    NOT_ANY_SCHEMA: false,
  });
};

module.exports = djvDraft04;

},{}]},{},[1]);
