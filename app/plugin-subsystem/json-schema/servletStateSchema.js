'use strict';

angular.module('owsWalletApp').constant('servletStateSchema',
{
  '$schema': 'http://json-schema.org/draft-06/schema#',
  'title': 'Servlet State',
  'description': 'The representation of the state of a servlet.',
  'version': '0.0.1',
  'type': 'object',
  'required': [
    'header',
    'preferences'
  ],
  'properties': {
    'header': {
      'type': 'object',
      'required': [
        'created',
        'updated'
      ],
      'properties': {
        'created': {'type': 'number'},
        'updated': {'type': 'number'}
      }
    },
    'preferences': {
      'type': 'object',
      'properties': {
      }
    }
  }
});
