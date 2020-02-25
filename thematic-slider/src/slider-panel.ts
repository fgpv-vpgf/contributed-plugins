import { SLIDER_TEMPLATE } from './template';
import { SliderControls } from './slider-controls';

import { Observable, BehaviorSubject } from 'rxjs';

import {
    PLAY_BAR_TEMPLATE,
    DESCRIPTION_TEMPLATE
} from './template';

export class SliderPanel {
    private _mapApi: any;
    private _panelSlider: any;
    private _panelOptionsSlider: object = { bottom: '0em', width: '400px', top: '50px' };

    private _index: number = 0;
    private _layers: Layers[];

    private _playTimeout: any;

    private _layerNb: number = 0;

    private _loop: boolean = false;
    private _stack: boolean = false;

    // *** Static observable for the class ***
    // observable to detect play/pause modification
    static _playState: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    static getPlayState(): Observable<boolean> {
        return this._playState.asObservable();
    }
    private static setPlayState(newValue: boolean): void {
        this._playState.next(newValue);
    }

    // observable to detect description modification
    static _description: BehaviorSubject<object> = new BehaviorSubject<object>({});
    static getDescription(): Observable<object> {
        return this._description.asObservable();
    }
    private static setDescription(newValue: object): void {
        this._description.next(newValue);
    }

    // observable to detect first or last step
    static _end: BehaviorSubject<string> = new BehaviorSubject<string>('down');;
    static getLastStep(): Observable<string> {
        return this._end.asObservable();
    }
    private static setLastStep(newValue: string): void {
        this._end.next(newValue);
    }
    // ***************

    // property to get the active layer from index
    private get active(): Layers {
        return this._layers[this._index];
    }

    /**
     * Slider panel constructor
     * @constructor
     * @param {Any} mapApi the viewer api
     * @param {Any} config the slider configuration
     */
    constructor(mapApi: any, config: any) {
        this._mapApi = mapApi;

        // create panel
        this._panelSlider = this._mapApi.panels.create('thematicSlider');
        this._panelSlider.element.css(this._panelOptionsSlider);
        this._panelSlider.body = SLIDER_TEMPLATE;

        // init panel title and description with the first element 
        this._layers = config.layers;
        this.setPanelInfo();

        // check if all layers are loaded before starting the animation
        this._mapApi.layersObj.layerAdded.subscribe((addedLayer: any) => {
            // check if loaded layer is inside the config
            this._layers.find((layer: any) => { if (layer.id === addedLayer.id) { this._layerNb++; }});

            // if all layers are loaded
            if (this._layerNb === this._layers.length) {
                this.setLayerVisibility();

                // set slider control (loop and stack) value
                this._loop = config.loop;
                this._stack = config.stack;

                // check what controls we need (nothing, description or both)
                const initControls:string = (config.slider && config.description) ? 'both' : config.description ? 'desc' : '';
                this.addControls(initControls);
                
                // check if the panel should be open and if the slider is in autorun
                if (config.open) { this.open(); }
                if (config.autorun) { this.play(true); }
            }
        });

        return this;
    }

    /**
     * Open the panel
     * @function open
     */
    open() { this._panelSlider.open(); }

    /**
     * Close the panel
     * @function close
     */
    close() { this._panelSlider.close(); }

    /**
     * Add controls (slider bar and description
     * @function addControls
     * @param {String} controls the controls to add
     */
    private addControls(controls: string) {
        const sliderControls = new SliderControls(this._mapApi, this, controls);
        for (let control of sliderControls.activeControls) {
            this._panelSlider.body.append(control);
        }
    }

    /**
     * Set the panel info with the active layer
     * @function setPanelInfo
     */
    private setPanelInfo() {
        this._panelSlider.header.title = this.active.title;
        SliderPanel.setDescription({ desc: this.active.description, index: `${this._index + 1}/${this._layers.length}` });
    }

    /**
     * Step the panel information and layer visibility up or down
     * @function step
     * @param {String} direction the direction to step
     * @return {Boolean} true if last or first element of the array, false otherwise
     */
    step(direction: string = 'up') {
        let lastStep = true;
        if (direction === 'up' && this._index < this._layers.length - 1) {
            this._index++;
            lastStep = false;
        } else if (direction === 'down' && this._index !== 0) {
            this._index--;
            lastStep = false;
        } else if (this._loop) {
            this._index = 0;
            lastStep = false;
        }

        // set panel info and layers visibility
        this.setPanelInfo();
        this.setLayerVisibility();

        // check if you need to enable/disable step buttons and push the info to the observable
        const enableButtons = (this._index > 0 && this._index < this._layers.length - 1) ? '' : (this._index === 0) ? 'down' : 'up';
        SliderPanel.setLastStep(enableButtons);

        return lastStep;
    }

    /**
     * Set layers visibility
     * @function setLayerVisibility
     */
    private setLayerVisibility() {
        // loop trought layers to set all of them off
        for (let layer of this._layers) {
            this._mapApi.layersObj.getLayersById(layer.id).forEach(layer => layer.visibility = false);
        }

        // if not stack, use only the active layer
        // if stack, set visible all layers from 0  to the active one
        if (!this._stack) {
            this._mapApi.layersObj.getLayersById(this.active.id).forEach(layer => layer.visibility = true);
        } else {
            for (let layer of this._layers.slice(0, this._index + 1)) {
                this._mapApi.layersObj.getLayersById(layer.id).forEach(layer => layer.visibility = true);
            }
        }
    }

    /**
     * Set play or pause state. Play will call step function with up calues at the interval from the configuration
     * @function play
     * @param {Boolean} isPlaying state to put the slider to
     */
    play(isPlaying: boolean) {
        SliderPanel.setPlayState(isPlaying);

        if (isPlaying) {
            // if index = last, re init the slider.
            // otherwise, continue where it is
            this._index =  (this._index === this._layers.length - 1) ? 0 : this._index;
            this.setPanelInfo();

            // timeout function to play the slider with the duration provided within configuration
            setTimeout(this.setPlayInterval, this.active.duration, this);

        } else { clearInterval(this._playTimeout); }
    }

    /**
     * Set play (call step) with the proper interval
     * @function setPlayInterval
     * @param {SliderPanel} that sthe slider class to access within the interval function
     */
    private setPlayInterval(that) {
        // step and get if it is the last step then clear the interval before we create a new one
        const last = that.step();
        clearInterval(that._playTimeout);

        // if not the last, call this function again in ... seconds from configuration 
        if (!last) {
            that._playTimeout = setInterval(that.setPlayInterval, (<any>that).active.duration, that);
        } else { that.setPlayState(false); }
    }
}

interface Layers {
    id: string;
    duration: number;
    title: string;
    description: string;
}

export interface SliderDescription {
    desc: string;
    index: string;
}
export interface SliderPanel {
    description: SliderDescription
}