// panels templates: slider (bar and controls)
export const SLIDER_TEMPLATE = `
<div rv-focus-member class="rv-rangeslider">
    <div class="slider-content">
        <div class="slider-bar">
            <div><div id="nouislider" class="slider-widget"></div><span class="slider-units"></span></div>
            <div class="slider-controls"></div>
        </div>
        <div class="slider-desc">
            <span class="slider-desc-layers"></span>
            <span class="slider-desc-info"></span>
        </div>
    </div>
</div>`;

// description control
export const DESC_BAR_TEMPLATE = `
<div class="slider-bar-control slider-desc-control" ng-controller="DescSliderCtrl as ctrl">
    <md-button
        aria-label="{{ !ctrl.isShow ? 'plugins.rangeSlider.bar.show' : 'plugins.rangeSlider.bar.hide' | translate }}"
        class="md-icon-button primary"
        ng-click="ctrl.show()">
        <md-tooltip>{{ !ctrl.isShow ? 'plugins.rangeSlider.bar.show' : 'plugins.rangeSlider.bar.hide' | translate }}</md-tooltip>
        <md-icon ng-if="ctrl.isShow">${createSVG('hide')}</md-icon>
        <md-icon ng-if="!ctrl.isShow">${createSVG('show')}</md-icon>
    </md-button>
</div>`;

// slider bar controls (lock, loop, previous, next, play/pause, refresh, delay, export gif)
export const LOCK_BAR_TEMPLATE = `
<div class="slider-bar-control slider-lock-control" ng-controller="LockSliderCtrl as ctrl">
    <md-button
        aria-label="{{ !ctrl.isLocked ? 'plugins.rangeSlider.bar.lock' : 'plugins.rangeSlider.bar.unlock' | translate }}"
        class="md-icon-button primary"
        ng-click="ctrl.lock()">
        <md-tooltip>{{ !ctrl.isLocked ? 'plugins.rangeSlider.bar.lock' : 'plugins.rangeSlider.bar.unlock' | translate }}</md-tooltip>
        <md-icon ng-if="ctrl.isLocked">${createSVG('lock')}</md-icon>
        <md-icon ng-if="!ctrl.isLocked">${createSVG('lockOpen')}</md-icon>
    </md-button>
</div>`;

export const LOOP_BAR_TEMPLATE = `
<div class="slider-bar-control slider-loop-control" ng-controller="LoopSliderCtrl as ctrl">
    <md-button
        aria-label="{{ !ctrl.isLooped ? 'plugins.rangeSlider.bar.loop' : 'plugins.rangeSlider.bar.unloop' | translate }}"
        class="md-icon-button primary"
        ng-click="ctrl.loop()">
        <md-tooltip>{{ !ctrl.isLooped ? 'plugins.rangeSlider.bar.loop' : 'plugins.rangeSlider.bar.unloop' | translate }}</md-tooltip>
        <md-icon>${createSVG('loop')}</md-icon>
    </md-button>
</div>`;

export const PLAY_BAR_TEMPLATE = `
<div class="slider-bar-control slider-play-control">
    <md-button
        ng-controller="StepSliderCtrl as ctrl"
        aria-label="{{ 'plugins.rangeSlider.bar.previous' | translate }}"
        class="md-icon-button primary"
        ng-click="ctrl.step('down')">
        <md-tooltip>{{ 'plugins.rangeSlider.bar.previous' | translate }}</md-tooltip>
        <md-icon>${createSVG('previous')}</md-icon>
    </md-button>
    <div ng-controller="PlaySliderCtrl as ctrl">
        <md-button
            aria-label="{{ ctrl.isPlaying ? 'plugins.rangeSlider.bar.pause' : 'plugins.rangeSlider.bar.play' | translate }}"
            class="md-icon-button primary"
            ng-click="ctrl.play()">
            <md-tooltip>{{ ctrl.isPlaying ? 'plugins.rangeSlider.bar.pause' : 'plugins.rangeSlider.bar.play' | translate }}</md-tooltip>
            <md-icon ng-if="ctrl.isPlaying">${createSVG('pause')}</md-icon>
            <md-icon ng-if="!ctrl.isPlaying">${createSVG('play')}</md-icon>
        </md-button>
    </div>
    <md-button
        ng-controller="StepSliderCtrl as ctrl"
        aria-label="{{ 'plugins.rangeSlider.bar.foward' | translate }}"
        class="md-icon-button primary"
        ng-click="ctrl.step('up')">
        <md-tooltip>{{ 'plugins.rangeSlider.bar.foward' | translate }}</md-tooltip>
        <md-icon>${createSVG('next')}</md-icon>
    </md-button>
</div>`;

export const REFRESH_BAR_TEMPLATE = `
<div class="slider-bar-control slider-refresh-control">
    <md-button
        ng-controller="RefreshSliderCtrl as ctrl"
        aria-label="{{ 'plugins.rangeSlider.bar.refresh' | translate }}"
        class="md-icon-button primary rv-slider-refresh"
        ng-click="ctrl.refresh()">
        <md-tooltip>{{ 'plugins.rangeSlider.bar.refresh' | translate }}</md-tooltip>
        <md-icon>${createSVG('refresh')}</md-icon>
    </md-button>
</div>`;

export const DELAY_BAR_TEMPLATE = `
<div ng-controller="DelaySliderCtrl as ctrl" class="slider-bar-control slider-delay-control">
    <md-input-container class="md-block" md-no-float flex>
        <label>{{ 'plugins.rangeSlider.bar.delay' | translate }}</label>
        <md-select
            aria-label="{{ 'plugins.rangeSlider.bar.delay' | translate }}"
            ng-model="ctrl.selectedDelay"
            ng-change="ctrl.selectDelay()">
            <md-option ng-repeat="(key, value) in { 1000: '1 sec', 2000: '2 sec', 3000: '3 sec', 4000: '4 sec', 5000: '5 sec', 6000: '6 sec', 7000: '7 sec' }" ng-value="{{ key }}">
                {{ value }}
            </md-option>
        </md-select>
    </md-input-container>
</div>`;

export const EXPORT_BAR_TEMPLATE = `
<div class="slider-bar-control slider-export-control">
    <span>
        <md-switch
            ng-controller="ExportSliderCtrl as ctrl"
            aria-label="{{ 'plugins.rangeSlider.bar.tooltip.gif' | translate }}"
            class="rv-slider-switch"
            ng-class="md-primary"
            ng-model="ctrl.export"
            ng-change="ctrl.selectExport()">
            <label>{{ 'plugins.rangeSlider.bar.gif' | translate }}</label>
        </md-switch>
        <md-tooltip>{{ 'plugins.rangeSlider.bar.tooltip.gif' | translate }}</md-tooltip>
    </span>
</div>`;

function createSVG(icon): string {
    const svg = {
        'histo': '<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"></path>',
        'lock': '<path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"></path>',
        'lockOpen': '<path d="M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6h1.9c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm0 12H6V10h12v10z"></path>',
        'loop': '<path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"></path>',
        'next': '<path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"></path>',
        'previous': '<path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"></path>',
        'play': '<path d="M8 5v14l11-7z"></path>',
        'pause': '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path>',
        'refresh': '<path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"></path>',
        'show': '<path d="M 11.9994,8.99813C 10.3424,8.99813 8.99941,10.3411 8.99941,11.9981C 8.99941,13.6551 10.3424,14.9981 11.9994,14.9981C 13.6564,14.9981 14.9994,13.6551 14.9994,11.9981C 14.9994,10.3411 13.6564,8.99813 11.9994,8.99813 Z M 11.9994,16.9981C 9.23841,16.9981 6.99941,14.7591 6.99941,11.9981C 6.99941,9.23714 9.23841,6.99813 11.9994,6.99813C 14.7604,6.99813 16.9994,9.23714 16.9994,11.9981C 16.9994,14.7591 14.7604,16.9981 11.9994,16.9981 Z M 11.9994,4.49813C 6.99741,4.49813 2.72741,7.60915 0.99941,11.9981C 2.72741,16.3871 6.99741,19.4981 11.9994,19.4981C 17.0024,19.4981 21.2714,16.3871 22.9994,11.9981C 21.2714,7.60915 17.0024,4.49813 11.9994,4.49813 Z "></path>',
        'hide': '<path d="M 11.8344,9.01477L 14.9824,12.1627C 14.9854,12.1068 14.9994,12.0547 14.9994,11.9977C 14.9994,10.3408 13.6564,8.99774 11.9994,8.99774C 11.9424,8.99774 11.8904,9.01172 11.8344,9.01477 Z M 7.52838,9.80072L 9.07538,11.3467C 9.02838,11.5568 8.99939,11.7737 8.99939,11.9977C 8.99939,13.6547 10.3424,14.9977 11.9994,14.9977C 12.2244,14.9977 12.4414,14.9688 12.6504,14.9227L 14.1974,16.4688C 13.5314,16.7968 12.7914,16.9977 11.9994,16.9977C 9.2384,16.9977 6.99939,14.7598 6.99939,11.9977C 6.99939,11.2057 7.20038,10.4667 7.52838,9.80072 Z M 1.99939,4.27075L 4.27838,6.55072L 4.7334,7.00574C 3.0834,8.29773 1.7804,10.0157 0.99939,11.9977C 2.72739,16.3867 6.99738,19.4977 11.9994,19.4977C 13.5494,19.4977 15.0284,19.1978 16.3834,18.6558L 16.8074,19.0787L 19.7264,21.9987L 20.9994,20.7258L 3.2724,2.99872M 11.9994,6.99774C 14.7604,6.99774 16.9994,9.23676 16.9994,11.9977C 16.9994,12.6437 16.8674,13.2568 16.6444,13.8237L 19.5664,16.7457C 21.0744,15.4847 22.2674,13.8577 22.9994,11.9977C 21.2714,7.60876 17.0024,4.49774 11.9994,4.49774C 10.5994,4.49774 9.26038,4.74872 8.01538,5.19574L 10.1734,7.35376C 10.7404,7.13074 11.3534,6.99774 11.9994,6.99774 Z "></path>'
    };

    return `<svg xmlns="http://www.w3.org/2000/svg" fit="" height="100%" width="100%" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24" focusable="false">
            <g id="slider${icon}">${svg[icon]}</g></svg>`;
}