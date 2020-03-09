# Range Slider
This plugin let you add a range slider to your map. The slider works with ESRI feature, EASRI dynamic, ESRI WMS and WMS-T layers. You can use multiple layers at the same time.

[Demo page](https://jolevesq.github.io/contributed-plugins/range-slider/samples/range-slider-index.html)

## How to use the plugin
Inside your configuration file you need
```
"plugins": {
    "rangeSlider": {
        "controls": ["lock", "loop", "delay", "export", "refresh"],
        "params": {
          "delay": 3000,
          "limit": { "min": 1109108871000, "max": 1111505342000 },
          "range": { "min": 1109108871000, "max": 1111505342000 },
          "type": "date"
        },
        "layers": [{
            "id": "GeoChron",
            "field": "LAST_UPDATED"
        }]
    }
}
```

Configuration parameters
- controls: string array who contains needed controls. order inside the array has no effect.
    - lock: lock or unlock left anchor when step or play
    - loop: loop the animation
    - delay: add a dropdown menu to change the delay in play naimation
    - export: ability to export the animation to a GIF
    - refresh: reset the slider with the default values 
- params: object to set default values for the slider
    - delay: delay between animations in milliseconds
    - range: object who contains the range values
        - min: The minimal value for the range. If not set, minimum limit will be use. Must be set for WMS layers
        - max: The maximum value for the range. If not set, maximum limit will be use. Must be set for WMS layers
    - limit:
        - min: The minimal value for the limit. Must be set for WMS layers. If not set, layer min and max value will be use.
        - max: The maximum value for the limit. Must be set for WMS layers.  If not set, layer min and max value will be use.
    - type: type of slider (date or number). If date is selected, range and limit must be in milliseconds.
- layers: array of layers to use inside the slider
    - id: layer id as define in layer section
    - field: field name of the field to use to filter with the range slider. It must be the field name, not the alias.

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
Author and maintainers [NRCan FGP - Johann Levesque](https://github.com/jolevesq)

To report issue, please create an issue from the [GitHub repository](https://github.com/fgpv-vpgf/contributed-plugins/issues). Add the plugin-range-slider label and any other applicable one.

## RAMP version
Developed with RAMP version 3.2