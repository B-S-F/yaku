#!/bin/sh

if [ -z "$1" ] 
then
	echo "Please specify either a version or ask to upgrade major, minor or patch version for the created package"
  exit 1
fi

version="$1"

mkdir -p cli-package
cd ../client-lib
npm version $version
new_version=$(cat package.json | jq -r '.version')
npm install
npm run build
npm pack --pack-destination "../yaku-cli/cli-package"
cd ../yaku-cli
npm version $version
sed -i '.bak' 's#\"@B-S-F/yaku-client-lib\": .*,#"@B-S-F/yaku-client-lib": "^'$new_version'",#g' package.json
rm package.json.bak
npm install
npm pack --pack-destination "./cli-package"
cd cli-package
zip yaku-cli.zip *
mv yaku-cli.zip ..
cd ..
rm -R cli-package
