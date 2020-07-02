import { SLIDER_TEMPLATE } from './template';
import { SliderManager } from './slider-manager';

export default class RangeSlider {
    private _button: any;

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

        let extendConfig: any = {}
        if (typeof config !== 'undefined') {
            extendConfig = { ...RangeSlider.prototype.layerOptions, ...config.params };
            extendConfig.controls = config.controls;
            extendConfig.layers = config.layers;
            extendConfig.open = config.open;
        } else {
            extendConfig = RangeSlider.prototype.layerOptions;
        }
        extendConfig.language = this._RV.getCurrentLang();

        // side menu button
        this._button = this.mapApi.mapI.addPluginButton(
            RangeSlider.prototype.translations[this._RV.getCurrentLang()].title, this.onMenuItemClick()
        );
        if (extendConfig.open) { this._button.isActive = true; }

        // start slider creation
        new SliderManager(mapApi, this.panel, extendConfig);
    }

    /**
    * Event to fire on side menu item click. Open/Close the panel
    * @function onMenuItemClick
    * @return {function} the function to run
    */
   onMenuItemClick() {
        return () => {
            this._button.isActive = !this._button.isActive;
            this._button.isActive ? this.panel.open() : this.panel.close();
        };
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
    max: number
}

RangeSlider.prototype.panelOptions = {
    top: 'calc(100% - 235px)',
    height: '185px',
    'margin-right': '60px',
    'margin-left': '420px'
};

RangeSlider.prototype.layerOptions = {
    open: true,
    precision: 2,
    delay: 3000,
    lock: false,
    loop: false,
    export: false,
    range: { min: null, max: null },
    limit: { min: null, max: null },
    type: 'date',
    layers: [],
    controls: ['lock', 'loop', 'delay', 'refresh']
};

RangeSlider.prototype.translations = {
    'en-CA': {
        title: 'Range Slider',
        bar: {
            show: 'Show slider information',
            hide: 'Hide slider information',
            lock: 'Lock left anchor',
            unlock: 'Unlock left anchor',
            loop: 'Animate in loop',
            unloop: 'Do not animate in loop',
            previous: 'Previous',
            play: 'Play',
            pause: 'Pause',
            foward: 'Next',
            delay: 'Delay',
            refresh: 'Refresh',
            gif: 'GIF',
            tooltip: {
                gif: 'If enabled, click \"Play\" to start then \"Pause\" to finish then disable the control to export GIF'
            }
        }
    },

    'fr-CA': {
        title: 'Curseur de plage',
        bar: {
            show: 'Afficher l\'information du curseur de plage',
            hide: 'Cacher l\'information du curseur de plage',
            lock: 'Verrouiller la molette gauche',
            unlock: 'Déverrouiller la molette gauche',
            loop: 'Animer en boucle',
            unloop: 'Ne pas animer en boucle',
            previous: 'Précédent',
            play: 'Jouer',
            pause: 'Pause',
            foward: 'Prochain',
            delay: 'Délai',
            refresh: 'Rafraîchir',
            gif: 'GIF',
            tooltip: {
                gif: 'Si activé, cliquez sur \"Jouer\" pour démarrer, puis sur \"Pause\" pour terminer et désactiver le contrôle pour exporter le GIF'
            }
        }
    }
};

(<any>window).rangeSlider = RangeSlider;
