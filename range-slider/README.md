# Range Slider
This plugin let you add a range slider to your map. The slider works with ESRI feature, EASRI dynamic, ESRI WMS and WMS-T layers. You can use multiple layers at the same time.

[Demo page](https://jolevesq.github.io/contributed-plugins/range-slider/samples/range-slider-index.html)

Note: The export to GIF function is not supported on Internet Explorer as it does not support SVG <foreignObject> tag and Safari, as it uses a stricter security model on <foreignObject> tag (domtoimage library).

## How to use the plugin
Inside your configuration file you need
```
"plugins": {
    "rangeSlider": {
        "open": true,
        "maximize": true,
        "maximizeDesc": true,
        "autorun": false,
        "loop": true,
        "reverse": false,
        "lock: false,
        "controls": ["lock", "loop", "delay", "export", "refresh", "reverse"],
        "params": {
          "delay": 3000,
          "rangeType": "dual",
          "stepType": "dynamic",
          "precision": 0,
          "limit": { "min": 1109108871000, "max": 1111505342000, staticItems: [] },
          "range": { "min": 1109108871000, "max": 1111505342000 },
          "startRangeEnd": false,
          "rangeInterval": -1,
          "type": "date",
          "units": "string",
          "description": "string"
        },
        "layers": [{
            "id": "GeoChron",
            "field": "LAST_UPDATED",
            "isTimeAware": false
        }]
    }
}
```

Configuration parameters
- open: boolean to set the controls panel (description and slider) open by default.
- maximize: boolean to specify if the slider is maximized by default.
- maximizeDesc: boolean to specify if the description section is maximized by default.
- autorun: boolean to start the animation automatically (if true, open should be true as well).
- loop: boolean to restart automatically the animation when it reaches the end of the array.
- reverse: boolean to set the reverse play option (if true, play will go from right to left).
- lock: the left handle (play regular side) or right handle (play reverse side) is locked.
- controls: string array who contains needed controls. Order inside the array has no effect:
    - lock: lock or unlock left anchor when step or play.
    - loop: loop the animation.
    - reverse: toggle direction of animation (forward / backward).
    - delay: add a dropdown menu to change the delay in play animation.
    - export: ability to export the animation to a GIF.
    - refresh: reset the slider with the default values.
- params: object to set default values for the slider:
    - delay: delay between animations in milliseconds.
    - rangeType: the type of range (single for one handle or dual for 2 handles (range)).
    - stepType: the type of step (dynamic for open values or static from a list of values).
    - precision: the precision of numeric data or 'date' - 'hour' for date data.
    - range: object who contains the range values:
        - min: the minimal value for the range. If not set, minimum limit will be use.
        - max: the maximum value for the range. If not set, maximum limit will be use.
    - limit: object who contains the limit values (use when step type is dynamic):
        - min: the minimal value for the limit. If not set, layer min and max value will be extracted from service.
        - max: the maximum value for the limit. If not set, layer min and max value will be extracted from service.
        - staticItems: Array of values to set the inner limits (use when step type is static).
    - startRangeEnd: specify if the range is at the end of the limit when range is calculated.
    - rangeInterval: instead of defining the range object, you can specify the interval to set (will set it at the begining unless startRangeEnd = true)
    - type: type of slider (date, wmst or number). If date or wmst is selected, range and limit must be in milliseconds. The wmst is the type date for wmst layer type. Because they are ogcWMS at first there is no way know if it is a wms or wmst.
    - units: units label to add add the right of the slider bar.
    - descriptions: description to add to the slider info section. By default, layer name and field will be there.
- layers: array of layers to use inside the slider:
    - id: layer id as define in layer section.
    - field: field name of the field to use to filter with the range slider. It must be the field name, not the alias. Optional if it is a time aware layer.
    - isTimeAware: true if the layer is ESRI time aware with TimeInfo or WMS-T. If this is true, the layer will extract time information from the service.

NOTE: You can't have a rangeType 'single' with a stepType 'dynamic.

NOTE: To have the slider initialize the values from the layers, dual range type and dynamic limit should be selected. With the other type of range and limit, it may works but need to be tested.

NOTE: Because you can use a layer with a date even if the layer is not time aware, we have the isTimeAware parameter to force the slider to use time info from ESRI or WMS-T layer.

Milliseconds to date converter: https://currentmillis.com/

Inside your html, add this to your head section then replace href and src with your path.
```
<link rel="stylesheet" href="/range-slider.css" />
<script src="/range-slider.js"></script>
```
In the body section, the first div is your map div. You need to replace the id with the unique id for the map to link throught the api, replace rv-config with the configuration file to use, replace rv-plugins with the plugin name from the class name inside your index.ts (use camel case)
```
<div
    class="myMap"
    id="mapRangeSlider"
    is="rv-map"
    rv-config="rangeSlider-config.json"
    rv-langs='["en-CA", "fr-CA"]'
    rv-plugins="rangeSlider"
>
```
Modifications to the code are applied automatically and webpack-dev-server will reload the page with your modifications.

## Test page
To play with the code, from the plugin folder, do npm install, run build then npm run serve.
- http://localhost:6001/samples/range-slider-index.html

To deploy a test page, do npm run build then npm run deploy. The page will be created at
- https://"Your GitHub UserName".github.io/contributed-plugins/range-slider/samples/range-slider-index.html

## Author and support
Author and maintainer [NRCan FGP - Johann Levesque](https://github.com/jolevesq)

To report issue, please create an issue from the [GitHub repository](https://github.com/fgpv-vpgf/contributed-plugins/issues). Add the plugin-range-slider label and any other applicable one.

## RAMP version
Developed with RAMP version 3.2