# build all plugins from this list. Add your own folder plugin to build
# package.json must exist with the build and deploy command
plugins=("chart" "draw" "my-first-plugin" "range-slider" "swiper" "thematic-slider")

echo "Start build all process!"
for plugin in "${plugins[@]}"
do
    echo "Start process on $plugin"
    cd $plugin
    npm install > /dev/null
    npm audit fix > /dev/null
    npm rebuild node-sass > /dev/null 2>&1
    echo "Install and audit done"
    npm run build > /dev/null 2>&1
    npm run deploy > /dev/null 2>&1
    echo "Build and deploy done"
    cd ..
    echo "End process on $plugin"
done
echo "End build all process!"