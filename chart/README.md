# chart
This plugin let you creates a chart from feature attributes when a user click on it. It is based on [Chart.js](https://www.chartjs.org/) open source librairy.
It works with ESRI layer dynamic or Feature. It also works with file layer type like CSV or GeoJSON when they are served from a server.

To give an idea, you can have a layer with these 2 fields (data and label). Each feature can have is own set of values an labels like this:<br/>
data = 92;43.54;12.3;66;75<br/>
label = Red;Green;Blue;Yellow;Orange<br/>
These values will display a pie or bar chart with 5 categories (Red, Green, Blue, Yellow and Orange)<br/>

You can have more then one dataset by feature for bar or line chart like this:<br/>
data1 = 34;45;65<br/>
data2 = 12;54;23<br/>
label = First;Second<br/>
These values will display a bar chart with 2 categories (First and Second) with 2 sets of values for each. Labels can be part of the layer and this is especially
useful when labels are different from one feature to another. If they are the same, they can be set inside the configuration for the chart.

You can have a line chart with date as x axis like this:<br/>
Measure1 = (2011-03-16,0.01),(2011-03-21,2.49),(2011-03-28,0.54),(2011-04-01,0.16),(2011-04-11,0.14),(2011-04-18,0.05)<br/>
Measure2 = (2011-03-21,0.173),(2011-03-28,0.069),(2011-04-01,0.023),(2011-04-11,0.080),(2011-04-18,0.030),(2011-04-26,0.005)<br/>
Each couple of values (yyyy-mm-dd,data) is a point on the line chart with the date as the x value and the data as the y value. This sample will display a line chart with 2 lines.

You can also have a customized details panel to show useful data. It can take links, images, data from the the feature. It is based on the Markdown notation and uses<br/>
[Showdown](https://github.com/showdownjs/showdown) library to parse the markdown from the configuration file to the details panel. To use the value of a field from the feature,
use the field name wrapped inside {{}} (e.g. {{label}}).<br/>
<br/>
[Demo page](https://jolevesq.github.io/contributed-plugins/chart/samples/chart-index.html)

## How to use the plugin
Inside your configuration file you need
```
"plugins": {
    "chart": {
        "type": "bar",
        "title": "My Custom Tilte",
        "axis": {
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
            "nameField": "myField",
            "type": "link",
            "linkUrl": "https://...",
            "linkField": "linkField",
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
            }],
            "details": {
              "enabled": true,
              "value": "## What a nice pie chart\n**Useful data listed below**\n * Label field value: {{label}}\n * Data: {{data}}\n\n\n![sd-logo](https://raw.githubusercontent.com/showdownjs/logo/master/dist/logo.readme.png 'sd logo')\n\n[Get Showdown!](https://github.com/showdownjs/showdown)"
            }
        }]
    }
}
```

Configuration parameters
- type: chart type to create (pie, bar or line)
- title: chart title
- axis: object to handle how labels and slider (line) will be generate (xAxis and yAxis). Only for bar and line chart.
  - type: type of labels, from a field or configuration for bar chart or from values (linear or date in yyyy-mm-dd format) for line chart.
  - title: title of the axis
  - values: name field to get the labels (only for type field)
  - split: character to use to split the labels (only for type field)
options: chart options
  - colors: array of hexadecimal color values to use to display the chart
  - cutOut: percentage to cut for the hole in a pie chart
layers: array of layers to use to create chart
  - id: layer id as define in layer section.
  - nameField: the field use to set the value in the selector (when multiple features creates each one a chart).
  - type: the type of info (inline for items inside the layer or link for items inside a link table).
  - linkUrl: url of the link table (only needed for type link).
  - linkField: the field name for the link between the layer and the table (only needed for type link).
  - data: array of datasets for this layer to use to create the chart
    - type: "single" if there is only one value inside the field, "combine" if we use date axis and date and value are part of the field. For linked table, it needs to be "combine".
    - measure: field name to use for the measure to create the chart. It must be the field name, not the alias.
    - linkType: how data is structure inside the link table (single for one field for value and one for date OR multi if there is multiple datasets inside one field and the chart needs to parse)
    - link: link field to link between layer and table
    - date: data field
    - label: object to customize the label creation
      - type: how to retreive the labels from (field or config)
      - values: config = string of values to use separated by semi colon (e.g "lbl1;lbl2;lbl3") or field = field name
      - split: character to use to split list of values when type = field
    - regex: regex value to split dataset inside the field. (e.g. '\\\\[|\\\\];\\\\[|\\\\]' for '[255;255;255];[120;232;23]'. There is 2 different values [];[]). We strongly recommand using a regex validator with your data to test your expression.
    - split: character to use to slit values inside a field (e.g. "val1:val2:val3" will use : as split character)
    - prefix: string prefix to add to data hover
    - suffix: string suffix to add to data hover
  - details: object to handle details panel customization
    - enabled: boolean to specify if the details panel should be customize for this layer
    - value: string with the custom details in markdown notation


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
