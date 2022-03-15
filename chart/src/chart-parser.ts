
import { Observable, BehaviorSubject } from 'rxjs';

const _ = require('lodash');

/**
 * Class to parse value from different type
 * @exports
 * @class ChartParser
 */
export class ChartParser {
    static _chartAttrs = [];
    private static _nbFeats = 0;

    // observable to detect charts array modification
    static _charts: BehaviorSubject<object> = new BehaviorSubject<object>({});
    static getCharts(): Observable<object> {
        return this._charts.asObservable();
    }
    private static setCharts(newValue: object): void {
        this._charts.next(newValue);
    }

    /**
     * Reset the chart control because another feature has been clicked
     */
    static resetChart(): void {
        // reinit the select options
        ChartParser.setCharts({});
        ChartParser._chartAttrs = [];
        ChartParser._nbFeats = 0;
    }

    /**
     * Process the feature click event to gat the data
     * @function processClick
     * @param {Any} config the plugin configuration 
     * @param {Any} feature the clicked feature
     */
    static processClick(config: any, feature: any): void {
        // get config for the layer
        // TODO: test for multiple layer to see if it works.... Do we support?
        const layerConfig = ChartParser.getLayerConfig(config, feature.layerId);

        // if it is a link table who hold the data, get attrs
        // ! link table only work for line chart at the moment...
        if (layerConfig.type === 'link') {
            new Promise(resolve => {
                // get the value to look for in the linked table
                const field = feature.data.find((val: any) => val.field === layerConfig.linkField);
                const wrap = (field.type === 'esriFieldTypeString') ? '\'' : '';

                // query the table and manage ' character in field value
                $.ajax({
                    url: `${layerConfig.linkUrl}/query?where=${layerConfig.data[0].link}=${wrap}${field.value.replaceAll("'", "''")}${wrap}&outFields=*&orderByFields=${layerConfig.data[0].date}&f=json`,
                    cache: false,
                    dataType: 'jsonp',
                    success: data => resolve(data)
                });
            }).then((data: any) => {
                const fieldType = layerConfig.data[0].linkType;

                if (fieldType === 'single') {
                    // loop trough all the data object for this layer and add the info
                    for (let [index, dataset] of config.layers[0].data.entries()) {
                        feature = ChartParser.processSingleLinkedData(config, feature, data, index, undefined);
                    }
                } else if (fieldType === 'multi') {
                    feature = ChartParser.processMultipleLinkedData(config, feature, data);
                }

                const nameField = ChartParser.getSelectValue(feature, layerConfig.nameField);
                ChartParser.populateSelect(config.type, config, feature, nameField);
            });
        } else {
            const nameField = ChartParser.getSelectValue(feature, layerConfig.nameField);
            ChartParser.populateSelect(config.type, config, feature, nameField);
        }
    }

    /**
     * Process link data when a field contains different elements to split into his own element
     * @function processMultipleLinkedData
     * @param {Any} config the plugin config
     * @param {Any} feature the clicked feature
     * @param {Any} data the related data from the link
     * @preturn {Any} feature the updated feature
     */
    private static processMultipleLinkedData(config: any, feature: any, data: any): any {
        // extract values to use to create datasets
        let arrValues = [];
        for(let feature of data.features) {
            arrValues.push(feature.attributes[config.layers[0].data[0].values]);
        }
        arrValues = _.uniqBy(arrValues);

        // get configuration for the layer
        const layerConfig = ChartParser.getLayerConfig(config, feature.layerId);

        // for each of the value, mimic a dataset structure in the configuration file and structure the feature data.
        for (let value of arrValues) {
            layerConfig.data.push({
                'type': 'combine',
                'measure': value,
                'values': value,
                'date': layerConfig.data[0].date,
                'label': {
                    'type': 'config',
                    'values': value,
                    'split': ''
                },
                'regex': '\\(|\\),\\(|\\)',
                'split': ',',
                'prefix': layerConfig.data[0].prefix,
                'suffix': layerConfig.data[0].suffix
            });

            feature = ChartParser.processSingleLinkedData(config, feature, data, 0, value);
        }

        // remove first item (related to feature configuration) then replace the config for this layer
        // TODO: if we support more then one layer, replace better
        layerConfig.data.shift();
        config.layers[0] = layerConfig;

        return feature;
    }

    /**
     * Process linked table data. Add a new field to the feature who mimic
     * the format needed with the value from the data linked table
     * @function processSingleLinkedData
     * @param {Any} config the plugin config
     * @param {Any} feature the clicked feature
     * @param {Any} data the related data from the link table
     * @param {Number} index index of data object 
     * @param {String} attrValue optional attribute value to parse info inside linked data array
     * @preturn {Any} feature the updated feature
     */
    private static processSingleLinkedData(config: any, feature: any, data: any, index: number = 0, attrValue?: string): any {
        const layerConfig = ChartParser.getLayerConfig(config, feature.layerId);
        const values = [];

        data.features.forEach((feat: any) => {
            if (typeof attrValue === 'undefined' || attrValue === feat.attributes[layerConfig.data[index].values]) {
                values.push(`(${new Date(feat.attributes[layerConfig.data[index].date]).toJSON()},${feat.attributes[layerConfig.data[index].measure]})`);
            }
        });

        const measureField = (typeof attrValue === 'undefined')? layerConfig.data[index].measure : attrValue;
        feature.data.push({
            key: measureField,
            value: values.join(','),
            field: measureField,
            type: 'ersiFieldTypeString'
        });

        return feature;
    }

    /**
     * Get the value layers config section for the specified layer
     * @param {Any} config the configuration
     * @param {String} layerId the layer id to find
     * @returns {Any} the layer's configuration
     */
    private static getLayerConfig(config: any, layerId: string): any {
        return config.layers.find((i: any) => i.id === layerId);
    }

    /**
     * Get the value to add to the selector control
     * @function getSelectValue
     * @param {Any} feature the feature to get na field value from
     * @param {String}nameField the field who holds the name
     * @returns {String} the value
     */
    private static getSelectValue(feature, nameField): string {
        return feature.data.find((val: any) => val.field === nameField).value;
    }

    /**
     * Populate the selector control, the control will launch the chart creation
     * @function populateSelect
     * @param {String} chartType the type of chart (pie, bar, line)
     * @param {Any} layerConfig the plugin config for the layer
     * @param {Any} feature the clicked feature
     * @param {String} nameField the name to add to the selector
     */
    private static populateSelect(chartType: string, config: any, feature: any, nameField: string): void {
        // set the item to add to the selector
        const tempObj = {};
        tempObj[this._nbFeats] = nameField;

        // add the attributes to array of chart attributes then add the new value to the selector control
        ChartParser._chartAttrs.push({ index: Object.keys(tempObj)[0], key: tempObj[Object.keys(tempObj)[0]], chartType, feature, config});
        ChartParser._nbFeats++;
        ChartParser.setCharts(tempObj);
    }

    /**
     * Populate the label selector control, the control will launch the chart creation
     * @function populateSelectLabel
     * @param {String} selectedChart selected chart from combo.
     * @param {Any} self current object.
     */
    static populateLabelSelect(selectedChart: string, self: any): void {
        const item = this.getItem(selectedChart);
        if (item.chartType === 'line') {
            const labelArrayLength = self.selectedLabel.length;
            // setting all default lables at first load or when there is no selection.
            item.config.layers[0].data = item.config.layers[0].data
                .map((obj, i) => {
                    let key = this.ascii(obj.measure);
                    if (labelArrayLength === 0 || item.config.layers[0].data.length === 1) {
                        self.selectedLabel.push(key);
                        self.selectedSingleLabel = key;
                    }
                    return ({ ...obj, key: key });
                });
            self.labels = JSON.parse(JSON.stringify(item.config.layers[0].data));
        }
    }

    static getItem(selectedChart: string): any {
        const item = ChartParser._chartAttrs.find((val: any) => val.index === selectedChart);
        item.config.layers[0].data = item.config.layers[0].data.sort((a, b) => (a.measure > b.measure) ? 1 : -1);
        return item;
    }

    static ascii(content: string) {
        return [...content].map(char => char.charCodeAt(0)).reduce((current, previous, i) => previous + current + i);
    }
}