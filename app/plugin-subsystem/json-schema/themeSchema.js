'use strict';

angular.module('owsWalletApp').constant('themeSchema',
{
  '$schema': 'http://json-schema.org/draft-06/schema#',
  'title': 'Theme',
  'description': 'The representation of an OWS Wallet theme.',
  'version': '0.0.1',
  'type': 'object',
  'required': [
    'header',
    'permissions',
    'galleryImage',
    'previewImage',
    'store',
    'resources',
  ],
  'properties': {
    'header': {
      'type': 'object',
      'required': [
        'created',
        'updated',
        'name',
        'id',
        'author',
        'version',
        'url'
      ],
      'properties': {
        'created': {'type': 'number'},
        'updated': {'type': 'number'},
        'name': {'type': 'string'},
        'id': {'type': 'string'},
        'description': {'type': 'string'},
        'author': {'type': 'string'},
        'version': {'type': 'string'},
        'url': {
          'type': 'object',
          'required': [
            'support',
            'privacy'
          ],
          'properties': {
            'marketing': {'type': 'string'},
            'support': {'type': 'string'},
            'privacy': {'type': 'string'}
          }
        },
      }
    },
    'permissions': {
      'type': 'object',
      'properties': {
        'delete': {'type': 'boolean'}
      }
    },
    'flags': {'type': 'number'},
    'galleryImage': {'type': 'string'},
    'previewImage': {'type': 'string'},
    'store': {
      'type': 'object',
      'required': [
        'id',
        'rating',
        'price',
        'category'
      ],
      'properties': {
        'id': {'type': 'string'},
        'rating': {'type': 'string'},
        'price': {
          'amount': {'type': 'string'},
          'currency': {'type': 'string'}
        },
        'category': {
          'type': 'object',
          'required': [
            'primary',
            'secondary'
          ],
          'properties': {
            'primary': {'type': 'string'},
            'secondary': {'type': 'string'}
          }
        },
        'keywords': {
          'type': 'array',
          'items': {'type': 'string'}
        }
      }
    },
    'resources': {
      'type': 'array',
      'items': {'type': 'string'}
    },
    'uri': {'type': 'string'},
    'configuration': {
      'type': 'object',
      'properties': {
        'flags': {'type': 'number'}
      }
    },
    'skins': {'type': 'object'}
  }
});
