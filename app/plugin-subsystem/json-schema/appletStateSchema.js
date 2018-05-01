'use strict';

angular.module('owsWalletApp').constant('appletStateSchema',
{
  '$schema': 'http://json-schema.org/draft-06/schema#',
  'title': 'Applet State',
  'description': 'The representation of the state of an applet.',
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
        'visible': {'type': 'boolean'},
        'category': {'type': 'string'},
        'layout': {
          'type': 'object',
          'properties': {
            'categoryList': {'type': 'object'},
            'grid': {'type': 'object'},
            'list': {'type': 'object'}
          }
        }
      }
    }
  }
});
