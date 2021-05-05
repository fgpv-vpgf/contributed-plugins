// panels templates: draw
export const MAPNAV_DRAW_TOOLBAR_TEMPLATE = `
<span class="rv-spacer"></span>
<div class="rv-mapnav-content rv-mapnav-draw-content">
    <div class="rv-button-group hover rv-whiteframe-z2" ng-controller="DrawToolbarCtrl as ctrl">
        <md-button ng-repeat-start="control in ctrl.controls" name="{{ controls }}"
            aria-label="{{ control.label | translate }}"
            class="md-icon-button rv-button-32 rv-icon-16 rv-draw-button rv-draw-{{ control.name }}-button"
            ng-class="{ 'rv-control-active': control.selected() }"
            ng-click="control.action($event)">
            <md-tooltip md-direction="left">{{ control.tooltip | translate }}</md-tooltip>
            <md-icon>
                <svg xmlns="http://www.w3.org/2000/svg" fit="" height="100%" width="100%" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24" focusable="false">
                <g id="drawicon{{control.name}}" ng-init="control.createIcon()"><path id="path{{control.name}}" d=""></path></g></svg>
            </md-icon>
        </md-button>
        <!-- this will insert divider after every element except the last one -->
        <md-divider ng-if="!$last" ng-repeat-end></md-divider>
        <input id="rvUploadGraphics" class="ng-hide" type="file" accept=".fgpv"></input>
    </div>
</div>
<span class="rv-spacer"></span>
`;
