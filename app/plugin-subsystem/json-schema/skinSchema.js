'use strict';

angular.module('owsWalletApp').constant('skinSchema',
{
  "$schema": "http://json-schema.org/draft-06/schema#",
  "title": "Skin",
  "description": "The representation of an OWS Wallet skin.",
  "type": "object",
  "required": [
    "header",
    "permissions",
    "galleryImage",
    "previewImage",
    "store",
    "resources",
    "uri"
  ],
  "properties": {
    "header": {
      "type": "object",
      "required": [
        "name",
        "id",
        "kind",
        "author",
        "version",
        "url"
      ],
      "properties": {
        "name": {"type": "string"},
        "id": {"type": "string"},
        "kind": {"type": "string"},
        "description": {"type": "string"},
        "author": {"type": "string"},
        "version": {"type": "string"},
        "url": {
          "type": "object",
          "required": [
            "support",
            "privacy"
          ],
          "properties": {
            "marketing": {"type": "string"},
            "support": {"type": "string"},
            "privacy": {"type": "string"}
          }
        },
      }
    },
    "permissions": {
      "type": "object",
      "required": [
        "delete"
      ],
      "properties": {
        "delete": {"type": "boolean"}
      }
    },
    "galleryImage": {"type": "string"},
    "previewImage": {"type": "string"},
    "store": {
      "type": "object",
      "required": [
        "id",
        "rating",
        "price",
        "category"
      ],
      "properties": {
        "id": {"type": "string"},
        "rating": {"type": "string"},
        "price": {
          "amount": {"type": "string"},
          "currency": {"type": "string"}
        },
        "category": {
          "type": "object",
          "required": [
            "primary",
            "secondary"
          ],
          "properties": {
            "primary": {"type": "string"},
            "secondary": {"type": "string"}
          }
        },
        "keywords": {
          "type": "array",
          "items": {"type": "string"}
        }
      }
    },
    "resources": {
      "type": "array",
      "items": {"type": "string"}
    },
    "uri": {"type": "string"}
  }
});
