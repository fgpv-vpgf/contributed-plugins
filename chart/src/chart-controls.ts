import {
    CHART_SELECT_TEMPLATE
} from './template';

import { ChartLoader } from './chart-loader';
import { ChartParser } from './chart-parser';

const _ = require('lodash');

export class ChartControls {
    /**
     * Slider controls constructor
     * @constructor
     * @param {Any} mapApi the viewer api
     * @param {Any} panel the panel
     * @param {ChartLoader} loader the chart loader class
     */
    constructor(mapApi: any, panel: any, loader: ChartLoader) {
        this.mapApi = mapApi;
        this.loader = loader;

        this.initControl(panel);
    }

    /**
     * Init the selector control
     * @param {Any} panel the chart panel to add the control to 
     */
    private initControl(panel: any): void {
        // ! DO NOT USE $scope because it makes the build version fails.
        // select option when there is more then 1 chart
        const that = this;
        this.mapApi.agControllerRegister('ChartSelectCtrl', function() {
            // set selected chart and array of charts
            this.selectedChart = '';
            this.charts = {};

            // get charts to populate the select option
            ChartParser.getCharts().subscribe(value => {
                if (_.isEmpty(value)) {
                    this.charts = {};
                } else {
                    if (_.isEmpty(this.charts)) {
                        this.selectedChart = "0";
                        (<any>that).createChart(this.selectedChart);

                        // remove loading splash
                        panel.body.find('.rv-chart-loading').css('display', 'none');
                    }
                    this.charts[Object.keys(value)[0]] = value[Object.keys(value)[0]];
                }
            });

            this.selectChart = () => {
                (<any>that).createChart(this.selectedChart);
            }
        });

        // add the control to panel header
        panel.header._header.find('.rv-header-content')[0].append(this.compileTemplate(CHART_SELECT_TEMPLATE)[0]);
    }
    
    /**
     * Create the chart
     * @function createChart
     * @param {String} selectedChart selected chart
     */
    private createChart(selectedChart: string): void {
        const item = ChartParser._chartAttrs.find((val: any) => val.index === selectedChart);

        // create the chart from chart type
        if (item.chartType === 'pie') {
            this.loader.createPieChart(item.feature, item.config);
        } else if (item.chartType === 'bar') {
            this.loader.createBarChart(item.feature, item.config);
        } else if (item.chartType === 'line') {
            this.loader.createLineChart(item.feature, item.config);
        }

        // set focus on the close button.
        const element = $('#chart .rv-header .md-button')[0];
        (<any>element).rvFocus();
    }

    /**
     * Compile template to link controller and html
     * @function compileTemplate
     * @param {String} template measure control
     * @return {JQuery<HTMLElement>} temp compile template
     */
    private compileTemplate(template: string): JQuery<HTMLElement> {
        let temp = $(template);
        this.mapApi.$compile(temp);
        return temp;
    }
}
export interface ChartControls {
    mapApi: any;
    loader: ChartLoader;
}