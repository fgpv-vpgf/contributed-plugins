import {
    CHART_TEMPLATE
} from './template';

import { ChartLoader } from './chart-loader';

// decided to first use chartjs because of is simplicity. TODO: look for D3 https://www.slant.co/versus/10578/10577/~chart-js_vs_d3-js
// https://en.wikipedia.org/wiki/Comparison_of_JavaScript_charting_libraries
export default class Chart {
    private _mapApi: any;
    private _panel: any;
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

        // create panel
        this._panel = this._mapApi.panels.create('chart');
        this._panel.element.css(this._panelOptions);
        this._panel.body = CHART_TEMPLATE;
        this._panel.header.closeButton;

        // get chart config and add language
        this.config = this._RV.getConfig('plugins').chart;
        this.config.language = this._RV.getCurrentLang();

        // create chart loader class
        this._loader = new ChartLoader(this._mapApi, this.config);

        // subscribe to panel closing to destroy existing graph and slider
        this._panel.closing.subscribe(() => {
            this._loader.destroyChart();
            if (this.config.type === 'line') { this._loader.destroySlider(); }
        });

        // subscribe to click event when user click on data to trigger chart creation
        this._mapApi.click.subscribe(pt => {
            this._panel.close();
            pt.features.subscribe(feat => {
                if (this.config.type === 'pie') {
                    this._loader.createPieChart(feat);
                } else if (this.config.type === 'bar' || this.config.type === 'line') {
                    this._loader.createBarChart(feat);
                }
            })
        });
    }
}

export default interface Chart {
    _RV: any;
    config: any
}

(<any>window).chart = Chart;