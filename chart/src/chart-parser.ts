
import { Observable, BehaviorSubject } from 'rxjs';

const _ = require('lodash');

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
                $.ajax({
                    url: `${layerConfig.linkUrl}/query?where=${layerConfig.data[0].link}=${wrap}${field.value}${wrap}&outFields=*&f=json`,
                    cache: false,
                    dataType: 'jsonp',
                    success: data => resolve(data)
                });
            }).then((data: any) => {
                const fieldType = layerConfig.data[0].linkType;
                if (fieldType === 'single') {
                    feature = ChartParser.processSingleLinkedData(config, feature, data);
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
            arrValues.push(feature.attributes.VARIABLE_NAME);
        }
        arrValues = _.uniqBy(arrValues);

        // get configuration for the layer
        const layerConfig = ChartParser.getLayerConfig(config, feature.layerId);

        // for each of the value, mimic a dataset structure in the configuration file and structure the feature data.
        for (let value of arrValues) {
            layerConfig.data.push({
                "type": "combine",
                "measure": value,
                "values": value,
                "date": layerConfig.data[0].date,
                "label": {
                  "type": "config",
                  "values": value,
                  "split": ""
                },
                "regex": "\\(|\\),\\(|\\)",
                "split": ",",
                "prefix": layerConfig.data[0].prefix,
                "suffix": layerConfig.data[0].suffix
            });
            
            feature = ChartParser.processSingleLinkedData(config, feature, data, value);
        }

        // remove first item (related to feature configuration) then replace the config for this layer
        // TODO: if we support more then one layer, replace better
        layerConfig.data.shift();
        config.layers[0] = layerConfig;

        return feature;
    }

    /**
     * Process linked table data. Add a new field to the feature who mimic
     * the format needed with the value fomr the data linked table
     * @function processSingleLinkedData
     * @param {Any} config the plugin config
     * @param {Any} feature the clicked feature
     * @param {Any} data the related data from the link table
     * @param {String} attrValue optional attribute value to parse info inside linked data array
     * @preturn {Any} feature the updated feature
     */
    private static processSingleLinkedData(config: any, feature: any, data: any, attrValue?: string): any {
        const layerConfig = ChartParser.getLayerConfig(config, feature.layerId);

        // TODO, loop layerConfig data as well... Or maybe pass the data id and loop this one level higher
        const values = [];
        data.features.forEach((feat: any) => {
            if (typeof attrValue === 'undefined' || attrValue === feat.attributes[layerConfig.data[0].values]) {
                values.push(`(${new Date(feat.attributes[layerConfig.data[0].date]).toJSON().slice(0,10)},${feat.attributes[layerConfig.data[0].measure]})`);
            }
        });

        const measureField = (typeof attrValue === 'undefined')? layerConfig.data[0].measure : attrValue;
        feature.data.push({
            key: measureField,
            value: values.join(','),
            field: measureField,
            type: 'ersiFieldTypeString'
        });

        return feature;
    }

    /**
     * Get the value layers config section f0r the specified layer
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

        // add the attributes to array of chart attributes the add the new value to the selector control
        ChartParser._chartAttrs.push({ index: Object.keys(tempObj)[0], key: tempObj[Object.keys(tempObj)[0]], chartType, feature, config});
        ChartParser._nbFeats++;
        ChartParser.setCharts(tempObj);
    }
}