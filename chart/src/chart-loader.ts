import { ChartPie } from './chart-pie';
import { ChartBar } from './chart-bar';
import { ChartLine } from './chart-line';

import { CANVAS_TEMPLATE } from './template';

import * as chartjs from 'chart.js';
import * as nouislider from 'nouislider';
import { tr } from 'date-fns/locale';

/**
 * Creates and manages charts.
 * @exports
 * @class ChartLoader
 */
export class ChartLoader {
    private _chart: chartjs;
    private _mapApi: any;
    private _panel: any;
    private _sliderX: any;
    private _sliderY: any;
    private _xType: string;
    private _yType: string;
    private _xRange: any = { min: -1, max: -1 };
    private _yRange: any = { min: -1, max: -1 };

    private _lineChartOptions: ChartLine;
    private _barChartOptions: ChartBar;
    private _pieChartOptions: ChartPie;

    static defaultColors: string[] = [
        '#e6194b',
        '#3cb44b',
        '#4363d8',
        '#ffe119',
        '#f58231',
        '#911eb4',
        '#46f0f0',
        '#f032e6',
        '#bcf60c',
        '#fabebe',
        '#008080',
        '#e6beff',
        '#9a6324',
        '#b0ad8d',
        '#800000',
        '#aaffc3',
        '#b0b000',
        '#ffd8b1',
        '#02025e',
        '#808080',
        '#a1d1e3',
        '#000000'
    ];

    /**
     * Chart loader constructor
     * @constructor
     * @param {Any} mapApi the viewer api
     */
    constructor(mapApi: any) {
        this._mapApi = mapApi;
        this._panel = this._mapApi.panels.getById('chart');
    }

    /**
     * Initialize the slider
     * @function initSlider
     * @param {Any} slider slider div
     * @param {Number} min minimum value for slider
     * @param {Number} max maximum value for slider
     * @param {String} xType the x axis type, date or linear
     * @param {String} language the viewer language
     * @param {Number} length the length of linear value
     * @param {isDateTimeObjForXAxis} to differntiate the date and dateTimeObj
     */
    initSlider(slider: any, min: number, max: number, type: string, language: string, length: number, isDateTimeObjForXAxis: boolean = false) {
        const delta = Math.abs(max - min);

        // create the step
        const step = 1 / (Math.pow(10, length));

        // create a slider only if there is thing to slide.
        if (delta > 0) {
            nouislider.create(slider,
                {
                    start: [min, max],
                    behaviour: 'drag-tap',
                    connect: true,
                    snap: false,
                    tooltips: this.setTooltips(type, language, length, isDateTimeObjForXAxis),
                    range: { min: min, max: max },
                    orientation: (slider.id.slice(-1) === 'X') ? 'horizontal' : 'vertical',
                    direction: (slider.id.slice(-1) === 'X') ? 'ltr' : 'rtl',
                    step: (slider.id.slice(-1) === 'X') ? !isDateTimeObjForXAxis ? 86400000 : 900000 : step, // if x axis, step by 86400000 (24 hours) // 900000 (15 mins)
                    pips: {
                        mode: 'positions',
                        values: [0, 25, 50, 75, 100],
                        density: 3,
                        format: {
                            to: (value: number) => { return this.formatPips(value, type, language, length, isDateTimeObjForXAxis, false); },
                            from: Number
                        }
                    }
                });

            // parse the pips labels
            this.setSliderRanges(slider.id.slice(-1), type, min, max);

            // trap the on change event when user use handles
            let that = this;
            slider.noUiSlider.on('set.one', function (valuesString: string[], temp: number, valuesNum: number[]) {
                ;
                // set min and max from the slider values
                let min: any = valuesNum[0];
                let max: any = valuesNum[1];

                const axis = (this.options.orientation === 'horizontal') ? 'x' : 'y';
                const type = (axis === 'x') ? (<any>that)._xType : (<any>that)._yType;

                // parse the pips labels
                that.setSliderRanges(axis, type, min, max);

                // loop trought datasets to filter the data
                for (let [i, dataset] of that._chart.data.datasets.entries()) {
                    dataset.data = that.parseDatasetsRange((<any>that)._xRange, (<any>that)._yRange, that._lineChartOptions.datasets[i]);
                }

                // update the chart
                that._chart.update();
            });

            // add handles to focus cycle
            $('.noUi-handle-lower').attr('tabindex', '-2');
            $('.noUi-handle-upper').attr('tabindex', '-2');
        }
    }

    /**
     * Set pips (slider labels) format
     * @function formatPips
     * @param {Any} value the value to display (number, string or date)
     * @param {String} type the pips type (date or linear)
     * @param {String} lang the language to use
     * @param {Number} length the length of linear pips
     * @return {any} value the formated value
     */
    formatPips(value: any, type: string, lang: string, length: number, isDateTimeObjForXAxis: boolean = false, isCallForTooltip: boolean): any {

        if (type === 'linear') {
            value = value.toFixed(length);
        } else if (type === 'date') {
            let date = new Date(value);

            if (!isDateTimeObjForXAxis || !isCallForTooltip) {
                value = `${date.getFullYear()}-${this.prependZero(date.getMonth() + 1)}-${this.prependZero(date.getDate())}`;
            }
            else {
                value = `${date.getFullYear()}-${this.prependZero(date.getMonth() + 1)}-${this.prependZero(date.getDate())} ${this.prependZero(date.getHours())}:${this.prependZero(date.getMinutes())}`;
            }
        }

        return value;
    }

    prependZero(n: number): string{
        return ("0" + n).slice(-2)
    }

    /**
     * Format tooltips
     * @function setTooltips
     * @param {string} type type of tooltips (will be pass to format pips function) 
     * @param {string} language the viewer language
     * @param {Number} length the length of tooltips
     * @return {Object[]} tooltips as an array of tooltip object
     */
    setTooltips(type: string, language: string, length: number, isDateTimeObjForXAxis: boolean = false): object[] {
    const tooltips = [{ to: (value: number) => this.formatPips(value, type, language, length, isDateTimeObjForXAxis, true), from: Number }]
    tooltips.push({ to: (value: number) => this.formatPips(value, type, language, length, isDateTimeObjForXAxis, true), from: Number })

        return tooltips;
    }

    /**
     * Parse the graph pips labels value and set slider range
     * @function parsePips
     * @param {String} axis axis to parse labels for (x or y)
     * @param {Date} type the type of axis (linear or date)
     * @param {Any} min min range to parse the value
     * @param {Any} max max range to parse the value
     */
    setSliderRanges(axis: string, type: string, min: any, max: any) {
        let range = (axis.toLowerCase() === 'x') ? this._xRange : this._yRange;
        if (axis.toLowerCase() === 'x') {
            this._xType = type;
        } else {
            this._yType = type;
        }
        range.min = (type === 'date') ? new Date(min) : min;
        range.max = (type === 'date') ? new Date(max) : max;
    }

    /**
     * Parse the graph value with the range from the slider
     * @function parseDatasetsRange
     * @param {Any} xRange x range values to filter
     * @param {Any} yRange y range values to filter
     * @param {Any} data data to filter
     */
    parseDatasetsRange(xRange: any, yRange: any, data: any): object[] {
        const parsed = [];

        for (let value of data) {
            let x = (typeof value.x === 'string') ? parseFloat(value.x) : value.x;
            let y = (typeof value.y === 'string') ? parseFloat(value.y) : value.y;
            if (x >= xRange.min && x <= xRange.max && y >= yRange.min && y <= yRange.max || isNaN(y) && x >= xRange.min && x <= xRange.max) { parsed.push(value); }
        }

        return parsed;
    }

    /**
     * Destroy the slider and chart
     * @function destroy
     */
    destroy() {
        this.destroyChart();
        this.destroySlider();

        this._panel.body.find('.rv-chart-nodata').css('display', 'none');
    }

    /**
     * Destroy the slider
     * @function destroySlider
     */
    private destroySlider() {
        if (typeof this._sliderX !== 'undefined' && this._sliderX.noUiSlider) { this._sliderX.noUiSlider.destroy(); }
        if (typeof this._sliderY !== 'undefined' && this._sliderY.noUiSlider) { this._sliderY.noUiSlider.destroy(); }
    }

    /**
     * Destroy the chart
     * @function destroyChart
     */
    private destroyChart() {
        // we need to also remove the canvas because if not, data is still on canvas
        if (this._chart) {
            this._panel.body.find('#rvChart').remove();
            this._panel.body.find('.rv-chart-canvas').prepend(CANVAS_TEMPLATE);
            this._chart.destroy();
        }
    }

    /**
     * Create pie chart
     * @function createPieChart
     * @param {Object} attrs attributes to use for the graph
     * @param {Any} config the configuration for the chart
     */
    createPieChart(attrs: object, config: any) {
        this.destroy();
        this._pieChartOptions = new ChartPie(config, attrs);
        this.draw(this._pieChartOptions);
    }

    /**
     * Create bar chart
     * @function createBarChart
     * @param {Object} attrs attributes to use for the graph
     * @param {Any} config the configuration for the chart
     */
    createBarChart(attrs: object, config: any) {
        this.destroy();
        this._barChartOptions = new ChartBar(config, attrs);
        this.draw(this._barChartOptions);
    }

    /**
     * Create line chart
     * @function createLineChart
     * @param {Object} attrs attributes to use for the graph
     * @param {Any} config the configuration for the chart
     */
    createLineChart(attrs: object, config: any) {
        this.destroy();

        this._lineChartOptions = new ChartLine(config, attrs);

        // check if there is data for the graph.... if not remove dataset so the draw will show no avialable info
        if (this._lineChartOptions.data.datasets.length !== 0 && this._lineChartOptions.data.datasets[0].data.length === 0) {
            this._lineChartOptions.data.datasets.splice(0, this._lineChartOptions.data.datasets.length);
            this.draw(this._lineChartOptions);
        } else {
            this.draw(this._lineChartOptions);

            // if it is a line chart, we assume they use date as x values so we add a date slider
            if (this._lineChartOptions.datasets.length !== 0 && (config.axis.xAxis.type === 'date' || config.axis.xAxis.type === 'linear')) {
                this._sliderX = document.getElementById('nouisliderX');
                const rangeX = this._lineChartOptions.rangeX;

                if (config.axis.xAxis.type === 'date') {
                    rangeX.min = rangeX.min.getTime();
                    rangeX.max = rangeX.max.getTime()
                }
                this.initSlider(this._sliderX, rangeX.min, rangeX.max, config.axis.xAxis.type, config.language, 0, this._lineChartOptions.isDateTimeObjForXAxis);

                // get number of decimal for step and pips
                const countDecimals = (values: any) => {
                    let numZero = 0;

                    values.forEach((value) => {
                        let val = parseFloat(value.y);
                        if (Math.floor(val) !== val && !(isNaN(val)))
                            numZero = val.toString().split('.')[1].length > numZero ? val.toString().split('.')[1].length : numZero;
                    });

                    return numZero;
                }
                const numZeroMax = typeof config.axis.yAxis.precision !== 'undefined' ? config.axis.yAxis.precision
                    : countDecimals(this._lineChartOptions.datasets[0]);

                this._sliderY = document.getElementById('nouisliderY');
                const rangeY = this._lineChartOptions.rangeY;
                this.initSlider(this._sliderY, rangeY.min, rangeY.max, config.axis.yAxis.type, config.language, numZeroMax);
            }
        }
    }

    /**
     * Draw the chart
     * @function draw
     * @param {Any} opts the chart options
     */
    draw(opts: any): void {
        if (opts.data.datasets.length !== 0) {
            // extend chart options with global ones then create
            const extendOptions = {
                ...opts.options,
                ...this.getGlobalOptions(opts.type, typeof (opts.isDateTimeObjForXAxis) !== 'undefined' ? opts.isDateTimeObjForXAxis : false)
            };
            this._chart = new chartjs('rvChart', { type: opts.type, data: opts.data, options: extendOptions });
        } else {
            this._panel.body.find('.rv-chart-nodata').css('display', 'block');
        }
    }

    /**
     * Get global options fot all charts
     * @function getGlobalOptions
     * @return {Object} the global options
     */
    private getGlobalOptions(chartType: string, isDateTimeObjForXAxis: boolean): object {
        return {
            maintainAspectRatio: false,
            responsive: true,
            responsiveAnimationDuration: 1000,
            animation: {
                duration: 1000,
                animateRotate: true,
                animateScale: true
            },
            title: {
                display: false
            },
            layout: {
                padding: {
                    right: 12
                }
            },
            legend: {
                labels: {
                    fontColor: '#676767',
                    fontSize: 14
                },
                onHover: () => { if (chartType !== 'line') this._panel.body.find('.rv-chart-hidedata-tooltip').css('display', 'block'); },
                onLeave: () => { this._panel.body.find('.rv-chart-hidedata-tooltip').css('display', 'none'); },
                ...chartType === 'line' ? { onClick: (e) => { return false; } } : {}
            },
            showLines: true,
            elements: {
                point: {
                    radius: 1,
                    hoverRadius: 10,
                    hitRadius: 5000 // to make the hover/tooltip work as one item from each dataset some tweaking needs to be done. This need to be very high to contain the whole graph
                },
                line: {
                    spanGaps: false,
                    tension: 0.10,
                    fill: false,
                    borderWidth: 1
                }
            },
            hover: {
                mode: 'nearest',
                intersect: true,
                axis: 'x' // this need to be set to select all values to a specified x
            },
            tooltips: {
                titleFontSize: 14,
                bodyFontSize: 14,
                position: 'average',
                caretPadding: 10,
                intersect: true,
                mode: 'nearest',
                axis: 'x', // this need to be set to select all values to a specified x
                callbacks: {
                    title: (tooltipItem: any): string => {
                        if (!isDateTimeObjForXAxis)
                            return tooltipItem[0].label.split(',').filter((item: any, index: any) => index < 2).join(', ');
                        else
                            return tooltipItem[0].label;
                    },
                    label: (tooltipItem: any, data: any): string => {
                        const item = data.datasets[tooltipItem.datasetIndex];
                        const temp = item.data[tooltipItem.index];

                        // for line and chart, use item.label, pie and doughnut use array of labels
                        const label = item.label !== '' ? item.label : data.labels[tooltipItem.index];

                        // for line chart with time, value is an object, get the value
                        const value = typeof temp !== 'object' ? temp : temp.y;

                        return `${item.prefix} ${label}: ${value} ${item.suffix}`;
                    }
                }
            },
            tooltipEvents: ['mousemove', 'touchstart', 'touchmove', 'click']
        }
    }

    /**
     * Parse feature datasets
     * @function parse
     * @param {Any} config the configuration
     * @param {Any} attrs the feature attributes
     * @param {String[]} colors the array of colors to use
     * @param {String} xType the x axis type, date or linear
     * @return {Object} the parse datasets
     */
    static parse(config: any, attrs: any, colors: string[] = [], xType?: string): { datasets: any[] } {
        const parsed = { datasets: [], isDateTimeObjForXAxis: false };

        // TODO: work around for CFS do not keep as is for production
        const parseDate = function (dateString: string): Date {
            // check date to add month and day if not present. At the same time add dashes if missing
            if (dateString.length === 4) { dateString = `${dateString}-01-01`; }
            else if (dateString.length === 5) { dateString = `${dateString.substring(0, 4)}-0${dateString.substring(4, 6)}`; }
            else if (dateString.length === 6 && dateString.indexOf('-') === -1) { dateString = `${dateString.substring(0, 4)}-${dateString.substring(4, 6)}`; }
            else if (dateString.length === 6 && dateString.indexOf('-') !== -1) { dateString = `${dateString.substring(0, 5)}0${dateString.substring(5, 6)}`; }
            else if (dateString.length === 7 && dateString.indexOf('-') === -1) { dateString = `${dateString}-01`; }
            else if (dateString.length === 8 && dateString.indexOf('-') === -1) { dateString = `${dateString.substring(0, 4)}-${dateString.substring(4, 6)}-${dateString.substring(6, 8)}`; }

            return new Date(parsed.isDateTimeObjForXAxis ? dateString : dateString.replace('Z', ''));
        }
        // A new attribute "datatype" is introduced to differentiate single or multifield data. 
        // By default it will be treated as singlefield  
        if (typeof config.datatype === 'undefined' || config.datatype === 'singlefield') {
            // loop trough datasets to add from config
            for (let data of config.data) {
                const fieldData = data.measure;
                const prefix = data.prefix;
                const suffix = data.suffix;
                const values = attrs.data.find(i => i.field === fieldData).value;

                // if regex is provided, it is because there is multiple datasets in the value field
                // only do this for single type where we can have more then 1 dataset by field
                // for combine, there is 2 values by field (x and y). We do not support more then 1 dataset
                let parseValues = (data.regex !== '' && data.type === 'single') ?
                    values.replace(new RegExp(data.regex, 'g'), '*').split('*').filter(Boolean) : [values];

                // loop trough array of data inside a field values, first check if there is data to parse
                if (parseValues[0] !== null) {
                    for (let [i, parse] of parseValues.entries()) {
                        // add values and colors
                        const item: any = {
                            data: [],
                            label: data.label.values !== '' ? this.getLabels(data.label, attrs, i)[i] : '',
                            backgroundColor: colors,
                            suffix: suffix,
                            prefix: prefix
                        };

                        // loop trough values
                        if (data.type === 'single') {
                            parse = parse.toString().split(data.split);
                            for (let value of parse) {
                                item.data.push(value);
                            }
                        } else if (data.type === 'combine') {
                            let parseCombValues = parse.replace(new RegExp(data.regex, 'g'), '*').split('*').filter(Boolean);
                            let numberPattern = /\d+/g;
                            parsed.isDateTimeObjForXAxis = (parseCombValues.filter(q=>{
                                let time: any = parseInt(q.split('T')[1].split(data.split)[0].match(numberPattern).join(''));
                                if (time > 0) {
                                    return true;
                                }
                            })).length > 0;
                            for (let val of parseCombValues) {
                                let splitVal = val.split(data.split);

                                // force time to get the right day or use number
                                let valueParsed = (xType === 'linear') ? splitVal[0] : parseDate(splitVal[0]);
                                item.data.push({ x: valueParsed, y: splitVal[1] });
                            }
                        }

                        parsed.datasets.push(item);
                    }
                }
            }
        }
        else {
            let splitChar;
            let prefix;
            let suffix;
            // data is being filtered based on the config attributes.
            const chartData = attrs.data.filter(i =>
                config.data.some(function (j) {
                    splitChar = j.split;
                    prefix = j.prefix;
                    suffix = j.suffix;
                    return j.measure === i.field;
                })
            ).map(obj => ({ ...obj, splitcount: typeof obj.value !== 'undefined' ? obj.value.split(splitChar).length : 0 }));

            if (chartData.length > 0) {
                const cloneChartData = JSON.parse(JSON.stringify(chartData));
                let len = cloneChartData.sort(function (x, y) {
                    return y.splitcount - x.splitcount;
                })[0].splitcount;

                for (let i = 0; i < len; i++) {
                    const item: any = {
                        data: [],
                        label: '',
                        backgroundColor: colors,
                        suffix: suffix,
                        prefix: prefix,
                        isMultiField: true
                    };
                    for (let j = 0, len = chartData.length; j < len; j++) {
                        if (typeof chartData[j].value !== 'undefined')
                            item.data.push(chartData[j].value.split(splitChar)[i]);
                    }
                    parsed.datasets.push(item);
                }
            }
        }
        return parsed;
    }

    /**
     * Get chart labels
     * @function getLabels
     * @param {Any} config the configuration
     * @param {Any} attrs the feature attributes
     * @param {Number} index the index to start initialize to 0 if not provided
     * @return {String[]} the array of labels
     */
    static getLabels(config: any, attrs: any, index = 0, layersData: any = null): string[] {
        let labels = config.split !== '' ? config.values.split(config.split) : config.values;
        if (config.type === 'field') {
            const field = (labels instanceof Array) ? labels[0] : labels;
            const temp = attrs.data.find((i: any) => i.field === field).value;
            labels = config.split !== '' ? temp.split(config.split) : temp;
        }
        else if (config.type === 'multifield') {

            if (!(labels instanceof Array)) {
                labels = [];
                for (let j = 0, len = layersData.length; j < len; j++) {
                    labels.push(layersData[j].measure);
                }
            }
        }
        // labels needs to be an array, if not create an array of values
        // this mean we need to create an array of index length to make sure
        // to retreive the right value
        if (!Array.isArray(labels)) {
            labels = Array(index + 1).fill(labels);
        }

        return labels;
    }
}

export interface ChartLoader {
    defaultColors: string[];
}