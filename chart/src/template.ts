// panels templates: chart holder
export const CANVAS_TEMPLATE = `<canvas id="rvChart" class="rv-chart" role="img" aria-label="{{ 'plugins.chart.chartAria' | translate }}"></canvas>`;

export const LOADING_SPLASH_TEMPLATE = `
<div class="rv-loading-screen" layout layout-align="center center">
    <div class="rv-loading-section rv-left"></div>
    <div class="rv-loading-section rv-right"></div>
    <div class="rv-spinner google-spin-wrapper">
        <div class="google-spin"></div>
    </div>
</div>`;

export const NO_DATA_TEMPLATE = `
<div class="rv-chart-nodata">{{ 'plugins.chart.noValidData' | translate }}</div>`;

export const CHART_SELECT_TEMPLATE = `
<div ng-controller="ChartSelectCtrl as ctrl" class="rv-chart-select">
    <md-input-container class="md-block" md-no-float flex>
        <label>{{ 'plugins.chart.selectChart' | translate }}</label>
        <md-select
            aria-label="{{ 'plugins.chart.selectChart' | translate }}"
            ng-model="ctrl.selectedChart"
            ng-change="ctrl.selectChart()">
            <md-option ng-repeat="(key, value) in ctrl.charts" ng-value="key">
                {{ value }}
            </md-option>
        </md-select>
    </md-input-container>
</div>`;

export const CHART_TEMPLATE = `
<div class="rv-chart-panel">
    ${NO_DATA_TEMPLATE}
    <div class="rv-chart-hidedata-tooltip">{{ 'plugins.chart.legendTooltip' | translate }}</div>
    <div class="rv-chart-sliderY">
        <div id="nouisliderY"></div>
    </div>
    <div style="width:100%; display: flex; flex-direction: column;">
        <div class="rv-chart-canvas">
            ${CANVAS_TEMPLATE}
        </div>
        <div class="rv-chart-loading">
            ${LOADING_SPLASH_TEMPLATE}
        </div>
        <div class="rv-chart-sliderX">
            <div id="nouisliderX"></div>
        </div>
    </div>
</div>`;

export const DETAILS_TEMPLATE = `
<div class="rv-chart-details">
    <div class="rv-chart-details-value"></div>
    <md-divider></md-divider>
</div>`;