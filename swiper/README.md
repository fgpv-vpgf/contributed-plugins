# Swiper
This plugin let you add a layerSwipe on your map.
- [ESRI doc page](https://developers.arcgis.com/javascript/3/jsapi/layerswipe-amd.html)
- [ESRI sample](https://developers.arcgis.com/javascript/3/jssamples/widget_swipe.html)

[Demo page](https://jolevesq.github.io/contributed-plugins/swiper/samples/swiper-index.html)

## How to use the plugin
Inside your configuration file you need
```
"plugins": {
      "swiper": {
        "type": "vertical",
        "keyboardOffset": 10,
        "layers": [{"id": "0"}, {"id": "1"}]
      }
    }
```

Configuration parameters
- type: if swiper is vertical or horizontal (only vertical is supported at the moment).
- keyboardOffset: number of pixel to move the swiper when keyboard is use.
- layers: array of layers id to use with the swiper.

Inside your html, add this to your head section then replace href and src with your path.
```
<link rel="stylesheet" href="/swiper.css" />
<script src="/swiper.js"></script>
```
In the body section, you need to have a map div. You need to replace the id with the unique id for the map and rv-config with the configuration file to use.
```
<div
    class="myMap"
    id="mapSwiper"
    is="rv-map"
    rv-config="swiper.json"
    rv-langs='["en-CA", "fr-CA"]'
    rv-plugins="swiper"
>

## Test page
To play with the code, from the plugin folder, do npm install, run build then npm run serve.
- http://localhost:6001/samples/swiper-index.html

To deploy a test page, do npm run build then npm run deploy. The page will be created at
- https://"Your GitHub UserName".github.io/contributed-plugins/swiper/samples/swiper-index.html

## Author and support
Author and maintainer [NRCan FGP - Johann Levesque](https://github.com/jolevesq)

To report issue, please create an issue from the [GitHub repository](https://github.com/fgpv-vpgf/contributed-plugins/issues). Add the plugin-swiper label and any other applicable one.

## RAMP version
Developed with RAMP version 3.2