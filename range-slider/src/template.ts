// panels templates: slider (bar and controls)
export const SLIDER_TEMPLATE = `
<div rv-focus-member class="rv-rangeslider">
    <div class="slider-content">
        <div class="slider-bar">
            <div id="nouislider" class="slider-widget"></div>
            <div class="slider-controls"></div>
        </div>
    </div>
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
            <md-option ng-repeat="(key, value) in { 3000: '3 sec', 4000: '4 sec', 5000: '5 sec', 6000: '6 sec', 7000: '7 sec' }" ng-value="{{ key }}">
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
        'refresh': '<path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"></path>'
    };

    return `<svg xmlns="http://www.w3.org/2000/svg" fit="" height="100%" width="100%" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24" focusable="false">
            <g id="slider${icon}">${svg[icon]}</g></svg>`;
}