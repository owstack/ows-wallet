'use strict';

angular.module('owsWalletApp').constant('themeSchema',
{
  "$schema": "http://json-schema.org/draft-06/schema#",
  "title": "Theme",
  "description": "The representation of an OWS Wallet theme.",
  "type": "object",
  "required": [
    "header",
    "permissions",
    "galleryImage",
    "previewImage",
    "store",
    "resources",
    "model"
  ],
  "properties": {
    "header": {
      "type": "object",
      "required": [
        "name",
        "id",
        "author",
        "version",
        "url"
      ],
      "properties": {
        "name": {"type": "string"},
        "id": {"type": "string"},
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
    "model": {
      "type": "object",
      "required": [
        "showAppletGalleryGridLabel",
        "showSkinGalleryGridLabel"
      ],
      "properties": {
        "showAppletGalleryGridLabel": {"type": "boolean"},
        "showSkinGalleryGridLabel": {"type": "boolean"}
      }
    },
    "uri": {"type": "string"}
  }
});
