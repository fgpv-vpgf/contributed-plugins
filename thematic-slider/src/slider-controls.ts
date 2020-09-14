import {
    PLAY_BAR_TEMPLATE,
    DESCRIPTION_TEMPLATE
} from './template';

import { SliderPanel, SliderDescription } from './slider-panel';

export class SliderControls {
    private _mapApi: any;
    private _panelControls: JQuery<HTMLElement>[] = [];

    get activeControls(): JQuery<HTMLElement>[] {
        return this._panelControls;
    }

    /**
     * Controllers constructor
     * @constructor
     * @param {Any} mapApi the viewer api
     * @param {SliderPanel} slider the slider panel class access play and step functions
     * @param {String} controls the controls to enable
     */
    constructor(mapApi: any, slider: SliderPanel, controls: string) {
        this._mapApi = mapApi;

        // check if we need to add the description control
        if (controls === 'desc' || controls === 'both') {
            this._mapApi.agControllerRegister('DescriptionCtrl', function() {
                SliderPanel.getDescription().subscribe((value: SliderDescription) => {
                    // get active description and index from observable and force update
                    this.description = value.desc;
                    this.index = value.index;
                });

                // get legend state from observable and force update
                SliderPanel.getLegendState().subscribe(value => {
                    this.isLegend = value;
                });
            });

            this._panelControls.push(this.compileTemplate(DESCRIPTION_TEMPLATE));
        }

        // check if we need to add the description control
        if (controls === 'both') {
            this._mapApi.agControllerRegister('BarCtrl', function() {
                // get play stateif first or last item from observable and force update
                // to disable\enable step up and step down
                SliderPanel.getLastStep().subscribe(value => {
                    this.isLast = value;
                });

                // step previous or next
                this.step = (direction: string) => { slider.step(direction); }

                // get play state from observable and force update
                // to switch between play - pause button
                SliderPanel.getPlayState().subscribe(value => {
                    this.isPlaying = value;
                });

                // start play
                this.play = () => {
                    this.isPlaying = !this.isPlaying;
                    slider.play(this.isPlaying);
                }
            });

            this._panelControls.push(this.compileTemplate(PLAY_BAR_TEMPLATE));
        }
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