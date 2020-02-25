// how to add an html element from template.ts to your application
import { SAMPLE_BUTTON } from './template';

export default class MyFirstPlugin {
    private _panelForm: any;
    private _button: any;
    private _panelOptionsForm: object = { bottom: '0em', right: '50px', top: '50px', left: '450px' };

    /**
    * Plugin init
    * @function init
    * @param {Object} mapApi the viewer api
    */
    init(mapApi: any) {
        this.mapApi = mapApi;

        // how to get config
        this.config = this._RV.getConfig('plugins').myFirstPlugin;
        this.config.language = this._RV.getCurrentLang();

        // how to create side menu button
        // replace MyFirstPlugin by your plugin name and add your code to the onMenuItemClick function
        this._button = this.mapApi.mapI.addPluginButton(
            MyFirstPlugin.prototype.translations[this._RV.getCurrentLang()].placeHolder, this.onMenuItemClick()
        );

        // how to create a panel
        // replace MyFirstPlugin by your plugin name
        // you can give the name you want to your form, will be use to retrieve it later
        // set title, add close button and open the panel
        this._panelForm = this.mapApi.panels.create('customForm');
        this._panelForm.element.css(this._panelOptionsForm);
        this._panelForm.header.title = MyFirstPlugin.prototype.translations[this._RV.getCurrentLang()].placeHolder;
        this._panelForm.header.closeButton;
        this._panelForm.open();

        // how to create a controller
        // create a controller with agControllerRegister
        // set the body = to the button
        this.setAngular();
        this._panelForm.body = SAMPLE_BUTTON;

        // if body is set and you want to append, compile the code first
        this._panelForm.body.append(this.compileTemplate(SAMPLE_BUTTON));
    }

    onMenuItemClick() {
        return () => {
            console.log('side menu clicked');
        };
    }

    setAngular() {
        // to reference this inside the function
        const that = this;

        // same name as the one we have set in template.ts
        // ************************
        // IMPORTANT: passing the scope $scope to the function may create angular compilation error (Unknown provider: tProvider <- t <- DescriptionCtrl)
        // when pushing your code to gh-pages
        // ************************
        this.mapApi.agControllerRegister('SampleCtrl', function () {

            // access to ng-click
            this.sampleFunction = () => {
                console.log('click')
            };
        });
    }

    compileTemplate(template: string): JQuery<HTMLElement> {
        let temp = $(template);
        this.mapApi.$compile(temp);
        return temp;
    }
}

export default interface MyFirstPlugin {
    mapApi: any,
    _RV: any,
    config: any,
    translations: any
}

MyFirstPlugin.prototype.translations = {
    'en-CA': {
        placeHolder: 'translation'
    },
    'fr-CA': {
        placeHolder: 'traduction'
    }
};

(<any>window).myFirstPlugin = MyFirstPlugin;