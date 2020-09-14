import { SliderPanel } from './slider-panel';

export default class ThematicSlider {
    private _button: any;
    private _panel: SliderPanel;
    private _panelDetails: any;

    /**
    * Plugin init
    * @function init
    * @param {Object} mapApi the viewer api
    */
    init(mapApi: any) {
        this.mapApi = mapApi;

        // set details panel event on opening and closing to show/hide details and thematic panel
        this._panelDetails = mapApi.panelRegistryObj.details;
        this._panelDetails.opening.subscribe(() => { 
            document.getElementById('thematicSlider').style.zIndex = '-10'; });
        this._panelDetails.closing.subscribe(() => { 
            document.getElementById('thematicSlider').style.zIndex = '50'; });

        // get config and add language
        this.config = this._RV.getConfig('plugins').thematicSlider;
        this.config.language = this._RV.getCurrentLang();

        // close legend if open by default
        this.mapApi.panelRegistryObj.legend.close();

        // side menu button
        this._button = this.mapApi.mapI.addPluginButton(
            ThematicSlider.prototype.translations[this._RV.getCurrentLang()].title, this.onMenuItemClick()
        );

        // create the panel and check if the button is active by default
        if (this.config.open) {
            this._button.isActive = true;
            this.setButtonState(true);
        }
        this._panel = new SliderPanel(this.mapApi, this.config, ThematicSlider.prototype.translations[this._RV.getCurrentLang()].legendImage);
    }

    /**
    * Event to fire on side menu item click. Open/Close the panel
    * @function onMenuItemClick
    * @return {function} the function to run
    */
    onMenuItemClick() {
        return () => {
            this._button.isActive = !this._button.isActive;
            if (this._button.isActive) {
                this._panel.open();
                this.setButtonState(true);
            } else {
                this._panel.close();
                this.setButtonState(false);
            }
        };
    }

    /**
    * Disable main app bar toc buttons to avoid collision
    * @function setButtonState
    * @param {Boolean} disable disable or not the buttons
    */
    setButtonState(disable: boolean) {
        const buttons = $('.main-appbar button');
        buttons.each((index: number, button: any) => {
            if (button.getAttribute('rv-help') === 'toc-button') { button.disabled = disable; }
        });
    }
}

export default interface ThematicSlider {
    mapApi: any,
    _RV: any,
    config: any,
    translations: any
}

ThematicSlider.prototype.translations = {
    'en-CA': {
        title: 'Thematic Slider',
        legendImage: 'Legend image',
        previous: 'Previous',
        play: 'Play',
        pause: 'Pause',
        foward: 'Next'
    },
    'fr-CA': {
        title: 'Curseur thématique',
        legendImage: 'Image pour la légende',
        previous: 'Précédent',
        play: 'Jouer',
        pause: 'Pause',
        foward: 'Prochain'
    }
};

(<any>window).thematicSlider = ThematicSlider;