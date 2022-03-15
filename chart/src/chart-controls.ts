import {
    CHART_SELECT_TEMPLATE, MAXIMIZE_BUTTON
} from './template';

import { ChartLoader } from './chart-loader';
import { ChartParser } from './chart-parser';
import Common from './common';

const _ = require('lodash');

/**
 * Class to manage the selection control and lauch chart creation
 * @exports
 * @class ChartControls
 */
export class ChartControls {
    /**
     * Slider controls constructor
     * @constructor
     * @param {Any} mapApi the viewer api
     * @param {Any} panel the panel
     * @param {ChartLoader} loader the chart loader class
     */
    constructor(mapApi: any, panel: any, loader: ChartLoader, panelOptions: any) {
        this.mapApi = mapApi;
        this.loader = loader;

        this.initControl(panel, panelOptions);
    }

    /**
     * Init the selector control
     * @param {Any} panel the chart panel to add the control to 
     */
    private initControl(panel: any, panelOptions: any): void {
        // ! DO NOT USE $scope because it makes the build version fails.
        // select option when there is more then 1 chart
        const that = this;
        this.mapApi.agControllerRegister('ChartSelectCtrl', function () {
            // set selected chart and array of charts
            this.selectedChart = '';
            this.charts = {};

            // set label and label array.
            this.selectedLabel = [];
            this.selectedSingleLabel = 0;
            this.labels = {};

            // get charts to populate the select option
            ChartParser.getCharts().subscribe(value => {
                if (_.isEmpty(value)) {
                    this.charts = {};
                } else {
                    if (_.isEmpty(this.charts)) {
                        this.selectedChart = "0";
                        (<any>that).createChart(this.selectedChart, this.selectedLabel);
                        ChartParser.populateLabelSelect(this.selectedChart, this);

                        // remove loading splash
                        panel.body.find('.rv-chart-loading').css('display', 'none');
                    }
                    this.charts[Object.keys(value)[0]] = value[Object.keys(value)[0]];
                }
            });

            // This actually populate the chart and labels combo in panel.
            this.selectChart = () => {
                (<any>that).createChart(this.selectedChart, this.selectedLabel);
                ChartParser.populateLabelSelect(this.selectedChart, this);
            }

            // This actually populate the label in panel.
            this.LabelChange = () => {
                (<any>that).createChart(this.selectedChart, this.selectedLabel);
            }

            this.MaximizeChart = () => {
                const tooltipAttr = 'aria-label';
                const element = document.querySelector(Common._controlIdsOrClass.btnExpendChartPaneID);
                if (!element.classList.contains(Common.constants.rotateCssClass)) {
                    const panelOptions = Common._panelOptionsExpand;
                    panel.element.css(panelOptions);
                    element.classList.add(Common.constants.rotateCssClass);
                } else {
                    const panelOptions = Common._panelOptionsShrink;
                    panel.element.css(panelOptions);
                    const canvasElement = document.querySelector(Common._controlIdsOrClass.canvasRvChart);
                    canvasElement.style.height = Common._canvasOptionShrink.height;
                    canvasElement.style.width = Common._canvasOptionShrink.width;
                    element.classList.remove(Common.constants.rotateCssClass);
                }
            }
        });

        // add the control to panel header
        panel.header._header.find('.rv-header-content')[0].before(this.compileTemplate(CHART_SELECT_TEMPLATE)[0]);
        panel.header._header.find('.rv-header-controls')[0].before(this.compileTemplate(MAXIMIZE_BUTTON)[0]);
    }

    /**
     * Create the chart
     * @function createChart
     * @param {String} selectedChart selected chart
     * @param {Number} selectedLabel selected label
     */
    private createChart(selectedChart: string, selectedLabel: [number]): void {
        const origItem = ChartParser.getItem(selectedChart);
        const item = JSON.parse(JSON.stringify(origItem));
        const colors = item.config.options.colors === '' ? ChartLoader.defaultColors : item.config.options.colors.split(';');
        item.config.layers[0].data = item.config.layers[0].data.map((obj, i) => {
            return ({ ...obj, color: colors[i] });
        });
        if (item.chartType === 'line')
            item.config.layers[0].data = item.config.layers[0].data.filter(i => selectedLabel.some(j => i.key === j));
        // create the chart from chart type
        if (item.chartType === 'pie') {
            this.loader.createPieChart(item.feature, item.config);
        } else if (item.chartType === 'bar') {
            this.loader.createBarChart(item.feature, item.config);
        } else if (item.chartType === 'line') {
            // Display Label combo.
            $('.rv-chart-label-select').css('display', 'block');
            // Hide and show multi check / single item combo on the basis of items.
            if (origItem.config.layers[0].data.length > 1) {
                $('.multiple-select').css('display', 'block');
                $('.single-select').css('display', 'none');
            }
            else {
                $('.multiple-select').css('display', 'none');
                $('.single-select').css('display', 'block');
            }
            this.loader.createLineChart(item.feature, item.config);
        }

        // set focus on the close button.

        const element = document.querySelector('[id^=chart] .rv-header-controls .md-button');
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