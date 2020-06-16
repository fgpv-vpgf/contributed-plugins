import { ChartLoader } from './chart-loader';

/**
 * Creates pie and doughnut charts.
 */
export class ChartPie {
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
        this.options = this.setOptions(config.options.cutOut);

        // set data options
        const layerData = config.layers.find((i: any) => i.id === (<any>attrs).layerId);
        this.data = ChartLoader.parse(layerData, attrs, config.colors);

        // set labels options
        // if more labels are provided then the first datasets number of values, they will be striketrought
        this.data.labels = ChartLoader.getLabels(config.labelsPie, attrs);

        // add default colors if not set from config or data
        const colors = config.options.colors === '' ? ChartLoader.defaultColors : config.options.colors.split(';');
        this.setColors(this.data.datasets, colors);
    }

    /**
     * Set the chart options
     * @function setOptions
     * @param {Number} cutOut the cut out percentage for the inside hole
     * @return {Object} the chart options
     */
    setOptions(cutOut: number): object {
        const config = {
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            borderAlign: 'center',
            borderColor: '#fff',
            borderWidth: 3,
            hoverBackgroundColor: '#fff',
            hoverBorderColor: '#fff',
            cutoutPercentage: cutOut,
            animation: {
                animateRotate: true,
                animateScale: true
            }
        }

        return config
    }

    /**
     * Set the chart colors
     * @function setColors
     * @param {Dataset[]} datasets the datasets to apply color to 
     * @param {String[]} colors the array of colors to use
     */
    setColors(datasets: dataset[], colors: string[]) {
        for (let dataset of datasets) {
            if (typeof dataset.backgroundColor === 'undefined' || dataset.backgroundColor.length === 0) {
                dataset.backgroundColor = colors;
            }
        }
    }
}

interface dataset {
    backgroundColor: string[];
}

export interface ChartPie {
    options: any;
    type: string;
    data: any;
    title: string;
}