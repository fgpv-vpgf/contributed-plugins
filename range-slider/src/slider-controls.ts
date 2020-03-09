import { SliderBar } from './slider-bar';

export class SliderControls {

    /**
     * Slider controls constructor
     * @constructor
     * @param {Any} mapApi the viewer api
     * @param {Any} panelManager the Panel Manager class
     * @param {String[]} templates the controls template
     * @param {SliderBar} slider the slider bar
     */
    constructor(mapApi: any, panelManager: any, templates: string[], slider: SliderBar) {
        this.mapApi = mapApi;

        mapApi.agControllerRegister('LockSliderCtrl', function() {
            this.isLocked = slider.lock;

            // toggle lock setting to lock left anchor
            this.lock = () => {
                slider.lock = !slider.lock;
                this.isLocked = slider.lock;
            };
        });

        mapApi.agControllerRegister('LoopSliderCtrl', function() {
            this.isLooped = slider.loop;

            // toggle loop setting to play animation in loop
            this.loop = () => {
                slider.loop = !slider.loop;
                this.isLooped = slider.loop;

                // set class to show if button is active/inactive
                const elem = mapApi.fgpMapObj.esriMap.root.parentElement.parentElement.getElementsByClassName('slider-loop-control')[0];
                elem.getElementsByTagName('md-icon')[0].classList.toggle('slider-loop-control-active');
            };
        });

        mapApi.agControllerRegister('StepSliderCtrl', function() {
            // step previous or next
            this.step = (direction: string) => { slider.step(direction); }
        });

        mapApi.agControllerRegister('PlaySliderCtrl', function() {
            // get play state from observable
            SliderBar.getPlayState().subscribe(value => {
                this.isPlaying = value;
            });

            // start play
            this.play = () => {
                slider.play(!this.isPlaying);
            }
        });

        mapApi.agControllerRegister('RefreshSliderCtrl', function() {
            this.refresh = () => { slider.refresh(); }
        });

        mapApi.agControllerRegister('DelaySliderCtrl', function() {
            // set selected delay
            this.selectedDelay = slider.delay;
            this.selectDelay = () => { slider.delay =  this.selectedDelay; }
        });

        mapApi.agControllerRegister('ExportSliderCtrl', function() {
            // toggle export gif switch
            this.export = slider.export;
            this.selectExport = () => { slider.export = this.export; }
        });

        // loop trought array of controls to add then add them
        const barControls = panelManager.body.find('.slider-controls');
        for (let template of templates) {
            if (template.includes('slider-delay-control')) {
                // add delay control to play control div
                barControls.find('.slider-play-control').append(this.compileTemplate(template));
            } else if (template.includes('slider-loop-control')) {
                // add loop control to play control div
                barControls.find('.slider-play-control').prepend(this.compileTemplate(template));
            } else {
                barControls.append(this.compileTemplate(template));
            }
        }
    }

    /**
     * Compile template to link controller and html
     * @function compileTemplate
     * @param {String} template measure control
     * @return {JQuery<HTMLElement>} temp compile template
     */
    compileTemplate(template: string): JQuery<HTMLElement> {
        let temp = $(template);
        this.mapApi.$compile(temp);
        return temp;
    }
}
export interface SliderControls {
    mapApi: any;
}