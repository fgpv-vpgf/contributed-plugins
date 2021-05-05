import {
    CHART_TEMPLATE
} from './template';

import { ChartLoader } from './chart-loader';
import { DetailsManager } from './details-manager';
import { ChartControls } from './chart-controls';
import { ChartParser } from './chart-parser';

const _ = require('lodash');

// decided to first use chartjs because of is simplicity.
// TODO: look for D3 https://www.slant.co/versus/10578/10577/~chart-js_vs_d3-js
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
        this._panel.element.attr('rv-trap-focus', '');
        this._panel.body = this.compileTemplate(CHART_TEMPLATE)[0];
        this._panel.header.closeButton;
        this._panel.header.title = this.config.title;

        // create chart loader class
        this._loader = new ChartLoader(this._mapApi);

        // add selector control to panel header
        new ChartControls(this._mapApi, this._panel, this._loader);

        // subscribe to panel closing to destroy existing graph and slider
        this._panel.closing.subscribe(() => {
            this._loader.destroy();
        });

        // close the panel on esc
        document.onkeydown = (evt) => {
            if (evt.key === "Escape") {
                this._panel.close();
            }
        };

        // subscribe to click event when user click on data to trigger chart creation
        // wrap it inside a timeout because of timing issue. click event is not a member of _mapApi if not...
        setTimeout(() => this._mapApi.click.subscribe(pt => {
            this._panel.close();

            // reset array of charts arrtribute and selector control values
            ChartParser.resetChart();

            pt.features.subscribe(feat => {
                // start chart only if there is a valid configuration
                const layers = this.config.layers.find((i: any) => i.id === feat.layerId);
                if (typeof layers !== 'undefined') {
                    // open panel before we try to create the chart. If there is a link table, it can take few seconds before the we get the result.
                    this._panel.open();
                    if (ChartParser._chartAttrs.length === 0) {
                        // as soon as we have chart ready, remove loading
                        this._panel.body.find('.rv-chart-loading').css('display', 'block');
                    }

                    // set layer name, details values and feature from selected feature
                    const config = this.findDetailsconfig(feat.layerId, this.config.layers, feat);

                    // use lodash to deep clone the object so we dont mess the original object
                    // we need to pass the original config because the processClick modify the configuration object.
                    const configChart = _.cloneDeep(this.config);
                    ChartParser.processClick(configChart, feat);
                }
            });
        }), 1000);
    }

    /**
    * Set details panel value
    * @function findDetailsconfig
    * @param {String} id the layer id for this feature
    * @param {Object[]} layersConfig the chart layers configuration array
    * @param {Any} feature the feature to use for details panel values
    */
    findDetailsconfig(id: string, layersConfig: object[], feature: any): void {
        const layers = this._RV.getConfig('map').layers.find((i: any) => i.id === id);
        const config = layersConfig.find((i: any) => i.id === id);

        // set details panel
        this._panelDetails.layerName = layers.name;
        this._panelDetails.enabled = (<any>config).details.enabled;
        this._panelDetails.details = (<any>config).details.value;
        this._panelDetails.feature = feature.data;
    }

    /**
     * Compile template to link controller and html
     * @function compileTemplate
     * @param {String} template measure control
     * @return {JQuery<HTMLElement>} temp compile template
     */
    private compileTemplate(template: string): JQuery<HTMLElement> {
        let temp = $(template);
        this._mapApi.$compile(temp);
        return temp;
    }
}

export default interface Chart {
    _RV: any;
    config: any;
    translations: any;
}

Chart.prototype.translations = {
    'en-CA': {
        chartAria: 'Representation of the element\'s dataset using a graph. For screen reader, to access the dataset, use the table representation or the details panel information',
        noValidData: 'No valid data to create the graph!',
        selectChart: 'Select Chart',
        legendTooltip: 'Click on legend item to show/hide'
    },
    'fr-CA': {
        chartAria: 'Représentation du jeu de données de l\'élément à l\'aide d\'un graphique. Pour les lecteurs d\'écran, pour accéder à l\'ensemble des données, utilisez la représentation sous forme de tableau ou le panneau d\'information détaillé.',
        noValidData: 'Pas de données valides pour créer le graphique!',
        selectChart: 'Choisir le graphique',
        legendTooltip: 'Cliquez sur les éléments de la légende pour les afficher/masquer'
    }
};

(<any>window).chart = Chart;