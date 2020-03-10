# chart
This plugin let you creates a chart from feature attributes when a user click on it. It is based on [Chart.js](https://www.chartjs.org/) open source librairy.

[Demo page](https://jolevesq.github.io/contributed-plugins/chart/samples/chart-index.html)

## How to use the plugin
Inside your configuration file you need
```
"plugins": {
    "chart": {
        "type": "bar",
        "title": "My Custom Tilte",
        "labelsLine": {
          "xAxis": {
            "type": "field",
            "title": "My categories",
            "values": "label",
            "split": ";"
          },
          "yAxis": {
            "type": "linear",
            "title": "My values",
            "values": "",
            "split": ""
          }
        },
        "options": {
          "colors": "",
          "cutOut": 0
        },
        "layers": [{
            "id": "0",
            "data": [{
              "type": "single",
              "measure": "data",
              "label": {
                "type": "field",
                "values": "label",
                "split": ";"
              },
              "regex": "\\[|\\];\\[|\\]",
              "split": ";",
              "prefix": "Custom",
              "suffix": "Color"
            }]
        }]
    }
}
```

Configuration parameters
- type: chart type to create (pie, bar or line)
- title: chart title
- labelsLine: object to how labels for line graphics will be generate (xAxis and yAxis). Only for bar and line chart.
  - type: type of labels, field to get them from data or linear to interpolate them from data
  - title: title os the axis
  - values: name field to get the labels (only for type field)
  - split: character to use to split the labels (only for type field)
options: chart options
  - colors: array of hexadecimal color value to use to display the chart
  - cutOut: percentage to cut for the hole in pie chart
layers: array of layers to use to create chart
  - id: layer id as define in layer section
  - data: array of datasets for this layer to use to create the chart
    - type: "single" if there is only one value inside the field or "combine" if we use time axis and time and value are part of the field
    - measure: field name to use for the measute to create the chart. It must be the field name, not the alias.
    - label: object to customize the label creation
      - type: how to etreive the labels from (field or config)
      - values: config = string of values to use separated by semi colon (e.g "lbl1;lbl2;lbl3") or field = field name
      - split: character to use to split list of values when type = field
    - regex: regex value to split dataset inside the field. (e.g. '\\\\[|\\\\];\\\\[|\\\\]' for '[255;255;255];[120;232;23]'. There is 2 different values [];[]). We strongly recommand using a regex validator with your data to test your expression.
    - split: character to use to slit values inside a field (e.g. "val1*val2*val3" will use * as split character)
    - prefix: string prefix to add to data hover
    - suffix: string suffix to add to data hover


Inside your html, add this to your head section then replace href and src with your path.
```
<link rel="stylesheet" href="/chart.css" />
<script src="/chart.js"></script>
```

## Test page
To play with the code, from the plugin folder, do npm install, run build then npm run serve.
- http://localhost:6001/samples/chart-index.html

To deploy a test page, do npm run build then npm run deploy. The page will be created at
- https://"Your GitHub UserName".github.io/contributed-plugins/chart/samples/chart-index.html

## Author and support
Author and maintainer [NRCan FGP - Johann Levesque](https://github.com/jolevesq)

To report issue, please create an issue from the [GitHub repository](https://github.com/fgpv-vpgf/contributed-plugins/issues). Add the plugin-chart label and any other applicable one.

## RAMP version
Developed with RAMP version 3.2