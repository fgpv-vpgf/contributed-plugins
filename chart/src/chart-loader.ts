import { ChartPie } from './chart-pie';
import { ChartBar } from './chart-bar';

import * as chartjs from 'chart.js';
import * as nouislider from 'nouislider';

/**
 * Creates and manages charts.
 */
export class ChartLoader {
    private _chart: chartjs;
    private _config: any;
    private _mapApi: any;
    private _panel: any;
    private _slider: any;
    private _xType: string;

    private _barChartOptions: ChartBar;
    private _pieChartOptions: ChartPie;

    static defaultColors: string[] = [
        '#e6194b',
        '#3cb44b',
        '#ffe119',
        '#4363d8',
        '#f58231',
        '#911eb4',
        '#46f0f0',
        '#f032e6',
        '#bcf60c',
        '#fabebe',
        '#008080',
        '#e6beff',
        '#9a6324',
        '#fffac8',
        '#800000',
        '#aaffc3',
        '#808000',
        '#ffd8b1',
        '#000075',
        '#808080',
        '#ffffff',
        '#000000'
    ];

    /**
     * Chart loader constructor
     * @constructor
     * @param {Any} mapApi the viewer api
     * @param {Any} config the slider configuration
     */
    constructor(mapApi: any, config: any) {
        this._mapApi = mapApi;
        this._config = config;
        this._panel = this._mapApi.panels.getById('chart');
    }

    /**
     * Initialize the slider
     * @function initSlider
     * @param {Number} min minimum value for slider
     * @param {Number} max maximum value for slider
     * @param {String} xType the x axis type, date or linear
     */
    initSlider(min: number, max: number, xType: string) {
        const delta = Math.abs(max - min);
        nouislider.create(this._slider,
            {
                start: [min, max],
                connect: true,
                behaviour: 'drag-tap',
                tooltips: [{ to: (value: number) => value, from: Number },
                        { to: (value: number) => value, from: Number }],
                range: { min, max },
                step: 1,
                pips: {
                    mode: 'steps',
                    //values: (delta % 2) ? [0, 20, 40, 60, 80, 100] : [0, 20, 50, 75, 100],
                    density: Math.floor(delta / 4) * 25,
                    stepped: true
                }
            });

        // trap the on change event when user use handles
        this._xType = xType;
        let that = this;
        this._slider.noUiSlider.on('set.one', function(values: string[]) {;
            // set min and max from the slider values
            let min: any = parseInt(values[0], 10);
            let max: any = parseInt(values[1], 10);

            if ((<any>that)._xType === 'date') {
                min = new Date(`${min}-01-01:00:00:00`);
                max = new Date(`${max}-12-31:00:00:00`);
            }

            // loop trought datasets to filter the data 
            for (let [i, dataset] of that._chart.data.datasets.entries()) {
                dataset.data = that.parseRange(min, max, that._barChartOptions.datasets[i]);
            }

            // update the chart
            that._chart.update();
        });
    }

    /**
     * Parse the graph value with the range from the slider
     * @function parseRange
     * @param {Date} min minimum value to filter
     * @param {Date} max maximum value to filter
     * @param {Any} data data to filter
     */
    parseRange(min: Date, max: Date, data: any): object[] {
        const parsed = [];

        for (let value of data) {
            if (value.x >= min && value.x <= max) { parsed.push(value); }
        }

        return parsed;
    }

    /**
     * Destroy the slider
     * @function destroySlider
     */
    destroySlider() {
        if (this._slider.noUiSlider) { this._slider.noUiSlider.destroy(); }
    }

    /**
     * Destroy the chart
     * @function destroyChart
     */
    destroyChart() {
        // we need to also remove the canvas because if not, data is still on canvas
        if (this._chart) {
            this._panel.body.find('#rvChart').remove();
            this._panel.body.find('.rv-chart-panel').append('<canvas id="rvChart" class="rv-chart"></canvas>');
            this._chart.destroy();
        }
    }

    /**
     * Create pie chart
     * @function createPieChart
     * @param {Object} attrs attributes to use for the graph
     */
    createPieChart(attrs: object) {
        this._pieChartOptions = new ChartPie(this._config, attrs);
        this.draw(this._pieChartOptions);
    }

    /**
     * Create bar chart
     * @function createBarChart
     * @param {Object} attrs attributes to use for the graph
     */
    createBarChart(attrs: object) {
        this._barChartOptions = new ChartBar(this._config, attrs);
        this.draw(this._barChartOptions);

        // if it is a line chart, we assume they use date as x values so we add a date slider
        if (this._config.type === 'line' && (this._config.axis.xAxis.type === 'date' || this._config.axis.xAxis.type === 'linear')) {
            this._slider = document.getElementById('nouislider');
            const range = this._barChartOptions.range;

            if (this._config.axis.xAxis.type === 'date') {
                range.min = range.min.getFullYear();
                range.max = range.max.getFullYear()
            }
            this.initSlider(range.min, range.max, this._config.axis.xAxis.type);
        }
    }

    /**
     * Draw the chart
     * @function draw
     * @param {Any} opts the chart options
     */
    draw(opts: any): void {
        // extend chart options with global ones
        const extendOptions = { ...opts.options, ...this.getGlobalOptions(opts.title) };

        this._panel.open();
        this._chart = new chartjs('rvChart', { type: opts.type, data: opts.data, options: extendOptions });
    }

    /**
     * Get global options fot all charts
     * @function getGlobalOptions
     * @param {String} title the chart title
     * @return {Object} the global options
     */
    getGlobalOptions(title: string): object {
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
                display: true,
                text: title
            },
            showLines: true,
            elements: {
                point: {
                    radius: 0,
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
                position: 'average',
                intersect: true,
                mode: 'nearest',
                axis: 'x', // this need to be set to select all values to a specified x
                callbacks: {
                    title: (tooltipItem: any): string => {
                        return tooltipItem[0].label.split(',').filter((item: any, index: any) => index < 2).join(', ');
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
        const parsed = { datasets: [] };

        // TODO: work around for CFS do not keep as is for production
        const parseDate = function(dateString: string): Date {
            // check date to add month and day if not present. At the same time add dashes if missing
            if (dateString.length === 4) { dateString = `${dateString}-01-01`; }
            else if (dateString.length === 5) { dateString = `${dateString.substring(0,4)}-0${dateString.substring(4, 6)}`; }
            else if (dateString.length === 6 && dateString.indexOf('-') === -1) { dateString = `${dateString.substring(0,4)}-${dateString.substring(4, 6)}`; }
            else if (dateString.length === 6 && dateString.indexOf('-') !== -1) { dateString = `${dateString.substring(0,5)}0${dateString.substring(5, 6)}`; }
            else if (dateString.length === 7 && dateString.indexOf('-') === -1) { dateString = `${dateString}-01`; }
            else if (dateString.length === 8 && dateString.indexOf('-') === -1) { dateString = `${dateString.substring(0,4)}-${dateString.substring(4, 6)}-${dateString.substring(6, 8)}`; }

            return  new Date(`${dateString}:00:00:00`);
        }

        // loop trough datasets to add from config
        for (let data of config.data) {
            const fieldData = data.measure;
            const prefix = data.prefix;
            const suffix = data.suffix;
            const values = attrs.data.find(i => i.key === fieldData).value;

            // if regex is provided, it is because there is multiple datasets in the value field
            // only do this for single type where we can have more then 1 dataset by field
            // for combine, there is 2 values by field (x and y). We do not support more then 1 dataset
            let parseValues = (data.regex !== '' && data.type === 'single') ?
                values.replace(new RegExp(data.regex, 'g'), '*').split('*').filter(Boolean) : [values];

            // loop trough array of data inside a field values
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
    static getLabels(config: any, attrs: any, index = 0): string[] {
        let labels = config.split !== '' ? config.values.split(config.split) : config.values;
        if (config.type === 'field') {
            const field = (labels instanceof Array) ? labels[0] : labels;
            const temp = attrs.data.find((i: any) => i.key === field).value;
            labels = config.split !== '' ? temp.split(config.split) : temp;
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