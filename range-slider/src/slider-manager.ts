import {
    DESC_BAR_TEMPLATE,
    LOCK_BAR_TEMPLATE,
    LOOP_BAR_TEMPLATE,
    REVERSE_BAR_TEMPLATE,
    PLAY_BAR_TEMPLATE,
    REFRESH_BAR_TEMPLATE,
    DELAY_BAR_TEMPLATE,
    EXPORT_BAR_TEMPLATE,
    SLIDER_TEMPLATE
} from './template';

import { SliderControls } from './slider-controls';
import { SliderBar } from './slider-bar';

import { Parser } from 'xml2js';

const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const duration = require('dayjs/plugin/duration');
dayjs.extend(utc);
dayjs.extend(duration);

interface Layer {
    layer: any;
    layerInfo: LayerInfo;
}

interface LayerInfo {
    id: string;
    field: string;
    isTimeAware: boolean;
}

/**
 * Manage slider panel and bar creation.
 */
export class SliderManager {
    private _mapApi: any;
    private _panel: any;
    private _config: any;
    private _myBundle: any;
    private _panelOptions: any;
    private _slider: SliderBar;
    private _ids: string[];
    private _activeIds: string[];

    destroy: any;
    private _layers: Layer[] = [];

    private _button: any;

    private _xmlParser: any;
    private _presentPlayStateStopped: Boolean;

     /**
     * Slider manager constructor
     * @constructor
     * @param {Any} mapApi the viewer api
     * @param {Any} panel the slider panel
     * @param {Any} config the slider configuration
     * @param {Any} myBundle the esri dependencies bundle
     * @param {Any} panelOptions the css to apply to the panel
     */
    constructor(mapApi: any, panel: any, config: any, myBundle: any, panelOptions: any) {
        this._mapApi = mapApi;
        this._panel = panel;
        this._config = config;
        this._myBundle = myBundle;
        this._panelOptions = panelOptions;

        this.destroy = this.destroyPluginSliderAll;

        // setup the xml to json parser use to read WMS getCap
        this._xmlParser = new Parser({
            normalizeTags: true,
            explicitArray: true
        });

        // get array of id(s) and set layer(s)
        this._ids = this._config.layers.map(layer => layer.id);
        this._layers = [];
        let nbLayers: number = 0;

        // variable to check if a layer is in process of loading (no config)
        let layerId = '';
        let index = -1;
        let timerId = undefined;

        // when a layer is added, check if it is a needed one
        this._mapApi.layersObj.layerAdded.subscribe((layer: any) => {
            // if it is the right layer, add it to the array of layers
            if (this._config.layers.length > 0 && this._ids.indexOf(layer.id) !== -1) {
                nbLayers += 1;

                // find layer info, then add it and the layer to the array of layers
                const layerInfo = this._config.layers.find(i => i.id === layer.id);
                this._layers.push({ layer, layerInfo });

                // if all layers are loaded, setup the configuration
                // ! if layer not loaded and config start, it will fail because definition query can't be set!
                if (nbLayers === this._config.layers.length) {
                    this.setupConfiguredLayer(this._layers);
                }
            } else if ((this._config.layers.length === 0 || !this._config.autoinit) && typeof layer.type !== 'undefined') {
                if (this._config.autoinit) this._layers.length = 0;

                // if there is no configured layer, check if the new added layer is time aware
                // initialize the layer name so we set index and timer only once
                if (layerId === '') {
                    index = (layer.type === 'esriFeature' || layer.type === 'esriImage') ? 0 : 
                        typeof layer._viewerLayer.layerInfos !== 'undefined' ?
                        layer._viewerLayer.layerInfos.findIndex(item => item.name === layer._viewerLayer.initialConfig.layerEntries[0].name) :
                        layer._viewerLayer.esriLayer.layerInfos.findIndex(item => item.name === layer._viewerLayer.initialConfig.layerEntries[0].name);
                    layerId = layer.id
                }

                // set wmst type for the slider if the layer is wms
                if (layer.type === 'ogcWms') this._config.type = 'wmst';

                // create layer info
                // ! we assume it is time aware, we will query metadata to know if it is the case
                const layerInfo = { id: layer.id, field: '', isTimeAware: true }
                this._layers.push({ layer, layerInfo });

                if (this._config.autoinit) this._config.layers.push(layerInfo);

                // create a timer to start init if the number of layers selected is less then the number of layer in the service
                if (typeof timerId === 'undefined') {
                    if (this._config.autoinit) timerId = setTimeout(() => this.setupConfiguredLayer(this._layers), 3000);
                }

                // if all layers from the service are loaded, clear the timeout then init
                index--;
                if (index < 0) {
                    clearTimeout(timerId);
                    if (this._config.autoinit) this.setupConfiguredLayer(this._layers);
                }

                // add one item to this._ids so a new layer will not initialize a new slider
                this._ids = ['done'];
            }
        });

        // when we remove a layer check if we need to remove the slider
        this._mapApi.layersObj.layerRemoved.subscribe((layer: any) => {
            // check if the removed layer is the active slider, if so destroy slider
            const index = this._activeIds.findIndex(id => { return id === layer.id })
            if (index > -1) this.destroyPluginSlider(layer, this._ids, nbLayers);

            // remove layer form array
            this._layers =  this._layers.filter(object => {
                return object.layerInfo.id !== layer._id;
            });
        });

        return this._button;
    }


    /**
     * Destroy the slider for selected layer layers
     * @function destroyPluginSlider
     * @param {Layer} layer Layer to remove
     * @param {Number[]} ids Array of layers id
     * @param {Number} nbLayers Number of layers
     */
    destroyPluginSlider(layer, ids, nbLayers) {
        try {
            // case for configure layer.... remove from array
            if (typeof ids !== 'undefined' && ids.length > 0) {
                const index = ids.indexOf(layer.id);
                if (index !== -1) {
                    ids.splice(index, 1);
                    this._layers.splice(index, 1);
                    nbLayers--;
                }
            }

            // reset the config object and parameters
            this._config.type = 'date';
            this._config.range = { min: null, max: null };
            this._config.limit = { min: null, max: null };
            this._config.limits = [];
            this._config.units = '';
            this._config.description = '';
            this._config.layers = [];

            // empty ids and layers so the plugins will reset themself from a time aware layer
            ids = [];

            // if array is empty or it was a time aware added layer destroy
            if (ids.length === 0 || ids[0] === 'done') {
                // reset the definition query and destroy the plugin
                if (typeof this._slider !== 'undefined') {
                    this._slider.resetDefinitionQuery();
                    this._panel.destroy();
                    document.querySelector(`[aria-label="${this._button.label}"]`).remove();
                    this._slider.destroy();
                }

                // reset active ids
                this._activeIds = [];
            }
        } catch (error) {}
    }

     /**
     * Destroy the slider for all layers
     * @function destroyPluginSliderAll
     */
    destroyPluginSliderAll() {
        try {
            this._slider.resetDefinitionQuery();

            // reset the config object and parameters
            this._config.type = 'date';
            this._config.type = 'date';
            this._config.stepType = 'dynamic';
            this._config.rangeType = 'dual';
            this._config.startRangeEnd = false;
            this._config.rangeInterval = -1;
            this._config.precision = '0';

            this._config.range = { min: null, max: null };
            this._config.limit = { min: null, max: null, staticItems: [] };
            this._config.limits = [];
            this._config.units = '';
            this._config.description = '';
            this._config.layers = [];
            this._config.params = {};

            this._ids = [];

            // reset active ids

            this._activeIds = [];

            if (typeof this._slider !== 'undefined') {
                this._panel.destroy();
                document.querySelector(`[aria-label="${this._button.label}"]`).remove();
                if (typeof document.getElementsByClassName('slider-desc-layers')[0] !== 'undefined') document.getElementsByClassName('slider-desc-layers')[0].textContent = '';
                this._slider.destroy();
            }
        } catch (error) {}
    }

    /**
     * Setup configured layers
     * @function setupConfiguredLayer
     * @param {Layer[]} layers Array of layers to setup
     */
    setupConfiguredLayer(layers: Layer[]): void {
        if (!this._config.autoinit) {
            this.destroyPluginSliderAll();
            this._config.layers.push(layers[0].layerInfo);
            this._config.type = (layers[0].layer.type === 'ogcWms') ? 'wmst' : 'date';
        }

        // set active layers
        this._activeIds = layers.map(layer => layer.layerInfo.id);

        // create panel
        this._panel = this._mapApi.panels.create('rangeSlider');
        this._panel.element.css(this._panelOptions);
        this._panel.body = SLIDER_TEMPLATE;

        // setup limits
        this.setupLimits(layers);
    }

    /**
     * Setup limits and range object
     * @function setupLimits
     * @param {Layer[]} layers Array of layers to setup limit and range
     */
    setupLimits(layers: Layer[]): void {
        // check if limits are initialized inside the configuration file. If not read the services to extract.
        if (this._config.limit.min === null || this._config.limit.max === null) {
            const promises = [];
            for (let item of layers) {
                const layerType = item.layer.type;

                // will be use if the user doesn't specified if layer as time aware. If time aware, information will be extracted from time dimension
                if (item.layerInfo.isTimeAware) {
                    if (layerType === 'esriDynamic' || layerType === 'esriFeature' || layerType === 'esriImage') {
                        promises.push(this.setTimeESRILimits(item));
                    } else if (layerType === 'ogcWms') {
                        promises.push(this.setTimeWMSLimits(item));
                    }
                } else if (layerType === 'esriDynamic' || layerType === 'esriFeature' || layerType === 'esriImage') {
                    promises.push(this.settNotTimeAwareLimits(item));
                }
            }

            // wait for all promises to resolve then initialize the slider
            Promise.all(promises).then(values => {
                // remove no features value (=== -1)
                values = values.filter(item => item.limits[0] !== -1);

                // only initialize if the promises resolve to something
                if (values[0] !== false) {
                    // set limits
                    this._config.limit.min = Math.min.apply(null, values.map(item => item.limits).flat());
                    this._config.limit.max = Math.max.apply(null, values.map(item => item.limits).flat());

                    // set ranges from interval or from extracted values
                    let range = [];
                    if (this._config.rangeInterval !== -1) {
                        range = [this._config.limit.min, this._config.limit.min + this._config.rangeInterval];
                    } else {
                        range = [Math.min.apply(null, values.map(item => item.range).flat()), Math.max.apply(null, values.map(item => item.range).flat())];
                    }

                    // if range or range interval is not define, set range as the whole limit
                    if (this._config.range.min === null && this._config.range.max === null && this._config.rangeInterval !== -1 &&
                        (!isNaN(range[0]) && !isNaN(range[1]))) {
                        if (!this._config.startRangeEnd) {
                            this._config.range.min = range[0];
                            this._config.range.max = range[1];
                        } else {
                            this._config.range.min = this._config.limit.max - (range[1] - range[0]);
                            this._config.range.max = this._config.limit.max;
                        }
                    } else { this._config.range = this._config.limit; }

                    // set the static item array (remove duplicate) and reorder (not lexicographic so use function)
                    const staticItems = [...new Set(values.map(item => item.staticItems).flat())];
                    this._config.limit.staticItems = typeof staticItems === 'undefined' ? [] : staticItems.sort((a, b) => { return a - b });

                    // filter only added layers
                    const arrIds = this._config.layers.map((item) => { return item.id });
                    const arrLayers = layers.filter(item => arrIds.includes(item.layer.id));

                    try {
                        this.setDescription(arrLayers);
                        this.initializeSlider();
                    } catch (error) {
                        this.destroyPluginSliderAll();
                    }
                }
            });

        } else {
            // set ranges from interval, limits or from range values
            if (this._config.rangeInterval !== -1) {
                if (!this._config.startRangeEnd) {
                    this._config.range.min = this._config.limit.min;
                    this._config.range.max = this._config.limit.min + this._config.rangeInterval;
                } else {
                    this._config.range.min = this._config.limit.max - this._config.rangeInterval;
                    this._config.range.max = this._config.limit.max;
                }
            } else if (this._config.range.min === null || this._config.range.max === null) {
               this._config.range = this._config.limit;
            }

            try {
                this.setDescription(layers);
                this.initializeSlider();
            } catch (error) {
                this.destroyPluginSliderAll();
            }
        }
    }

    /**
     * Set the description section with the field use to parse the extent value
     * @function setDescription
     * @param {Layer[]} layers Array of layers to setup 
     */
    setDescription(layers: Layer[]) {
        // add info for units, layers and field use
        const units = this._config.units !== '' ? ` - ${this._config.translations.bar.unit}: ${this._config.units}` : '';
        const layersInfo = layers.map((item) => { return `${item.layer.name} (${item.layerInfo.field})` });

        // remove duplicate (introduced by layer entries of dynamic or WMS)
        const layersInfoNo = layersInfo.filter(function(value, index, self) { 
            return self.indexOf(value) === index;
        }).join(', ');
        document.getElementsByClassName('slider-desc-layers')[0].textContent = `${layersInfoNo} ${units}`;

        // add the description from config file and check if it is a esri image layer and add the note
        const imageIndex = layers.findIndex(item => { return item.layer._layerType === 'esriImage'; });
        const sliderImage: string[] = [];
        if (imageIndex >= 0) { sliderImage.push(this._config.translations.bar.esriImageNote)}
        if (this._config.description !== '') { sliderImage.unshift(this._config.description); }

        document.getElementsByClassName('slider-desc-info')[0].textContent =  `${sliderImage.join(', ')}`;
    }

    /**
     * Set non time aware service from service metadata (ESRI layer)
     * @function settNotTimeAwareLimits
     * @param {Layer} item the layer item to set limit for
     * @returns {Promise<Object>} a promise with the limits and range info
     */
    settNotTimeAwareLimits(item: Layer): Promise<Object> {
        // get statistic on the field to extrat min and max values for all layers (works for date and number)
        // set range as NaN because we can't set it from layer metadata
        return new Promise(resolve => {
            const stat = `outStatistics=[{'statisticType':'min','onStatisticField':${item.layerInfo.field},'outStatisticFieldName':'rsMIN'},{'statisticType':'max','onStatisticField':${item.layerInfo.field},'outStatisticFieldName':'rsMAX'}]`;
            const uri = (item.layer.type === 'esriFeature') ? `${item.layer.esriLayer.url}/query?${stat}&f=json`: `${item.layer.esriLayer.url}/${item.layer._layerIndex}/query?${stat}&f=json`;

            $.ajax({
                url: encodeURI(uri),
                cache: false,
                dataType: 'jsonp',
                success: data => resolve({
                    range: [NaN, NaN],
                    limits: [typeof data.features[0] !== 'undefined'? data.features[0].attributes.rsMIN : -1, // if not feature set -1
                        typeof data.features[0] !== 'undefined'? data.features[0].attributes.rsMAX : -1]
                })
            });
        });
    }

    /**
     * Set time aware service from service metadata (ESRI layer)
     * @function setTimeESRILimits
     * @param {Layer} item the layer item to set limit for
     * @returns {Promise<Object>} a promise with the limits and range info
     */
    setTimeESRILimits(item: Layer): Promise<Object> {
        return new Promise(resolve => {
            const uri = (item.layer.type === 'esriFeature') ? `${item.layer.esriLayer.url}?f=json`: `${item.layer.esriLayer.url}/${item.layer._layerIndex}?f=json`;
            fetch(encodeURI(uri)).then(response => {
                response.text().then(text => {
                    // TODO: use more info like start and end field for time extent and information to setup static item from TimeInfo
                    // parse to JSON and get timeInfo
                    const timeInfo = JSON.parse(text).timeInfo;

                    if (typeof timeInfo !== 'undefined') {
                        // if time field not set, do it
                        if (item.layerInfo.field === '') item.layerInfo.field = timeInfo.startTimeField;

                        // set limits (round down and up minutes to neareast hour)
                        const limits = timeInfo.timeExtent;
                        limits[0] = new Date(limits[0]).setMinutes(0);

                        // set range (interval)
                        let timeInterval = timeInfo.timeInterval === null || timeInfo.timeInterval === 0 || timeInfo.defaultTimeInterval === null || timeInfo.defaultTimeInterval === 0 ?
                            1 : timeInfo.timeInterval || timeInfo.defaultTimeInterval;
                        const intervals = {
                            esriTimeUnitsHours: 3600000,
                            esriTimeUnitsDays: 86400000,
                            esriTimeUnitsWeeks: 604800000,
                            esriTimeUnitsMonths: 2592000000,
                            esriTimeUnitsYears: 31561920000 // 31536000000 = year ... need to add .25 plus handle 1 day every 4 years
                        }

                        // if type of interval is not define check limits and set a default
                        let interval = intervals[timeInfo.timeIntervalUnits || timeInfo.defaultTimeIntervalUnits];
                        if (typeof interval === 'undefined') {
                            const rangeDays = (limits[1] - limits[0]) / (3600000 * 24);
                            if (rangeDays < 7) {
                                interval =  intervals.esriTimeUnitsHours;
                            } else if (rangeDays < 31) {
                                interval =  intervals.esriTimeUnitsDays;
                            } else if (rangeDays < 60) {
                                interval =  intervals.esriTimeUnitsWeeks;
                            } else if (rangeDays < 365) {
                                interval =  intervals.esriTimeUnitsMonths;
                            } else {
                                interval =  intervals.esriTimeUnitsYears;
                            }
                        }

                        // if delta limits is smaller then a weeks, set precision as hour
                        this._config.precision = ((limits[1] - limits[0]) < 3600000 * 24 * 7) || timeInfo.timeIntervalUnits === 'esriTimeUnitsHours' ? 'hour' : 'date';

                        // apply range from limits
                        timeInterval = (typeof timeInterval !== 'undefined') ? timeInterval : 0.2;
                        const range = [limits[0], limits[0] + (timeInterval * interval)];

                        resolve({ range, limits });
                    } else resolve(false);
                });
            });
        });
    }

    /**
     * Set time aware service from service getCapabilites (WMS-T layer)
     * @function setTimeWMSLimits
     * @param {Layer} item the layer item to set limit for
     * @returns {Promise<Object>} a promise with the limits and range info
     */
    setTimeWMSLimits(item: Layer): Promise<Object> {
        item.layer._viewerLayer.initialConfig.layerEntries[0].globalList = '';
        item.layer._viewerLayer.initialConfig.layerEntries.forEach(item => item.globalList += item._id)
        let subLayersIds = item.layer.esriLayer.layerInfos.map(subLayer => {
            return subLayer.name
        });
        subLayersIds = subLayersIds.filter(id => item.layer._viewerLayer.initialConfig.layerEntries[0].globalList.includes(id))

        return new Promise(resolve => {
            // get proxy value and split the url.
            // ! there is a bug with : https://geo.weather.gc.ca/geomet-climate?lang=en&service=WMS&version=1.3.0&request=GetCapabilities&Layer=CMIP5.SFCWIND.RCP26.ENS.ABS_PCTL5
            // ! the value is not split at ?
            const proxy = typeof this._config.proxyUrl !== 'undefined' ? `${this._config.proxyUrl}?` : '';
            const uri = `${proxy}${item.layer.esriLayer.url.split('?')[0]}?SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0&layer=${subLayersIds.join(',')}`;
            fetch(encodeURI(uri)).then(response => response.text())
            .then(str => this._xmlParser.parseStringPromise(str))
            .then(parsed => {
                // if time field not set, do it
                if (item.layerInfo.field === '') item.layerInfo.field = 'DATE';

                // make sure parsed value is valid and get time dimension
                // TODO: support more dimension like elevation
                const dimensions = (typeof parsed.wms_capabilities !== 'undefined') ?
                    this.getDimensionsWMS(subLayersIds, parsed.wms_capabilities.capability[0].layer[0], []) : [];

                if (dimensions.length !== 0) {
                    let discoveredDimensions = [].concat(...dimensions);

                    // get limits, interval and static items
                    let limits = discoveredDimensions.map(d => d.extent.extent).flat();
                    let arrInterval = discoveredDimensions.map(d => d.extent.interval).flat().filter(Number);
                    let arrStatic = discoveredDimensions.map(d => d.extent.static).flat();

                    // apply range from limits
                    const staticItems = typeof arrStatic !== 'undefined' ? arrStatic : [];
                    let range = [];
                    if (arrInterval.length > 0 && arrInterval[0] !== null) {
                        let startTime = limits[0];
                        let endTime = limits[1]
                        while (startTime <= endTime) {
                            startTime = startTime + arrInterval[0];
                            staticItems.push(startTime);
                        }
                        range = [limits[0], limits[0] + arrInterval[0]];
                    } else {
                        limits = staticItems;
                        range = [limits[0], staticItems[0] + arrInterval[0]];
                        this._config.stepType = 'static';
                    }

                    // check if the range and limits are valid before resolve
                    if (isNaN(limits[0]) || isNaN(limits[1])) {
                        console.log(`Not able to set limits, it needs two valid non identical limits. Check time info format from getCapabilities for this service: ${item.layer.esriLayer.url}?SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0&layer=${subLayersIds.join(',')}`);
                        resolve(false);
                    } else {
                        resolve({ range, limits, staticItems });
                    }
                } else resolve(false);
            })
        });
    }

    /**
     * Get WMS dimension information. Loop trought layers and extract
     * @function getDimensionsWMS
     * @param {String[]} ids arrays of id
     * @param {object} layer getCapabilities layer object 
     * @param {object[]} dimensions array of dimensions info
     * @param {String} dimensionName the dimension name to get info for (optional, time by default)
     * @returns the dimensions object array
     */
    getDimensionsWMS(ids: string[], layer: any, dimensions: any[], dimensionName = 'time'): object[] {
        // process layer
        if (typeof layer.name !== 'undefined' && ids.includes(layer.name[0])) {
            dimensions.push(this.setDimensionLayerDefinition( layer, dimensionName));
        }

        // loop children layers
        if (typeof layer.layer !== 'undefined') {
            for (let childLayer of layer.layer) {
                this.getDimensionsWMS(
                    ids,
                    childLayer,
                    dimensions,
                    dimensionName
                );
            }
        }

        return dimensions;
    };

    /**
     * Set the dimension definition
     * @function setDimensionLayerDefinition
     * @param {object} layer getCapabilities layer object 
     * @param String} dimensionName the dimension name to get info for
     * @returns the dimension object
     */
    setDimensionLayerDefinition (layer, dimensionName): object {
        let layerDimensions = layer.dimension || [];
        let dimensions = layerDimensions
            .filter((l) => {
                let properties = l['$'] || {};
                return properties.name
                ? properties.name.toLowerCase() === dimensionName
                : false;
            })
            .map((l) => {
                let properties = l['$'] || {};
                let content = l['_'];

                this._config.precision = (content.split('T').length === 1) ? 'date' : 'hour';
                this._config.rangeType = (typeof properties.default === 'undefined' || properties.default.split('/').length !== 1) ? 'dual' : 'single';

                return {
                    id: layer.name[0],
                    default: properties.default,
                    multipleValues: Boolean(properties.multipleValues) || false,
                    extent: this.processWMSExtent(content)
                };
            });

        return dimensions[0];
    };

    /**
     * Process time interval (limits, static items and used interval)
     * @function processWMSExtent
     * @param {object} extent the dimension extent information
     * @returns the setup extent limits object
     */
    processWMSExtent(extent: any): object {
        // * Information on how to handle time for Geomet service: https://eccc-msc.github.io/open-data/msc-geomet/web-services_en/#handling-time

        const limits = { extent: [], static: [], interval: null };

        // check if it is and extent (start/end) or multiples values
        if (this.isDiscreteExtent(extent)) {
            limits.static = extent.split(',').map((d) => dayjs.utc(d.trim()).valueOf());
        } else {
            const dynamicExt = extent.split('/');
            limits.extent = [new Date(dynamicExt[0]).getTime(), new Date(dynamicExt[1]).getTime()];

            //! Trap bad format for time info dimension.... will have to refine on new cases arrival
            if (isNaN(limits[1])) {
                if (extent.length === 9) {
                    // it can be this format "2000-2016"
                    const type1 = extent.split('-');
                    limits.extent = [new Date(type1[0]).getTime(), new Date(type1[1]).getTime()];
                } else if (extent.length === 4) {
                    // it can be this format "2015", so just add a second limit (1/2)
                    limits.extent = [new Date(extent).getTime(), new Date(extent).getTime() + (1000 * 60 * 60 * 12)];
                }
            }
            // parse ISO string representation (ex. 'P1Y2M')
            // https://en.wikipedia.org/wiki/ISO_8601
            let isoInterval = dayjs.duration(dynamicExt[2]).$ms;

            // if ISO interval is a year, make it 365.25 + 1 day every 4 years
            if (typeof isoInterval !== 'undefined' && isoInterval === 31536000000) isoInterval = isoInterval + (0.30 * dayjs.duration('P1D').$ms);

            // no interval, find one
            // if interval, generate static value from it
            if (typeof isoInterval === 'undefined') {
                const intervals = {
                    esriTimeUnitsHours: 3600000,
                    esriTimeUnitsDays: 86400000,
                    esriTimeUnitsWeeks: 604800000,
                    esriTimeUnitsMonths: 2592000000,
                    esriTimeUnitsYears: 31561920000 // 31536000000 = year ... need to add .25 plus handle 1 day every 4 years
                }

                const rangeDays = (limits[1] - limits[0]) / (3600000 * 24);
                if (rangeDays < 7) {
                    isoInterval =  intervals.esriTimeUnitsHours;
                } else if (rangeDays < 31) {
                    isoInterval =  intervals.esriTimeUnitsDays;
                } else if (rangeDays < 60) {
                    isoInterval =  intervals.esriTimeUnitsWeeks;
                } else if (rangeDays < 365) {
                    isoInterval =  intervals.esriTimeUnitsMonths;
                } else {
                    isoInterval =  intervals.esriTimeUnitsYears;
                }
            } else {
                // because the interval is define, create static elements and set step to staticInterval
                const start = limits.extent[0];
                const end = limits.extent[1];
                let value = -1;
                let i = 0;

                while (value < end) {
                    i++;
                    value = start + (i * isoInterval);
                    limits.static.push(value);
                }

                // this is a new type and it is use to generate a step from a static interval
                // in this case, the static item array is only use to determine the static interval step
                // TODO: add this to authoring tool for configure item
                this._config.stepType = 'staticInterval';
            }

            // TODO.... do we need
            // // Format duration to its components
            // // (between [] is the string constant for each component)
            // // then split to individual components (ex. '1|y')
            // // and split again to array [1, 'y'], converting value to number
            // // and filtering out NaN for non-existing duration components
            // const arrInterval = isoInterval
            //     .format('Y[|y]-M[|M]-D[|d]-H[|h]-m[|m]-s[|s]')
            //     .split('-')
            //     .map((i) => {
            //         let splitted = i.split("|");
            //             return [Number(splitted[0]), splitted[1]];
            //     })
            //     .filter((i) => !isNaN(i[0]));

            limits.interval = isoInterval;
        }

        return limits
    }

    /**
     * Check if it is a discrete or range extent
     * @function isDiscreteExtent
     * @param {string} strExtent the time extent string
     * @returns a boolean, true if discrete, false otherwise
     */
    isDiscreteExtent(strExtent: string): boolean {
        const arrExtent = strExtent.split(',').map((v) => v.trim());
        return dayjs.utc(arrExtent[0]).isValid() && arrExtent.length > 1;
    };

    /**
     * Initialize slider creation when all layers are loaded
     * @function initializeSlider
     */
    initializeSlider(): void {
        // side menu button
        this.createButtonMenu();

        // initialize slider bar and apply limits/range
        this._slider = new SliderBar(this._mapApi, this._config, this._myBundle);
        this._slider.limit = this._config.limit;
        this._slider.range = this._config.range;
        this.setSliderBar();
    }

    /**
     * Create the menu button once slider is initialized
     * @function createButtonMenu
     */
     createButtonMenu(): void {
        this._button = this._mapApi.mapI.addPluginButton(
            this._config.translations.title, this.onMenuItemClick()
        );
        if (this._config.open) { this._button.isActive = true; }
    }

    /**
     * Event to fire on side menu item click. Open/Close the panel
     * @function onMenuItemClick
     * @return {function} the function to run
     */
    onMenuItemClick(): any {
        return () => {
            if (typeof this._mapApi.panels.getById('rangeSlider') !== 'undefined') {
                this._button.isActive = !this._button.isActive;

                // remove definition query when slider is close and re apply on open
                if (this._button.isActive) {
                    if (this._presentPlayStateStopped) {
                        this._slider.play(true);
                        this._presentPlayStateStopped = false;
                    }
                    this._slider.setDefinitionQuery(this._slider.activeRange);
                    this._panel.open();
                } else {
                    this._slider.resetDefinitionQuery();
                    if (this._slider._isPlaying) {
                        this._presentPlayStateStopped = true;
                        this._slider.pause();
                    }
                    this._panel.close();
                }
            }
        };
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
            else if (ctrl === 'reverse') { templates.push(REVERSE_BAR_TEMPLATE); }
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

// ! Deprecated do not use.... here for future reference
// /**
//  * Launch the attributesAdded subscription event
//  * @function startAttributesEvent
//  * @param {LayerInfo} layerInfo the info to get the attributes
//  * @param {Number} nbLayers the number of layers to check
//  */
// startAttributesEvent(layerInfo: LayerInfo, nbLayers: number): void {
//     this._mapApi.layers.attributesAdded.pipe(take(1)).subscribe((attrPipe: AttributePipe) => {
//         this.setAttributes(attrPipe, layerInfo, nbLayers);
//     });
// }
// /**
//  * Set attributes from the resolve event of startAttributesEvent. Wween need to launch
//  * startAttributesEvent for every needed layer
//  * @function setAttributes
//  * @param {AttributePipe} attrPipe the object returned by the attributesAdded event
//  * @param {LayerInfo} layerInfo the info to get the attributes
//  * @param {Number} nbLayers the number of layers to check
//  */
// setAttributes(attrPipe: AttributePipe, layerInfo: LayerInfo, nbLayers: number): void {
//     // if there is attributes and it is the needed layer get the values
//     // if not, relaunch startAttributesEvent
//     if (attrPipe.attributes.length > 0 && attrPipe.layer.id === layerInfo.id) {
//         this._attRead += 1;
//         // get attributes value for specified field
//         const values = [];
//         for (let row of attrPipe.attributes) { values.push(row[layerInfo.field]); }
//         // set limit and range if not set from configuration. Also update if limit are higher of lower then actual values
//         // filter values to remove null
//         const limit: Range = { min: Math.min.apply(null, values.filter((val) => val !== null)), max: Math.max.apply(null, values.filter((val) => val !== null)) };
//         if (this._slider.limit.min === null || this._slider.limit.min > limit.min) { this._slider.limit.min = limit.min; }
//         if (this._slider.limit.max === null || this._slider.limit.max < limit.max) { this._slider.limit.max = limit.max; }
//         this._slider.range = this._config.range.min !== null ? this._config.range : this._slider.limit;
//         // if all layers are set, start slider creation
//         if (nbLayers === this._attRead) { this.setSliderBar(); }
//     } else {
//         this.startAttributesEvent(layerInfo, nbLayers)
//     }
// }
// interface AttributePipe {
//     layer: any;
//     attributes: object[];
// }
