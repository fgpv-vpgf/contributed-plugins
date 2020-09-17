import {
    DESC_BAR_TEMPLATE,
    LOCK_BAR_TEMPLATE,
    LOOP_BAR_TEMPLATE,
    PLAY_BAR_TEMPLATE,
    REFRESH_BAR_TEMPLATE,
    DELAY_BAR_TEMPLATE,
    EXPORT_BAR_TEMPLATE
} from './template';

import { SliderControls } from './slider-controls';
import { SliderBar } from './slider-bar';
import { Range } from './index';

import { take } from 'rxjs/internal/operators/take';

/**
 * Manage slider panel and bar creation.
 */
export class SliderManager {
    private _mapApi: any;
    private _panel: any;
    private _config: any;
    private _myBundle: any;
    private _slider: SliderBar;
    private _attRead: number = 0;

     /**
     * Slider manager constructor
     * @constructor
     * @param {Any} mapApi the viewer api
     * @param {Any} panel the slider panel
     * @param {Any} config the slider configuration
     * @param {Any} myBundle the esri dependencies bundle
     */
    constructor(mapApi: any, panel: any, config: any, myBundle: any) {
        this._mapApi = mapApi;
        this._panel = panel;
        this._config = config;
        this._myBundle = myBundle;

        // get array of id(s) and set layer(s)
        let ids: string[] = this._config.layers.map(layer => layer.id);
        const layers: Layer[] = [];
        let nbLayers: number = 0;

        // when a layer is added to the check if it is a needed one
        // TODO: There is a bug in 3.3.x where the aray of layer is not define for WMS-T sample and make it crash. Use version 3.2 solve the problem for the moment
        // but is not a suitable solution. Will have to get back to ECCC
        // Happend only with http://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0r-t.cgi
        this._mapApi.layersObj.layerAdded.subscribe((layer: any) => {
            // if it is the right layer, add it to the array of layers
            if (ids.indexOf(layer.id) !== -1) {
                nbLayers += 1;

                // find layer info, then add it and the layer to the array of layers
                const layerInfo = this._config.layers.find(i => i.id === layer.id);
                layers.push({ layer, layerInfo });

                // if all layers are loaded, initialize slider creation
                if (nbLayers === this._config.layers.length) {
                    this.initializeSlider(layers);

                    const layersInfo = layers.map((item) => { return `${item.layer.name} (${item.layerInfo.field})` }).join(', ');
                    document.getElementsByClassName('slider-desc-layers')[0].textContent = layersInfo;

                    // add the description from config file and check if it is a esri image layer and add the note
                    const imageIndex = layers.findIndex(item => { return item.layer._layerType === 'esriImage'; });
                    const sliderImage: string[] = [];
                    if (imageIndex >= 0) { sliderImage.push(this._config.translations.bar.esriImageNote)}
                    if (this._config.description !== '') { sliderImage.unshift(this._config.description); }

                    document.getElementsByClassName('slider-desc-info')[0].textContent =  `${sliderImage.join(', ')}`;
                }
            } else if (ids.length === 0) {
                // if there is no configured layer, check if the new added layer has a time info
                // if so, create the time slider from it
                new Promise(resolve => {
                    $.ajax({
                        url: (layer.type === 'esriFeature') ? `${layer.esriLayer.url}?f=json`: `${layer.esriLayer.url}/${layer._layerIndex}?f=json`,
                        cache: false,
                        dataType: 'jsonp',
                        success: data => resolve(data)
                    });
                }).then(data => {
                    if (typeof (<any>data).timeInfo !== 'undefined') {
                        const layerInfo = { id: layer.id, field: (<any>data).timeInfo.startTimeField }
                        layers.push({ layer, layerInfo });
                        this._config.layers = [layerInfo];
                        this.initializeSlider(layers);
                        document.getElementsByClassName('slider-desc-layers')[0].textContent = `${layer.name} (${layerInfo.field})`;

                        // add one item to ids so a new layer will not initialize a new slider
                        ids = ['done'];
                    }
                })
            }
        });
    }

    /**
     * Initialize slider creation when all layers are loaded
     * @function initializeSlider
     * @param {Layer[]} layers the array of layer and layerInfo
     */
    initializeSlider(layers: Layer[]): void {
        // initialize slider bar
        this._slider = new SliderBar(this._mapApi, this._config, this._myBundle);

        // if limit are set, we do not have to query attributes to find this info so start slider
        // NOTE: WMS layer always need to have limit define
        if (this._config.limit.min !== null) {
            // initialize limit and range if not done from layer attributes
            this._slider.limit = this._config.limit;
            this._slider.range = this._config.range.min !== null ? this._config.range : this._config.limit;
            this.setSliderBar();
        } else {
            for (let item of layers) {
                // we only support esri layer (dynamic and feature) to get the attributes
                const layerType = item.layer.type;
                if (layerType === 'esriDynamic' || layerType === 'esriFeature') {
                    const attrs = item.layer.getAttributes();
                    if (attrs.length === 0) {
                        this.startAttributesEvent(item.layerInfo, layers.length);
                    }
                }
            }
        }
    }

    /**
     * Launch the attributesAdded subscription event
     * @function startAttributesEvent
     * @param {LayerInfo} layerInfo the info to get the attributes
     * @param {Number} nbLayers the number of layers to check
     */
    startAttributesEvent(layerInfo: LayerInfo, nbLayers: number): void {
        this._mapApi.layers.attributesAdded.pipe(take(1)).subscribe((attrPipe: AttributePipe) => {
            this.setAttributes(attrPipe, layerInfo, nbLayers);
        });
    }

    /**
     * Set attributes from the resolve event of startAttributesEvent. Wween need to launch
     * startAttributesEvent for every needed layer
     * @function setAttributes
     * @param {AttributePipe} attrPipe the object returned by the attributesAdded event
     * @param {LayerInfo} layerInfo the info to get the attributes
     * @param {Number} nbLayers the number of layers to check
     */
    setAttributes(attrPipe: AttributePipe, layerInfo: LayerInfo, nbLayers: number): void {
        // if there is attributes and it is the needed layer get the values
        // if not, relaunch startAttributesEvent 
        if (attrPipe.attributes.length > 0 && attrPipe.layer.id === layerInfo.id) {
            this._attRead += 1;

            // get attributes value for specified field
            const values = [];
            for (let row of attrPipe.attributes) { values.push(row[layerInfo.field]); }

            // set limit and range if not set from configuration. Also update if limit are higher of lower then actual values
            const limit: Range = { min: Math.min.apply(null, values), max: Math.max.apply(null, values) };
            if (this._slider.limit.min === null || this._slider.limit.min > limit.min) { this._slider.limit.min = limit.min; }
            if (this._slider.limit.max === null || this._slider.limit.max < limit.max) { this._slider.limit.max = limit.max; } 
            this._slider.range = this._config.range.min !== null ? this._config.range : this._slider.limit;

            // if all layers are set, start slider creation
            if (nbLayers === this._attRead) { this.setSliderBar(); }
        } else {
            this.startAttributesEvent(layerInfo, nbLayers)
        }
    }
    
    /**
     * Set slider bar
     * @function setSliderBar
     */
    setSliderBar(): void {
        // initialiaze slider bar
        this._slider.startSlider(this._config.type, this._config.language);

        // set bar controls then check if the panel should be open and if the slider is in autorun
        this.setBarControls(this._config.controls);
        if (this._config.open) { this._panel.open(); }
        if (this._config.autorun) { this._slider.play(true); }
    }

    /**
     * Set slider bar controls
     * @function setBarControls
     * @param {String[]} the array of controls to initialize
     */
    setBarControls(controls: string[]): void {
        // set templates to initialize
        const templates = [
            PLAY_BAR_TEMPLATE
        ];

        // add controls from configuration
        for (let ctrl of controls) {
            if (ctrl === 'lock') { templates.unshift(LOCK_BAR_TEMPLATE); }
            else if (ctrl === 'loop') { templates.push(LOOP_BAR_TEMPLATE); }
            else if (ctrl === 'refresh') { templates.push(REFRESH_BAR_TEMPLATE); }
            else if (ctrl === 'delay') { templates.push(DELAY_BAR_TEMPLATE); }
            else if (ctrl === 'export') { templates.push(EXPORT_BAR_TEMPLATE); }
        }

        // add the description control to show/hide info
        templates.unshift(DESC_BAR_TEMPLATE);

        // create slider bar controls
        this._panel.controls = new SliderControls(this._mapApi, this._panel, templates, this._slider);
    }
}

interface Layer {
    layer: any;
    layerInfo: LayerInfo;
}

interface LayerInfo {
    id: string;
    field: string;
}

interface AttributePipe {
    layer: any;
    attributes: object[];
}