import {
    CHART_TEMPLATE
} from './template';

import { ChartLoader } from './chart-loader';
import { DetailsManager } from './details-manager';

// decided to first use chartjs because of is simplicity. TODO: look for D3 https://www.slant.co/versus/10578/10577/~chart-js_vs_d3-js
// https://en.wikipedia.org/wiki/Comparison_of_JavaScript_charting_libraries
export default class Chart {
    private _mapApi: any;
    private _panel: any;
    private _panelDetails: DetailsManager;
    private _loader: ChartLoader;
    private _panelOptions: object = {
        'margin-top': '60px',
        'margin-bottom': '60px',
        'margin-right': '60px',
        'margin-left': '420px'
    };

    /**
    * Plugin init
    * @function init
    * @param {Object} mapApi the viewer api
    */
    init(mapApi: any) {
        this._mapApi = mapApi;

        // manage details panel to modify values for graph layer
        this._panelDetails = new DetailsManager(mapApi);

        // get chart config and add language
        this.config = this._RV.getConfig('plugins').chart;
        this.config.language = this._RV.getCurrentLang();

        // create panel
        this._panel = this._mapApi.panels.create('chart');
        this._panel.element.css(this._panelOptions);
        this._panel.body = CHART_TEMPLATE;
        this._panel.header.closeButton;
        this._panel.header.title = this.config.title;

        // create chart loader class
        this._loader = new ChartLoader(this._mapApi, this.config);

        // subscribe to panel closing to destroy existing graph and slider
        this._panel.closing.subscribe(() => {
            this._loader.destroyChart();
            if (this.config.type === 'line') { this._loader.destroySlider(); }
        });

        // subscribe to click event when user click on data to trigger chart creation
        // wrap it inside a timeout because of timing issue. click event is not a memeber of _mapApi if not...
        setTimeout(() => this._mapApi.click.subscribe(pt => {
            this._panel.close();
            pt.features.subscribe(feat => {
                // set layer name, details values and feature from selected feature
                const config = this.findDetailsconfig(feat.layerId, this.config.layers);
                
                // set details panel
                this._panelDetails.layerName = (<any>config).name;
                this._panelDetails.enabled = (<any>config).details.enabled;
                this._panelDetails.details = (<any>config).details.value;
                this._panelDetails.feature = feat.data;

                // set aria label
                $('#rvChart').attr('aria-label', Chart.prototype.translations[this._RV.getCurrentLang()].chartAria);

                // creat the chart from chart type
                if (this.config.type === 'pie') {
                    this._loader.createPieChart(feat);
                } else if (this.config.type === 'bar') {
                    this._loader.createBarChart(feat);
                } else if (this.config.type === 'line') {
                    this._loader.createLineChart(feat);
                }

                // set focus on the close button.
                const element = $('#chart .rv-header .md-button')[0];
                (<any>element).rvFocus();
            })
        }), 1000);
    }

    /**
    * Set details panel value
    * @function findDetailsconfig
    * @param {String} id the layer id for this feature
    * @param {Object[]} layersConfig the chart layers configuration array
    * @returns {Object} the details panel values
    */
    findDetailsconfig(id: string, layersConfig: object[]): object {
        const layers = this._RV.getConfig('map').layers.find((i: any) => i.id === id);
        const config = layersConfig.find((i: any) => i.id === id);
        return { name: layers.name, details: (<any>config).details };
    }
}

export default interface Chart {
    _RV: any;
    config: any;
    translations: any;
}

Chart.prototype.translations = {
    'en-CA': {
        chartAria: 'Representation of the element\'s dataset using a graph.'
    },
    'fr-CA': {
        chartAria: 'Représentation du jeu de données de l\'élément à l\'aide d\'un graphique.'
    }
};

(<any>window).chart = Chart;