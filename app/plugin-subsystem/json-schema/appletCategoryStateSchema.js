'use strict';

angular.module('owsWalletApp').constant('appletCategoryStateSchema',
{
  '$schema': 'http://json-schema.org/draft-06/schema#',
  'title': 'Applet Category State',
  'description': 'The representation of the state of an applet category.',
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
        'layout': {
          'type': 'object',
          'properties': {
            'list': {'type': 'object'}
          }
        }
      }
    }
  }
});
