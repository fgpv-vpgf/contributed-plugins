import * as nouislider from 'nouislider';
import 'nouislider/distribute/nouislider.css';

const domtoimage = require('dom-to-image');
const gifshot = require('gifshot');
const FileSaver = require('file-saver');

import { Observable, BehaviorSubject } from 'rxjs';

import { Range } from './index';

export class SliderBar {
    private _slider: any;
    private _mapApi: any;
    private _config: any;
    private _playInterval: any;

    // *** Static observable for the class ***
    // observable to detect play/pause modification
    static _playState: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    static getPlayState(): Observable<boolean> {
        return this._playState.asObservable();
    }
    private static setPlayState(newValue: boolean): void {
        this._playState.next(newValue);
    }

    // array of images to export as Gif
    private _gifImages = []

    /**
     * Slider bar constructor
     * @constructor
     * @param {Any} mapApi the viewer api
     * @param {Any} config the slider configuration
     */
    constructor(mapApi: any, config: any) {
        this._mapApi = mapApi;
        this._slider = document.getElementById('nouislider');
        this._config = config;

        // set dynamic values used in accessor
        this._slider.delay = config.delay;
        this._slider.lock = config.lock;
        this._slider.loop = config.loop;
        this._slider.range = config.range;
        this._slider.export = config.export;

        // initialize the slider
        // TODO: check what is best range vs step.........
        const delta = Math.abs(config.limit.max - config.limit.min);
        const mapWidth = this._mapApi.fgpMapObj.width;
        nouislider.create(this._slider,
            {
                start: [this._slider.range.min, this._slider.range.max],
                connect: true,
                behaviour: 'drag-tap',
                tooltips: [{ to: (value: number) => this.formatPips(value, this._config.type, this._config.language), from: Number },
                            { to: (value: number) => this.formatPips(value, this._config.type, this._config.language), from: Number }],
                range: this.setRanges(mapWidth, config.limit, delta),
                pips: {
                    mode: 'range',
                    density: (mapWidth > 800) ? 2 : 25,
                    format: {
                        to: (value: number) => { return this.formatPips(value, this._config.type, this._config.language); },
                        from: Number
                    }
                }
            });

        // add handles to focus cycle
        document.getElementsByClassName('noUi-handle-lower')[0].setAttribute('tabindex', '-2');
        document.getElementsByClassName('noUi-handle-upper')[0].setAttribute('tabindex', '-2');

        // set the initial definition query
        this.setDefinitionQuery(this._slider.range);

        // trap the on change event when user use handles
        let that = this;
        this._slider.noUiSlider.on('set.one', function (values) {
            const ranges = values.map(Number)
            that._slider.range = { min: ranges[0], max: ranges[1] };
            that.setDefinitionQuery(that._slider.range);

            // update step from new range values
            if (!that._slider.lock) { that._config.step = that._slider.range.max - that._slider.range.min; }
        });
    }

    /**
     * Set ranges
     * @function setRanges
     * @param {Number} width display width
     * @param {Range} limit min and max limit to set
     * @param {Number} delta display width
     * @return {Range} range the updated limits
     */
    setRanges(width: number, limit: Range, delta: number): Range {
        let range: any = {}
        range.min = limit.min;
        range.max = limit.max;
        range['50%'] = limit.min + delta / 2;

        if (width > 800) {
            range['25%'] = limit.min + delta / 4;
            range['75%'] = limit.min + (delta / 4) * 3;
        }

        return range;
    }

    /**
     * Set pips (slider labels) format
     * @function formatPips
     * @param {Any} value the value to display (number, string or date)
     * @param {String} field the type of field
     * @param {String} lang the language to use
     * @return {any} value the formated value
     */
    formatPips(value: any, field: string, lang: string): any {
        if (field === 'number') {
            value = Math.round(value * 100) / 100;
        } else if (field === 'date' || field === 'wmst') {
            let date = new Date(value);

            if (lang === 'en-FR') {
                value = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
            } else {
                value = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
            }
        }

        return value;
    }

    // property to get/set the slider lock
    set lock(lock: boolean) {
        this._slider.lock = lock;
    }
    get lock() {
        return this._slider.lock
    }

    // property to get/set the slider loop
    set loop(loop: boolean) {
        this._slider.loop = loop;
    }
    get loop() {
        return this._slider.loop;
    }

    // property to get/set the slider delay
    set delay(delay: number) {
        this._slider.delay = delay;
    }
    get delay(): number {
        return this._slider.delay;
    }

    // property to get/set the slider export
    set export(exp: boolean) {
        this._slider.export = exp;
    }
    get export(): boolean {
        return this._slider.export;
    }

    /**
     * Set play or pause on the slider
     * @function play
     * @param {Boolean} play true if slider is playing, false otherwise
     */
    play(play: boolean): void {
        if (play) {
            this._gifImages = [];

            // set play state to observable to change the icon
            SliderBar.setPlayState(play);

             // start play
            this.playInstant(this._config.limit.max);
            this._playInterval = setInterval(() => this.playInstant(this._config.limit.max), this.delay);
        } else { this.pause(); }
    }

    /**
     * Loop play until the max limit is reach
     * @function playInstant
     * @param {Number} limitmax the max limit
     */
    playInstant(limitmax: number): void {
        // if export gif is selected, take a snapshot and use timeout to take it just before the next move
        // so definition query has finished
        if (this.export) setTimeout(() => { this.takeSnapShot(false); }, this.delay - 500);

        if (this._slider.range.max !== limitmax) {
            this.step('up');
        } else if (this._slider.loop) {
            // slider is in loop mode, reset ranges and continue playing
            this._slider.range.min = this._config.limit.min;
            this._slider.range.max = this._slider.range.min + this._config.step;
            this._slider.noUiSlider.set([this._slider.range.min, this._slider.range.max]);
        } else { this.pause(); }
    }

    /**
     * Take a snapshot of the map for the export gif function
     * @function takeSnapShot
     * @param {Boolean} stop true if it is the last snapshot and it needs to export the gif, false otherwise
     */
    takeSnapShot(stop: boolean): void {
        // get map node + width and height
        const node: any = document.getElementsByClassName('rv-esri-map')[0];
        const width = node.offsetWidth;
        const height = node.offsetHeight;

        domtoimage.toPng(node, { bgcolor: 'white' }).then(dataUrl => {
            this._gifImages.push(dataUrl);

            if (stop) {
                this.export = false;

                gifshot.createGIF({
                    'images': this._gifImages,
                    'interval': this.delay,
                    'gifWidth': width,
                    'gifHeight': height
                }, obj => {
                    if (!obj.error) {
                        FileSaver.saveAs(this.dataURItoBlob(obj.image), 'fgpv-slider-export.gif' );
                    }
                });
            }
        }).catch(error => {
            console.error('Not able to save screen shot!', error);
        });
    }

     /**
     * Set play on the slider
     * @function dataURItoBlob
     * @param {String} dataURI true if slider is playing, false otherwise
     * @return {Blob} blob the blob object (gif image) to save to file
     */
    dataURItoBlob(dataURI: string): Blob {
        // https://stackoverflow.com/questions/46405773/saving-base64-image-with-filesaver-js
        // convert base64 to raw binary data held in a string
        // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
        const byteString = atob(dataURI.split(',')[1]);

        // separate out the mime component
        const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]

        // write the bytes of the string to an ArrayBuffer
        const ab = new ArrayBuffer(byteString.length);

        // create a view into the buffer
        const ia = new Uint8Array(ab);

        // set the bytes of the buffer to the correct values
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }

        // write the ArrayBuffer to a blob, and you're done
        const blob = new Blob([ab], { type: mimeString });

        return blob;
    }

    /**
     * Set pause on the slider when play is call with false
     * @function pause
     */
    pause(): void {
        // if export gif is selected, take a snapshot
        if (this.export) { this.takeSnapShot(true); }

        clearInterval(this._playInterval);

        // set play state to observable to change the icon
        SliderBar.setPlayState(false);
    }

    /**
     * Refresh the slider to default values
     * @function refresh
     */
    refresh(): void {
        this._slider.noUiSlider.set([this._config.range.min, this._config.range.max]);
        this.setDefinitionQuery(this._config.range);
        this.pause();
    }

    /**
     * Step the silder
     * @function step
     * @param {String} direction up or down
     */
    step(direction: string): void {
        // get handles values and set step
        const values = this._slider.noUiSlider.get().map(Number);
        let step = (direction === 'up') ? this._config.step : -this._config.step;

        // calculate range values then apply to slider
        const range: Range = { min: this.lock ? values[0] : this.setLeftAnchor(values, direction, step), max: this.setRightAnchor(values, direction, step) };
        this._slider.noUiSlider.set([range.min, range.max]);

        // apply to layer
        this.setDefinitionQuery(range);
        this._slider.range = range;
    }

    /**
     * Set left anchor
     * @function setLeftAnchor
     * @param {Number} values values to set anchors to
     * @param {String} direction up or down
     * @param {Number} step step value
     * @return {Number} Left anchor value
     */
    setLeftAnchor(values: number, direction: string, step: number): number {
        let value: number = 0;
        const limit: Range = this._config.limit;

        if (direction === 'down') {
            // left anchor needs to be higher or equal to min limit (down = minus step)
            if (Math.floor(values[0] + step) < limit.min) {
                value = limit.min;
            } else {
                value = values[0] + step;
            }
        } else {
            // left anchor needs to be lower then max limit - step
            if (Math.ceil(values[0] + step) > limit.max - step) {
                value = limit.max - step;
            } else {
                value = values[0] + step;
            }
        }

        return parseFloat(value.toFixed(this._config.precision));
    }

    /**
     * Set right anchor
     * @function setRightAnchor
     * @param {Number} values values to set anchors to
     * @param {String} direction up or down
     * @param {Number} step step value
     * @return {Number} Left anchor value
     */
    setRightAnchor(values: number, direction: string, step: number): number {
        let value: number = 0;
        const limit: Range = this._config.limit;

        if (direction === 'up') {
            // right anchor needs to be lower or equal to max limit
            if (Math.ceil(values[1] + step) > limit.max) {
                value = limit.max;
            } else {
                value = values[1] + step;
            }
        } else {
            // right anchor needs to be higher then min limit + step (down = minus step)
            if (Math.floor(values[1] + step) < limit.min - step) {
                value = limit.min - step;
            } else {
                value = values[1] + step;
            }
        }

        return parseFloat(value.toFixed(this._config.precision));
    }

    /**
     * Set definition query to filter the data
     * @function setDefinitionQuery
     * @param {Range} range range to use to filter
     */
    setDefinitionQuery(range: Range) {
        // Sample with cql_filter (Supported by GeoServer):
        // http://jsfiddle.net/ZkC5M/274/: http://gis.fba.org.uk/geoserver/RP_Workspace/wms?service=WMS&request=GetMap&version=1.1.1&layers=RP_Workspace:sites_view1&styles=&format=image/png&transparent=true&height=256&width=256&cql_filter=RMIGroup%20=%20%27Almond%20Catchment%20ARMI%27&srs=EPSG:3857&bbox=-1252344.2714243277,7514065.628545966,0,8766409.899970295
    
        for (let layer of this._config.layers) {
            const myLayer = this._mapApi.layers.getLayersById(layer.id)[0];
            const layerType = myLayer.type;

            if (layerType === 'esriDynamic' || layerType === 'esriFeature') {
                if (this._config.type === 'number') {
                    myLayer.setFilterSql('rangeSliderNumberFilter',
                        `${layer.field} > ${range.min} AND ${layer.field} <= ${range.max}`);
                } else if (this._config.type === 'date') {
                    const dates = this.getDate(range);
                    myLayer.setFilterSql('rangeSliderDateFilter',
                        `${layer.field} > DATE \'${dates[0]}\' AND ${layer.field} <= DATE \'${dates[1]}\'`);
                }
            } else if (layerType === 'ogcWms') {
                // The way it works with string (we can use wildcard like %)
                // myLayer.esriLayer.setCustomParameters({}, {layerDefs: "{'0': \"CLAIM_STAT LIKE 'SUSPENDED'\"}"});
                if (this._config.type === 'number') {
                    myLayer.esriLayer.setCustomParameters({}, { 'layerDefs':
                        `{'${myLayer._viewerLayer._defaultFC}': '${layer.field} > ${range.min} AND ${layer.field} <= ${range.max}'}` });
                } else if (this._config.type === 'date') {
                    const dates = this.getDate(range);
                    myLayer.esriLayer.setCustomParameters({}, { 'layerDefs':
                        `{'${myLayer._viewerLayer._defaultFC}': \"${layer.field} > DATE '${dates[0]}' AND ${layer.field} < DATE '${dates[1]}'\"}` });
                } else if (this._config.type === 'wmst') {
                    const dates = this.getDate(range, 'wmst');
                    myLayer.esriLayer.setCustomParameters({}, { 'TIME':
                        `${dates[0]}/${dates[1]}` });
                }
            }
        }
    }

    /**
     * Set definition query to filter the data
     * @function setDefinitionQuery
     * @param {Range} range range to use to filter
     * @param {String} type type of date
     * @return {String[]} Array of string date  from date object
     */
    getDate(range: Range, type: string = 'esri'): string[] {
        const min = new Date(range.min);
        const max = new Date (range.max);

        let dateMin = '';
        let dateMax = '';
        if (type === 'esri') {
            dateMin = `${min.getMonth() + 1}/${min.getDate()}/${min.getFullYear()}`;
            dateMax = `${max.getMonth() + 1}/${max.getDate()}/${max.getFullYear()}`;
        } else if (type === 'wmst') {
            dateMin = `${min.getFullYear()}-${((min.getMonth() + 1).toString() as any).padStart(2, '0')}-${(min.getDate().toString() as any).padStart(2, '0')}T00:00:00`;
            dateMax = `${max.getFullYear()}-${((max.getMonth() + 1).toString() as any).padStart(2, '0')}-${(max.getDate().toString() as any).padStart(2, '0')}T00:00:00`;
        }

        return [dateMin, dateMax];
    }
}