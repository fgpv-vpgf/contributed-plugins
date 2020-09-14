import { SLIDER_TEMPLATE } from './template';
import { SliderControls } from './slider-controls';

import { Observable, BehaviorSubject } from 'rxjs';

export class SliderPanel {
    private _mapApi: any;
    private _altText: string;
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

    // observable to detect play/pause modification
    static _legendState: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    static getLegendState(): Observable<boolean> {
        return this._legendState.asObservable();
    }
    private static setLegendState(newValue: boolean): void {
        this._legendState.next(newValue);
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
     * @param {String} altText the alternate text ot add to legend image
     */
    constructor(mapApi: any, config: any, altText: string) {
        this._mapApi = mapApi;
        this._altText = altText

        // create panel
        this._panelSlider = this._mapApi.panels.create('thematicSlider');
        this._panelSlider.element.css(this._panelOptionsSlider);
        this._panelSlider.body = SLIDER_TEMPLATE;

        // set layers from config
        this._layers = config.layers;

        // check if all layers are loaded before starting the animation
        this._mapApi.layersObj.layerAdded.subscribe((addedLayer: any) => {
            // check if loaded layer is inside the config
            this._layers.find((layer: any) => { if (layer.id === addedLayer.id) { this._layerNb++; }});

            // if all layers are loaded
            if (this._layerNb === this._layers.length) {
                // set Legend state (open by default)
                SliderPanel.setLegendState(true);

                // init panel title and description with the first element
                this.setPanelInfo();

                // apply a timeout with 1000, if not, the legend section is not aviallable
                setTimeout(() => {
                    this.setPanelLegend();

                    // check if the panel should be open and if the slider is in autorun
                    if (config.open) { this.open(); }
                    if (config.autorun) { this.play(true); }
                }, 1000);

                // set layer visibility
                this.setLayerVisibility();

                // set slider control (loop and stack) value
                this._loop = config.loop;
                this._stack = config.stack;

                // check what controls we need (nothing, description or both)
                const initControls:string = (config.slider && config.description) ? 'both' : config.description ? 'desc' : '';
                this.addControls(initControls);
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
     * Add controls (slider bar and description)
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
        // set title
        this._panelSlider.header.title = this.active.title;

        // set panel content, it will create the legend section
        SliderPanel.setDescription({ desc: this.active.description, index: `${this._index + 1}/${this._layers.length}` });
    }

    /**
     * Set the panel legend with the active layer
     * @function setPanelLegend
     */
    private setPanelLegend() {
        // if legend element array is empty, create default legend, otherwise use configuration
        let stack = '';
        if (this.active.legend.length === 0) {
            stack = this.getDefaultLegend();
        } else {
            stack = this.getCustomLegend();
        }

        if ($('.rv-thslider-legend').length > 0) {
            $('.rv-thslider-legend')[0].innerHTML = stack;
        }
    }

    getCustomLegend(): string {
        let stack = '';
        for (let entry of this.active.legend) {
            const image = (entry as any).image;

            // get ratio
            if (image.width > 150) {
                image.height = image.height * (150 / image.width);
                image.width = 150;
            }

            stack += `<div class="rv-thslider-symbol" style="min-height:${image.height}px">
                        <img style="padding-right:10px;width:${image.width}px;height:${image.height}px" src="${image.url}" alt="${this._altText}" title="${(entry as any).label}">
                        <span>${(entry as any).label}</span>
                    </div>`
        }

        return stack
    }

    /**
     * Get the default legend when it is not define inside configuration
     * @function getDefaultLegend
     * @return {String} the html to add to legend section
     */
    private getDefaultLegend(): string {
        // add the legend to description panel, first find the right entry
        let stack = '';
        const that = this;
        const legendBlocks = this._mapApi.layersObj._layersArray[this._index]._mapInstance._legendBlocks.entries.find((entry) => {
            return entry._layerRecordId === that._layers[that._index].id;
        });

        // Check block type and loop through nodes
        if (legendBlocks.blockType === 'node') {
            stack = this.getSymbology(legendBlocks._symbologyStack.stack);
        } else {
            for (let entry of legendBlocks.entries) {
                if (entry.blockType === 'node') {
                    stack += this.getSymbology(entry._symbologyStack.stack);
                }
            }
        }

        return stack;
    }

    /**
     * Get the symbology stack to add to legend section
     * @function getSymbology
     * @param {Object} stack symbology stack from legend entry block
     * @return {String} the html to add to legend section
     */
    private getSymbology(stack: any): string  {
        let legend = '';

        const parser = new DOMParser();
        for (let svg of stack) {
            // get view box so we can modify image size
            const doc = parser.parseFromString(svg.svgcode, 'text/html');
            const size = doc.querySelector('svg').getAttribute('viewBox').split(' ').slice(2).map((x) => { return parseInt(x, 10); })

            legend += `<div class="rv-thslider-symbol" style="min-height:${size[1]}px">
                            ${[svg.svgcode.slice(0, 5), `style="min-width:${size[0]}px;min-height:${size[1]}px"`, svg.svgcode.slice(4)].join('')}
                            <span>${svg.name}</span>
                        </div>`
        }

        return legend;
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
        // if stack, set visible all layers from 0 to the active one
        if (!this._stack) {
            this._mapApi.layersObj.getLayersById(this.active.id).forEach(layer => layer.visibility = true);
        } else {
            for (let layer of this._layers.slice(0, this._index + 1)) {
                this._mapApi.layersObj.getLayersById(layer.id).forEach(layer => layer.visibility = true);
            }
        }
    }

    /**
     * Set play or pause state. Play will call step function with up value at the interval from the configuration
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
     * @param {SliderPanel} that the slider class to access within the interval function
     */
    private setPlayInterval(that) {
        // step and get if it is the last step then clear the interval before we create a new one
        const last = that.step();
        clearInterval(that._playTimeout);

        // if not the last, call this function again in ... seconds from configuration 
        if (!last) {
            that._playTimeout = setInterval(that.setPlayInterval, (<any>that).active.duration, that);
        } else { that.play(false); }
    }
}

interface Layers {
    id: string;
    duration: number;
    title: string;
    legend: object[];
    description: string;
}

export interface SliderDescription {
    desc: string;
    index: string;
}
export interface SliderPanel {
    description: SliderDescription
}