// panels templates: chart holder
export const CANVAS_TEMPLATE = `<canvas id="rvChart" class="rv-chart" role="img" aria-label=""></canvas>`;

export const CHART_TEMPLATE = `
<div class="rv-chart-panel">
    <div class="rv-chart-sliderY">
        <div id="nouisliderY"></div>
    </div>
    <div style="width:100%; display: flex; flex-direction: column;">
        <div class="rv-chart-canvas">
            ${CANVAS_TEMPLATE}
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