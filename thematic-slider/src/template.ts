// panels templates
export const SLIDER_TEMPLATE = `
<div rv-focus-member class="rv-thematic-slider">
</div>`;

// description controller template
export const DESCRIPTION_TEMPLATE = `
<div class="rv-thslider-desc-control" ng-controller="DescriptionCtrl as ctrl">
    <md-button
        class="md-icon-button rv-button-40 rv-icon-20"
        ng-click="ctrl.isLegend = !ctrl.isLegend"
        aria-label="{{ ctrl.isLegend ? 'toc.label.group.collapse' : 'toc.label.group.expand' | translate }}">
        <md-icon class="rv-transform-default rv-rotate--180" ng-class="{ 'rv-rotate--180' : ctrl.isLegend }" md-svg-src="hardware:keyboard_arrow_down" role="img" aria-hidden="true" style="">
        <md-tooltip md-direction="top">{{ ctrl.isLegend ? 'toc.label.group.collapse' : 'toc.label.group.expand' | translate }}</md-tooltip>
    </md-button>

    <div ng-show="ctrl.isLegend">
        <div class="rv-thslider-legend"></div>
        <md-divider></md-divider>
    </div>
    <div class="rv-thslider-desc" ng-bind-html=ctrl.description></div>
    <span class="rv-thslider-index">{{ ctrl.index }}</span>
</div>`;

// controls bar controller template
export const PLAY_BAR_TEMPLATE = `
<div class="rv-thslider-bar-control" ng-controller="BarCtrl as ctrl">
    <md-button
        aria-label="{{ 'plugins.thematicSlider.previous' | translate }}"
        class="md-icon-button primary"
        ng-disabled="ctrl.isPlaying || ctrl.isLast === 'down'"
        ng-click="ctrl.step('down')">
        <md-tooltip>{{ 'plugins.thematicSlider.previous' | translate }}</md-tooltip>
        <md-icon>${createSVG('previous')}</md-icon>
    </md-button>
    <md-button
        aria-label="{{ ctrl.isPlaying ? 'plugins.thematicSlider.pause' : 'plugins.thematicSlider.play' | translate }}"
        class="md-icon-button primary"
        ng-click="ctrl.play()">
        <md-tooltip>{{ ctrl.isPlaying ? 'plugins.thematicSlider.pause' : 'plugins.thematicSlider.play' | translate }}</md-tooltip>
        <md-icon ng-if="ctrl.isPlaying">${createSVG('pause')}</md-icon>
        <md-icon ng-if="!ctrl.isPlaying">${createSVG('play')}</md-icon>
    </md-button>
    <md-button
        aria-label="{{ 'plugins.thematicSlider.foward' | translate }}"
        class="md-icon-button primary"
        ng-disabled="ctrl.isPlaying || ctrl.isLast === 'up'"
        ng-click="ctrl.step('up')">
        <md-tooltip>{{ 'plugins.thematicSlider.foward' | translate }}</md-tooltip>
        <md-icon>${createSVG('next')}</md-icon>
    </md-button>
</div>`;

/**
* Create button icon
* @function createSVG
* @param {String} icon the icon name
* @return {String} the html svg icon string 
*/
function createSVG(icon): string {
    const svg = {
        'next': '<path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"></path>',
        'previous': '<path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"></path>',
        'play': '<path d="M8 5v14l11-7z"></path>',
        'pause': '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path>'
    };

    return `<svg xmlns="http://www.w3.org/2000/svg" fit="" height="100%" width="100%" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24" focusable="false">
            <g id="slider${icon}">${svg[icon]}</g></svg>`;
}