'use strict';

angular.module('owsWalletApp').constant('appletEnvironmentStateSchema',
{
  '$schema': 'http://json-schema.org/draft-06/schema#',
  'title': 'Applet Environment State',
  'description': 'The representation of the state of the applet environment.',
  'type': 'object',
  'required': [
    'header',
    'applet',
    'appletCategory'
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
    'applet': {
      'type': 'object',
      'properties': {
        'presentation': {'type': 'string'}
      }
    },
    'appletCategory': {
      'type': 'object',
      'properties': {
        'presentation': {'type': 'string'}
      }
    }
  }
});
