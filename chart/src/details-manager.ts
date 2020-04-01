import {
    DETAILS_TEMPLATE
} from './template';

const showdown  = require('showdown');

export class DetailsManager {
    private _panelDetails: any;
    private _panelTrigger: boolean = false;
    private _activeLayername: string;
    private _enabled: boolean;
    private _details: string;
    private _feature: object[];

    /**
     * Get active layer name
     * @property layerName
     * @return {String} layer name
     */
    get layerName(): string {
        return this._activeLayername
    }
    /**
     * Set active layer name
     * @property layerName
     * @param {String} value the layer name
     */
    set layerName(value: string) {
        this._activeLayername = value;
    }

    /**
     * Get custom details panel status
     * @property enabled
     * @return {Boolean} panel status
     */
    get enabled(): boolean {
        return this._enabled;
    }
    /**
     * Set custom details panel status
     * @property enabled
     * @param {Boolean} value the panel status
     */
    set enabled(value: boolean) {
        this._enabled = value;
    }

    /**
     * Get active details
     * @property details
     * @return {String} details Markdown string
     */
    get details(): string {
        return this._details;
    }
    /**
     * Set active details
     * @property details
     * @param {String} value details Markdown string
     */
    set details(value: string) {
        this._details = value;
    }

    /**
     * Get active feature
     * @property feature
     * @return {Object[]} feature array of fields key and value
     */
    get feature(): object[] {
        return this._feature;
    }
    /**
     * Set active feature
     * @property feature
     * @param {Object[]} value array of fields key and value
     */
    set feature(value: object[]) {
        this._feature = value;
    }

    /**
    * Details manager constructor
    * @constructor
    * @param {Any} mapApi the viewer api
    */
    constructor(mapApi: any) {
        // get details panel
        this._panelDetails = mapApi.panelRegistryObj.details;

        // create markdown converter
        const converter = new showdown.Converter();

        // subscribe to opening panel event
        this._panelDetails.opening.subscribe(() => {
            // check if panel opening have been triggered already
            if (!this._panelTrigger) {
                setTimeout(() => {
                    // parse the details string
                    if (this.enabled) {
                        // parse the attributes inside the detail value and convert to html
                        const text = this.parseAttributes();
                        const html = converter.makeHtml(text);

                        // check if side menu buttons are there (more then onelayer)... if so
                        // find the right button. and trigger the click event from the active one
                        const buttons = $('rv-layer-list-slider button');
                        if (buttons.length > 0) {
                            buttons.click({ layerName: this.layerName, html }, this.clickDetails);
                            $('rv-layer-list-slider li').filter('.rv-selected').find('button').trigger('click');
                        } else {
                            this.clickDetails({ data: { layerName: this.layerName, html }});
                        }
                    }

                    // reset the panel trigger status
                    this._panelTrigger = false;
                }, 0);
            }

            // panel opening is sometimes trigger twice, set panel status
            this._panelTrigger = true;
        });
    }

    /**
    * Take the details string for the panel and replace by attribute values if need be
    * @function parseAttributes
    * @return {String} the parsed details string
    */
    parseAttributes(): string {
        let detail: string = this.details;
        for (let field of this.feature) {
            if (detail.indexOf(`{{${(<any>field).key}}}`) !== -1) {
                detail = detail.replace(`{{${(<any>field).key}}}`, (<any>field).value);
            }
        }

        return detail;
    }

    /**
    * Function to apply when an item is click on the sidebar details panel menu or fired if there is only one layer
    * @function clickDetails
    * @param {Any} event the click event or an object that mimick it. Contains the active layer name and the details to show
    */
    clickDetails(event: any) {
        const panel: HTMLElement = document.getElementById('mainDetails');
        const layerName: string = (<HTMLElement>panel.getElementsByClassName('md-title')[0]).innerText;
        const subContent: HTMLCollectionOf<Element> = panel.getElementsByClassName('rv-subcontent');
        const subSection: HTMLCollectionOf<Element> = panel.getElementsByClassName('rv-subsection');

        // if custom details panel exist, remove it
        if (panel.getElementsByClassName('rv-chart-details').length !== 0) {
            panel.getElementsByClassName('rv-chart-details')[0].remove();
        }

        // if the selected layers has a details panel, create the place holder, add the content and hide default
        // if not show default
        if (layerName === event.data.layerName) {
            (<HTMLElement>subContent[0]).style.visibility = 'hidden';
            subSection[0].prepend(new DOMParser().parseFromString(DETAILS_TEMPLATE, 'text/html').body.getElementsByClassName('rv-chart-details')[0]);
            subSection[0].getElementsByClassName('rv-chart-details-value')[0].prepend(new DOMParser().parseFromString(event.data.html, 'text/html').body);
        } else {
            (<HTMLElement>subContent[0]).style.visibility = 'visible';
        }
    }
}