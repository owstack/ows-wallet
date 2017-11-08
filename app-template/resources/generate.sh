# This script requires Sketch on macOS – see readme.md for details

function postprocess {
  echo "Beginning image postprocessing in $1"

  echo "Postprocessing assets for macOS..."
  iconset $1 app
  iconset $1 volume-icon

  echo "Creating Retina-ready DMG background..."
  tiffutil -cathidpicheck $1/mac/dmg-background.png $1/mac/dmg-background@2x.png -out $1/mac/dmg-background.tiff
  echo "Removing raw background pngs..."
  rm $1/mac/dmg-background.png $1/mac/dmg-background@2x.png

  echo "Postprocessing assets for Windows..."

  echo "Combining windows/ico pngs into a single ICO file..."
  # convert ships with imagemagick
  convert $1/windows/ico/ico_16x16.png $1/windows/ico/ico_24x24.png $1/windows/ico/ico_32x32.png $1/windows/ico/ico_48x48.png $1/windows/ico/ico_64x64.png $1/windows/ico/ico_128x128.png $1/windows/ico/ico_256x256.png $1/windows/icon.ico
  echo "Removing raw windows/ico pngs..."
  rm -r $1/windows/ico/* && rmdir $1/windows/ico

  echo "Postprocessing app assets..."

  echo "Combining ../img/icon ico pngs into a single ICO file..."
  # convert ships with imagemagick
  convert $1/../img/ico/ico_16x16.png $1/../img/ico/ico_24x24.png $1/../img/ico/ico_32x32.png $1/../img/ico/ico_48x48.png $1/../img/ico/ico_64x64.png $1/../img/ico/ico_128x128.png $1/../img/ico/ico_256x256.png $1/../img/icon.ico
  echo "Removing raw img/ico/ico pngs..."
  rm -r $1/../img/ico/* && rmdir $1/../img/ico

  echo "Combining img/favicon ico pngs into a single ICO file..."
  # convert ships with imagemagick
  convert $1/../img/favicon/ico_16x16.png $1/../img/favicon/ico_32x32.png $1/../img/favicon/ico_48x48.png $1/../img/favicon/ico_64x64.png $1/../img/favicon.ico
  echo "Removing raw ../img/icon/ico pngs..."
  rm -r $1/../img/favicon/* && rmdir $1/../img/favicon
}

function iconset {
  echo "Converting $1/$2 iconset to icns..."
  iconutil --convert icns $1/mac/$2.iconset --output $1/mac/$2.icns
  echo "Removing $1/$2 iconset..."
  rm -r $1/mac/$2.iconset
}

if [ $# -eq 0 ]; then
    echo "App template name not specified"
    exit
fi

if [ ! -d "../$1" ]; then
    echo "App template directory not found: ../$1"
  exit
fi

echo "Processing resources for $1"

# export all slices marked for export to the proper directory
echo "Exporting all assets from ../$1/src.sketch"

# Remove existing resources
rm -fr ../../resources/$1

# sketchtool is installed by install.sh
sketchtool export layers ../$1/resources.sketch --output=../$1/resources

postprocess ../$1/resources

echo "Publishing resources to resources/$1"
mkdir -p ../../resources
mv ../$1/resources ../../resources/$1
