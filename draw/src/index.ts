import { PanelManager } from './panel-manager';

export default class Draw {
    /**
     * Plugin init
     * @function init
     * @param {Object} mapApi the viewer api
     */
    init(mapApi: any) {
        this.mapApi = mapApi;

        // get draw config
        this.config = this._RV.getConfig('plugins').draw;
        this.config.language = this._RV.getCurrentLang();
        this.config.url = this._RV.getConfig('services').geometryUrl;

        // create mapnav panel
        this.panelManager = new PanelManager(mapApi, this.config, Draw.prototype.translations[this._RV.getCurrentLang()].wcagEditAlert);

        // create side menu button to toggle toolbar
        this.button = this.mapApi.mapI.addPluginButton(
            Draw.prototype.translations[this._RV.getCurrentLang()].menu,
            this.onMenuItemClick()
        );

        // set toolbar state
        this.button.isActive = (this.config.open) ? true : false;
        (<any>document).getElementsByClassName('rv-mapnav-draw-content')[0].style.display = this.button.isActive ? 'block' : 'none';
    }

    /**
     * Event to fire on side menu item click
     * @function onMenuItemClick
     * @return {function} the function to run
     */
    onMenuItemClick() {
        return () => {
            // geet if button is active or not and set all tools as inactive by default
            this.button.isActive = !this.button.isActive;
            this.panelManager.setInactive();
            (<any>document).getElementsByClassName('rv-mapnav-draw-content')[0].style.display = this.button.isActive ? 'block' : 'none';
        };
    }
}

export default interface Draw {
    mapApi: any;
    _RV: any;
    config: any;
    translations: any;
    panelManager: PanelManager;
    button: any;
}

Draw.prototype.translations = {
    'en-CA': {
        menu: 'Draw Toolbar',
        picker: 'Select colour',
        point: 'Draw point',
        line: 'Draw/Measure line',
        polygon: 'Draw/Measure polygon',
        edit: 'Edit existing drawing',
        measure: 'Show/Hide distances',
        extent: 'Erase selected graphics',
        write: 'Save graphics file',
        read: 'Upload graphics file',
        wcagEditAlert: 'Functionality not provided for keyboard user du to its complexity. To achieve the same goal, delete the geometry and recreate it.'
    },
    'fr-CA': {
        menu: 'Barre de dessin',
        picker: 'Sélectionner la couleur',
        point: 'Dessiner point',
        line: 'Dessiner/Mesurer ligne',
        polygon: 'Dessiner/Mesurer polygon',
        edit: 'Éditer les dessins existant',
        measure: 'Afficher/Cacher les distances',
        extent: 'Effacer les graphiques sélectionnés',
        write: 'Sauvegarder le fichier de graphiques',
        read: 'Charger le fichier de graphiques',
        wcagEditAlert: 'Fonctionnalité non fournie à l\'utilisateur du clavier en raison de sa complexité. Pour atteindre le même objectif, supprimez la géométrie et recréez-la.'
    }
};

(<any>window).draw = Draw;