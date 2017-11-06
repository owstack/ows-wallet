# This script requires Sketch on macOS – see readme.md for details

function postprocess {
  echo "Beginning postprocessing for app..."

  echo "Postprocessing assets for macOS..."
  iconset app
  iconset volume-icon

  echo "Creating Retina-ready DMG background..."
  tiffutil -cathidpicheck app/mac/dmg-background.png app/mac/dmg-background@2x.png -out app/mac/dmg-background.tiff
  echo "Removing raw background pngs..."
  rm app/mac/dmg-background.png app/mac/dmg-background@2x.png

  echo "Postprocessing assets for Windows..."

  echo "Combining windows/ico pngs into a single ICO file..."
  # convert ships with imagemagick
  convert app/windows/ico/ico_16x16.png app/windows/ico/ico_24x24.png app/windows/ico/ico_32x32.png app/windows/ico/ico_48x48.png app/windows/ico/ico_64x64.png app/windows/ico/ico_128x128.png app/windows/ico/ico_256x256.png app/windows/icon.ico
  echo "Removing raw windows/ico pngs..."
  rm -r app/windows/ico/* && rmdir app/windows/ico
}

function iconset {
  echo "Converting $1 iconset to icns..."
  iconutil --convert icns app/mac/$1.iconset --output app/mac/$1.icns
  echo "Removing $1 iconset..."
  rm -r app/mac/$1.iconset
}

# export all slices marked for export to the proper directory
echo "Exporting all assets from src.sketch..."

# Remove existing resources
rm -fr ./ows-wallet

# sketchtool is installed by install.sh
sketchtool export layers src.sketch

postprocess

# Rename resources dir for app-config
mv ./app ./ows-wallet