import { SLIDER_TEMPLATE } from './template';
import { SliderManager } from './slider-manager';

export default class RangeSlider {
    /**
    * Plugin init
    * @function init
    * @param {Any} mapApi the viewer api
    */
    init(mapApi: any) {
        this.mapApi = mapApi;

        // create panel
        this.panel = this.mapApi.panels.create('rangeSlider');
        this.panel.element.css(RangeSlider.prototype.panelOptions);
        this.panel.body = SLIDER_TEMPLATE;

        // get slider configuration then add/merge needed configuration
        const config = this._RV.getConfig('plugins').rangeSlider;
        const extendConfig: any = this.parsePluginConfig(config);

        // add layers info
        extendConfig.viewerLayers = this._RV.getConfig('map').layers;

        // add language and translation to configuration
        extendConfig.language = this._RV.getCurrentLang();
        extendConfig.translations = RangeSlider.prototype.translations[this._RV.getCurrentLang()];

        // get ESRI TimeExtent dependency (for image server and ESRI time aware layer - TimeInfo) and start slider creation
        let myBundlePromise = (<any>window).RAMP.GAPI.esriLoadApiClasses([['esri/TimeExtent', 'timeExtent']]);
        myBundlePromise.then(myBundle => {
            new SliderManager(mapApi, this.panel, extendConfig, myBundle);
        });
    }

    /**
     * Parse and extend the configuration object for missing properties
     * @param {any} config the configuration object
     * @returns the extented config
     */
    parsePluginConfig(config:any): any {
        let extendConfig: any = {}

        if (typeof config !== 'undefined') {
            extendConfig = { ...RangeSlider.prototype.layerOptions, ...config.params };
            extendConfig.controls = config.controls;
            extendConfig.layers = config.layers;
            extendConfig.open = config.open;
            extendConfig.loop = config.loop;
            extendConfig.autorun = config.autorun;
            extendConfig.maximize = typeof config.maximize !== 'undefined' ? config.maximize : RangeSlider.prototype.layerOptions.maximize;
            extendConfig.maximizeDesc = typeof config.maximizeDesc !== 'undefined' ? config.maximizeDesc : RangeSlider.prototype.layerOptions.maximizeDesc;
        } else {
            extendConfig = RangeSlider.prototype.layerOptions;
        }

        return extendConfig;
    }
}

export default interface RangeSlider {
    mapApi: any,
    _RV: any,
    translations: any,
    panel: any,
    panelOptions: any,
    layerOptions: any
}

export interface Range {
    min: number,
    max: number,
    staticItems?: number[]
}

RangeSlider.prototype.panelOptions = {
    'margin-right': '60px',
    'margin-left': '420px'
};

RangeSlider.prototype.layerOptions = {
    open: true,
    maximize: true,
    maximizeDesc: true,
    autorun: false,
    loop: false,
    precision: '0',
    delay: 3000,
    lock: false,
    export: false,
    rangeType: 'dual',
    stepType: 'dynamic',
    startRangeEnd: false,
    rangeInterval: -1,
    range: { min: null, max: null },
    limit: { min: null, max: null },
    limits: [],
    type: 'date',
    layers: [],
    controls: ['lock', 'loop', 'delay', 'refresh'],
    units: '',
    description: ''
};

RangeSlider.prototype.translations = {
    'en-CA': {
        title: 'Range Slider',
        minimize: 'Minimize the slider interface',
        maximize: 'Maximize the slider interface',
        bar: {
            show: 'Show slider information',
            hide: 'Hide slider information',
            lock: 'Lock left anchor',
            unlock: 'Unlock left anchor',
            loop: 'Animate in loop',
            unloop: 'Do not animate in loop',
            forward: 'Animate forward',
            reverse: 'Animate backward',
            previous: 'Previous',
            play: 'Play',
            pause: 'Pause',
            foward: 'Next',
            delay: 'Delay',
            refresh: 'Refresh',
            gif: 'GIF',
            tooltip: {
                gif: 'If enabled, click \"Play\" to start then \"Pause\" to finish then disable the control to export GIF'
            },
            unit: "Units",
            esriImageNote: 'NOTE: Only the last handle will affect the layer visibility. The first handle is use to set the interval for controls.'
        }
    },

    'fr-CA': {
        title: 'Curseur de plage',
        minimize: 'Minimiser l\'interface du curseur',
        maximize: 'Maximizer l\'interface du curseur',
        bar: {
            show: 'Afficher l\'information du curseur de plage',
            hide: 'Cacher l\'information du curseur de plage',
            lock: 'Verrouiller la molette gauche',
            unlock: 'Déverrouiller la molette gauche',
            loop: 'Animer en boucle',
            unloop: 'Ne pas animer en boucle',
            forward: 'Animer normalement',
            reverse: 'Animer à rebours',
            previous: 'Précédent',
            play: 'Jouer',
            pause: 'Pause',
            foward: 'Prochain',
            delay: 'Délai',
            refresh: 'Rafraîchir',
            gif: 'GIF',
            tooltip: {
                gif: 'Si activé, cliquez sur \"Jouer\" pour démarrer, puis sur \"Pause\" pour terminer et désactiver le contrôle pour exporter le GIF'
            },
            unit: "Unitées",
            esriImageNote: 'REMARQUE: seule la dernière molette affectera la visibilité de la couche. La première molette est utilisée pour définir l\'intervalle pour les contrôles.'
        }
    }
};

(<any>window).rangeSlider = RangeSlider;
