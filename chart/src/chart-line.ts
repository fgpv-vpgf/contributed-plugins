// import date-fns locale:
import 'chartjs-adapter-date-fns';
import {fr} from 'date-fns/locale';

import { ChartLoader } from './chart-loader';

const _ = require('lodash');

/**
 * Creates line charts.
 * @exports
 * @class ChartLine
 */
export class ChartLine {
    private _data: object[] = [];
    private _rangex: any = {
        min: -1,
        max: -1
    };
    private _rangey: any = {
        min: -1,
        max: -1
    };

    /**
     * Get datasets
     * @property datasets
     * @return {Object} original datasets (not filtered one)
     */
    get datasets(): object[] {
        return this._data;
    }
    /**
     * Get range for x axis
     * @property rangeX
     * @return {Object} the min and max values for the datasets x axis
     */
    get rangeX(): any {
        return this._rangex;
    }
    /**
     * Get range for y axis
     * @property rangeY
     * @return {Object} the min and max values for the datasets y axis
     */
    get rangeY(): any {
        return this._rangey;
    }

    /**
     * Chart bar constructor
     * @constructor
     * @param {Any} config the chart configuration
     * @param {Object} attrs the feature attributes
     */
    constructor(config: any, attrs: object) {
        // set chart options
        this.title = config.title;
        this.type = config.type;
        this.language = config.language;
        this.options = {
            scales: {
                xAxes: [],
                yAxes: []
            }
        };

        // set data options
        const colors = config.layers[0].data.map((obj, i) => {
            return obj.color
        });
        const layerData = config.layers.find(i => i.id === (<any>attrs).layerId);
        // This variable "isDateTimeObjForXAxis" is used to differentiate the date and datetime object.
        // So if we are getting a data from service which is only delivering the date object without time
        // then this variable will get a false value. On contrary, if the data from service is getting 
        // datetime object then it will provide the true value. and this value is being used to set the step
        // in the slider. if date time then 15 mins and if a date only then 24 hours is the step.
        // Same object is being used to conditionally display the date time or date in the tool tip on chart. 
        this.isDateTimeObjForXAxis = this.setData(layerData, attrs, colors, config.axis.xAxis.type);

        // set labels options
        this.options.scales.xAxes.push(this.setAxis('xAxes', config.axis.xAxis, attrs));
        this.options.scales.yAxes.push(this.setAxis('yAxes', config.axis.yAxis, attrs));
    }

    /**
     * Set the chart data
     * @function setData
     * @param {Object} layerData the layer data provided by configuration
     * @param {Object} attrs the feature attributes
     * @param {String[]} colors the array of colors to use
     * @param {String} xType the x axis type, date or linear
     */
    setData(layerData: object, attrs: object, colors: string[], xType: string): { isDateTimeObjForXAxis: boolean } {
        // get data for the graph and keep a copy for line chart with time
        // we have a slider to refine the graph by years
        this.data = ChartLoader.parse(layerData, attrs, colors, xType);
        const  datasets = this.data.datasets
        this.data.datasets = _.orderBy(datasets, ['label'], ['asc'])
        // for each dataset, set options
        for (let [i, dataset] of this.data.datasets.entries()) {
             // convert data to number
            for (let [j, item] of dataset.data.entries()) {
                dataset.data[j].y = parseFloat(item.y);
            }

            // set line style
            dataset.backgroundColor = `${colors[i]}80`;
            dataset.borderColor = colors[i];
            dataset.borderWidth = 2;

            // keep the original value so we can use a slider to refine
            // use lodash to deep clone the object so we dont mess the original object
            this._data.push(_.cloneDeep(dataset.data));
            this.setRanges(dataset, 'x');
            this.setRanges(dataset, 'y');
        }
        return this.data.isDateTimeObjForXAxis;
    }

    /**
     * Set ranges min and max for the dataset specified axis
     * @function setRanges
     * @param {Object[]} dataset the layer dataset to specify the range
     * @param {String} axis the axis to specify the range (x or y)
     */
    setRanges(dataset: object[], axis: string) {
        // set ranges for the datasets to use with the slider for x axis
        const range = (axis === 'x') ? this._rangex : this._rangey;
        let minVal = _.min((<any>dataset).data.map((rec) => { return rec[axis] }));
        let maxVal = _.max((<any>dataset).data.map((rec) => { return rec[axis] }));
        minVal = (typeof minVal === 'string') ? parseFloat(minVal) : minVal;
        maxVal =(typeof maxVal === 'string') ? parseFloat(maxVal) : maxVal;

        if (range.min === -1 || range.min >= minVal) { range.min = minVal; }
        if (range.max === -1 || range.max <= maxVal) { range.max = maxVal; }
    }

    /**
     * Set the chart axis
     * @function setAxis
     * @param {String} axe the axis to set (xAxes or yAxes)
     * @param {Any} config the chart configuration
     * @param {Object} attrs the feature attributes
     * @return {Object} the axis object
     */
    setAxis(axe: string, config: any, attrs: object): { [k: string]: any } {
        let optsAxe: { [k: string]: any } = {};

        if (config.type === 'field' || config.type === 'config') {
            // get values from the configuration or field because it is a category axe
            const ticks = ChartLoader.getLabels(config, attrs);

            optsAxe.type = 'category';
            optsAxe.labels = ticks;
        } else if (config.type === 'linear') {
            optsAxe.type = 'linear';
        } else if (config.type === 'date') {
            optsAxe.type = 'time';
            optsAxe.distribution = 'linear'; // TODO: sometime linear is better, sometimes series. Add a switcher...
            optsAxe.time ={
                minUnit: 'day'
            };
            // scale options language if French
            if (this.language === 'fr-CA') {
                optsAxe.adapters = {
                    date: {
                        locale: fr
                    }
                };
            }
        }

        // axe ticks
        optsAxe.ticks = {
            autoSkip: true,
            autoSkipPadding: 100,
            fontSize: 14,
            fontColor: '#676767'
        }

        // axe gridlines display
        if (axe === 'xAxes') {
            optsAxe.gridLines = {
                display: true,
                drawTicks: true,
                drawBorder: false,
                drawOnChartArea: false
            };
        }

        // axe title
        optsAxe.scaleLabel = {
            display: true,
            labelString: config.title,
            fontSize: 14,
            fontColor: '#676767'
        };

        return optsAxe;
    }
}

export interface ChartLine {
    options: any;
    type: string;
    data: any;
    title: string;
    language: string;
    ranges: any;
    isDateTimeObjForXAxis: any;
}