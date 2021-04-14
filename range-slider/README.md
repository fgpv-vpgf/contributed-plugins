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
        "controls": ["lock", "loop", "delay", "export", "refresh", "reverse"],
        "params": {
          "delay": 3000,
          "rangeType": "dual",
          "stepType": "dynamic",
          "precision": 0,
          "limit": { "min": 1109108871000, "max": 1111505342000, staticItems: [] },
          "range": { "min": 1109108871000, "max": 1111505342000 },
          "type": "date",
          "units": "string",
          "description": "string"
        },
        "layers": [{
            "id": "GeoChron",
            "field": "LAST_UPDATED"
        }]
    }
}
```

Configuration parameters
- open: boolean to set the controls panel (description and slider) open by default
- maximize: boolean to specify if the slider is maximized by default,
- maximizeDesc: boolean to specify if the description section is maximized by default,
- autorun: boolean to start the animation automatically (if true, open should be true as well)
- loop: boolean to restart automatically the animation when it reaches the end of the array
- controls: string array who contains needed controls. Order inside the array has no effect.
    - lock: lock or unlock left anchor when step or play
    - loop: loop the animation
    - reverse: toggle direction of animation (forward / backward)
    - delay: add a dropdown menu to change the delay in play animation
    - export: ability to export the animation to a GIF
    - refresh: reset the slider with the default values
- params: object to set default values for the slider
    - delay: delay between animations in milliseconds
    - rangeType: The type of range (single for one handle or dual for 2 handles (range))
    - stepType: The type of step (dynamic for open values or static from a list of values)
    - precision: The precision of numeric data or 'date' - 'hour' for date data
    - range: object who contains the range values
        - min: The minimal value for the range. If not set, minimum limit will be use. Must be set for WMS layers
        - max: The maximum value for the range. If not set, maximum limit will be use. Must be set for WMS layers
    - limit: object who contains the limit values (use when step type is dynamic)
        - min: The minimal value for the limit. Must be set for WMS layers. If not set, layer min and max value will be use.
        - max: The maximum value for the limit. Must be set for WMS layers. If not set, layer min and max value will be use.
        - staticItems: Array of values to set the inner limits (use when step type is static)
    - type: type of slider (date, wmst or number). If date or wmst is selected, range and limit must be in milliseconds. The wmst is the type date for wmst layer type. Because they are ogcWMS at first there is no way know if it is a wms or wmst.
    - units: units label to add add the right of the slider bar.
    - descriptions: description to add to the slider info section. By default, layer name and field will be there.
- layers: array of layers to use inside the slider
    - id: layer id as define in layer section
    - field: field name of the field to use to filter with the range slider. It must be the field name, not the alias.

NOTE: You can't have a rangeType 'single' with a stepType 'dynamic.

NOTE: To have the slider initialize the values from the layers, layer must be ESRI type with dual range type and dynamic limit. With the other type of range and limit, it is better to define the limit with a multiple that can
      be divided by the step (range max - range min).

Milliseconds to date converter: https://currentmillis.com/

Inside your html, add this to your head section then replace href and src with your path.
```
<link rel="stylesheet" href="/range-slider.css" />
<script src="/range-slider.js"></script>
```

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