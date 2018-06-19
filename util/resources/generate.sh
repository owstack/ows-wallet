#!/bin/sh

# This script requires Sketch on macOS – see readme.md for details

postprocess() {
  echo "Beginning image postprocessing in $1"

  echo "Postprocessing assets for macOS..."
  iconset $1 app
  iconset $1 volume-icon

  echo "Creating Retina-ready DMG background..."
  tiffutil -cathidpicheck $1/mac/dmg-background.png $1/mac/dmg-background@2x.png -out $1/mac/dmg-background.tiff
  echo "Removing raw background pngs..."
  rm $1/mac/dmg-background.png $1/mac/dmg-background@2x.png

  echo "Postprocessing brand assets..."

  echo "Combining img/brand/icon ico pngs into a single ICO file..."
  # convert ships with imagemagick
  convert $1/img/brand/ico/ico_16x16.png $1/img/brand/ico/ico_24x24.png $1/img/brand/ico/ico_32x32.png $1/img/brand/ico/ico_48x48.png $1/img/brand/ico/ico_64x64.png $1/img/brand/ico/ico_128x128.png $1/img/brand/ico/ico_256x256.png $1/img/brand/icon.ico
  echo "Removing raw img/ico/ico pngs..."
  rm -r $1/img/brand/ico/* && rmdir $1/img/brand/ico

  echo "Combining img/brand/favicon ico pngs into a single ICO file..."
  # convert ships with imagemagick
  convert $1/img/brand/favicon/ico_16x16.png $1/img/brand/favicon/ico_32x32.png $1/img/brand/favicon/ico_48x48.png $1/img/brand/favicon/ico_64x64.png $1/img/brand/favicon.ico
  echo "Removing raw img/brand/icon/ico pngs..."
  rm -r $1/img/brand/favicon/* && rmdir $1/img/brand/favicon
}

iconset() {
  echo "Converting $1/$2 iconset to icns..."
  iconutil --convert icns $1/mac/$2.iconset --output $1/mac/$2.icns
  echo "Removing $1/$2 iconset..."
  rm -r $1/mac/$2.iconset
}

# check args
if [ $# -eq 0 ]; then
    echo "App template name not specified"
    exit
fi

# setup locations
ROOT_PATH="../.."
TEMPLATE_PATH="$ROOT_PATH/app-template/$1"
RESOURCES_ROOT="$ROOT_PATH/resources"
RESOURCES_PATH="$RESOURCES_ROOT/$1"

if [ ! -d "$TEMPLATE_PATH" ]; then
    echo "App template directory not found: $TEMPLATE_PATH"
  exit
fi

echo "Processing resources for $1"

# remove existing resources
rm -fr $RESOURCES_PATH

if hash sketchtool 2>/dev/null; then

  # export all slices marked for export to the proper directory
  echo "Exporting all assets from $TEMPLATE_PATH/resources.sketch"

  # sketchtool is installed by install.sh
  sketchtool export layers $TEMPLATE_PATH/resources.sketch --output=$TEMPLATE_PATH/resources

  postprocess $TEMPLATE_PATH/resources

else
  echo >&2 "Sketchtool is not installed, using pre-built resources from $TEMPLATE_PATH"
fi

echo "Publishing resources to $RESOURCES_PATH"
mkdir -p $RESOURCES_PATH
cp -R $TEMPLATE_PATH/resources/* $RESOURCES_PATH
