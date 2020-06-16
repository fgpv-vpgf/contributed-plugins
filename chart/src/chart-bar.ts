import { ChartLoader } from './chart-loader';

/**
 * Creates bar charts.
 */
export class ChartBar {
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
        this.options = {
            scales: {
                xAxes: [],
                yAxes: []
            }
        };

        // set data options
        const colors = config.options.colors === '' ? ChartLoader.defaultColors : config.options.colors.split(';');
        const layerData = config.layers.find(i => i.id === (<any>attrs).layerId);
        this.setData(layerData, attrs, colors, config.axis.xAxis.type);

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
    setData(layerData: object, attrs: object, colors: string[], xType: string) {
        // get data for the graph and keep a copy for line chart with time
        // we have a slider to refine the graph by years
        this.data = ChartLoader.parse(layerData, attrs, colors, xType);

        // for each dataset, set options
        for (let [i, dataset] of this.data.datasets.entries()) {
            dataset.backgroundColor = `${colors[i]}80`;
            dataset.borderColor = colors[i];
            dataset.borderWidth = 2;
        }
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
        }

        // axe gridlines display
        if (axe === 'xAxes') {
            optsAxe.gridLines = {
                display: true,
                drawTicks: true,
                drawBorder: false,
                drawOnChartArea: false
            }
        }

        // axe ticks
        optsAxe.ticks = {
            autoSkip: true,
            autoSkipPadding: 100
        }

        // axe title
        optsAxe.scaleLabel = {
            display: true,
            labelString: config.title
        }

        return optsAxe;
    }
}

export interface ChartBar {
    options: any;
    type: string;
    data: any;
    title: string;
    ranges: any;
}