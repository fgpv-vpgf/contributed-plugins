import * as nouislider from 'nouislider';

import { Observable, BehaviorSubject } from 'rxjs';

import { Range } from './index';

const domtoimage = require('dom-to-image');
const gifshot = require('gifshot');
const FileSaver = require('file-saver');

export class SliderBar {
    private _slider: any;
    private _mapApi: any;
    private _config: any;
    private _myBundle: any;

    private _playInterval: any;
    private _range: Range = { min: null, max: null };
    private _limit: Range = { min: null, max: null };
    private _limits: number[] = [];
    private _step: number;
    private _precision: number;
    private _stepType: string;
    private _rangeType: string;
    private _interval: number;
    private _intervalUnit: string;

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
    constructor(mapApi: any, config: any, myBundle: any) {
        this._mapApi = mapApi;
        this._slider = document.getElementById('nouislider');
        this._config = config;
        this._myBundle = myBundle;
        this._precision = (config.type === 'number') ? config.precision : (config.precision === 'date') ? -1 : -2;

        // set dynamic values used in accessor
        this._slider.delay = config.delay;
        this._slider.lock = config.lock;
        this._slider.dual = (config.rangeType === 'dual') ? true : false;
        this._slider.loop = config.loop;
        this._slider.range = config.range;
        this._slider.export = config.export;

        // set range and limits information. Will help to set the different slider (range (single or dual) and limit (dynamic or static))
        this._stepType = config.stepType;
        this._rangeType = config.rangeType;
        this._interval = config.interval;
        this._intervalUnit = config.intervalUnit;

        // set units label value
        document.getElementsByClassName('slider-units')[0].textContent = config.units;
    }

    /**
     * Start slider creation
     * @function
     * @param {String} type the type of slider (date, number or wmst)
     * @param {String} language the viewerlanguage (en-CA or fr-CA)
     */
    startSlider(type: string, language: string): void {
        // initialize the slider
        const mapWidth = this._mapApi.fgpMapObj.width;
        nouislider.create(this._slider,
            {
                start: (this._rangeType === 'dual') ? [this.range.min, this.range.max] : [this.range.min],
                connect: true,
                behaviour: 'drag-tap',
                tooltips: this.setTooltips(type, language),
                range: this.setNoUiBarRanges(mapWidth, this.limit, this._rangeType, this._stepType, this._interval),
                step: 1,
                snap: (this._stepType === 'static') ? true : false,
                pips: {
                    mode: 'range',
                    density: (this._stepType === 'static') ? 100 : (mapWidth > 800) ? 5 : 10,
                    format: {
                        to: (value: number) => { return this.formatPips(value, type, language); },
                        from: Number
                    }
                }
            });

        // remove overlapping pips. This can happen often with static limits and date
        const items = $('.noUi-value');
        let curIndex = 0;
        let testIndex = 1;
        // loop until are pips are not tested
        while (testIndex !== items.length) {
            // get div rectangle and check for collision
            let d1 = (items[curIndex] as any).getBoundingClientRect();
            let d2 = (items[testIndex] as any).getBoundingClientRect();
            let ox = Math.abs(d1.x - d2.x) < (d1.x < d2.x ? d2.width : d1.width);
            let oy = Math.abs(d1.y - d2.y) < (d1.y < d2.y ? d2.height : d1.height);

            // if there is a collision, set display none and test with the next pips
            if (ox && oy) {
                items[testIndex].style.display = 'none';
                testIndex++;
            } else {
                // if there is no  collision and reset the curIndex to be the one before the testIndex
                curIndex = (testIndex - curIndex !== 1) ? testIndex : curIndex + 1;
                testIndex++;
            }
        }

        // add handles to focus cycle
        document.getElementsByClassName('noUi-handle-lower')[0].setAttribute('tabindex', '-2');
        if (this._rangeType === 'dual') { document.getElementsByClassName('noUi-handle-upper')[0].setAttribute('tabindex', '-2'); }

        // make sure range is set properly, there is a bug when slider is initialize without
        // configuration from a time aware layer
        if (this._slider.range.min === null) { this._slider.range = this.range; }

        // set the initial definition query
        this._slider.range = (this._rangeType === 'dual') ? this._slider.range : { min: this._slider.range.min, max: this._slider.range.min }
        this.setDefinitionQuery(this._slider.range);

        // trap the on change event when user use handles
        let that = this;
        this._slider.noUiSlider.on('set.one', function (values) {
            // set ranges from handles (dual) or from first handle (single)
            const ranges: number[] = values.map(Number);
            that._slider.range = (that._rangeType === 'dual') ? { min: ranges[0], max: ranges[1] } : { min: ranges[0], max: ranges[0] }
            that.setDefinitionQuery(that._slider.range);

            // update step from new range values
            if (!that._slider.lock) { that._step = that._slider.range.max - that._slider.range.min; }
        });
    }

    /**
     * Set ranges
     * @function setNoUiBarRanges
     * @param {Number} width display width
     * @param {Range} limit min and max limit to set
     * @param {String} rangeType range type (dual or single)
     * @param {String} stepType step type (dynamic or static)
     * @param {Number} step step value to use for (single and dynamic)
     * @return {Range} range the updated limits
     */
    setNoUiBarRanges(width: number, limit: Range, rangeType: string, stepType: string, step: number): Range {
        let range: any = {}

        const delta = Math.abs(this.limit.max - this.limit.min);
        if (rangeType === 'dual' && stepType === 'dynamic') {
            range.min = limit.min;
            range.max = limit.max;
            range['50%'] = limit.min + delta / 2;

            if (width > 800) {
                range['25%'] = limit.min + delta / 4;
                range['75%'] = limit.min + (delta / 4) * 3;
            }
        } else if (rangeType === 'single' && stepType === 'dynamic') {
            range.min = [limit.min, step];
            range.max = [limit.max, step];

            // to get rounded value to step
            const mod50 = step - ((delta /2) % step);
            range['50%'] = [limit.min + (delta / 2) + mod50, step];

            if (width > 800) {
                // to get rounded value to step
                const mod25 = step - (limit.min + (delta /4)) % step;
                const mod75 = step - (limit.min + (delta /4) * 3) % step;
                range['25%'] = [limit.min + (delta / 4) + mod25, step];
                range['75%'] = [limit.min + ((delta / 4) * 3) + mod75, step];
            }
        }  else if (stepType === 'static') {
            range.min = limit.min;
            range.max = limit.max;

            const nbItems = limit.staticItems.length + 2;
            for (let [i, item] of limit.staticItems.entries()) {
                range[`${((item - range.min) / delta) * 100}%`] = item;
            }
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
            value = (Math.round(value * 100) / 100).toFixed(this._precision);
        } else if (field === 'date' || field === 'wmst') {
            let date = new Date(value);

            if (lang === 'en-FR') {
                value = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
            } else {
                value = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
            }

            // if hours, add it to the label and change margin so label are inside
            if (this._precision === -2) {
                value += ` - ${date.getHours()}:${((date.getMinutes() + 1).toString() as any).padStart(2, '0')}:${((date.getSeconds() + 1).toString() as any).padStart(2, '0')}`;
                $('.slider-bar')[0].style.paddingLeft = '60px';
            }
        }

        return value;
    }

    setTooltips(type: string, language: string): object[] {
        const tooltips = [{ to: (value: number) => this.formatPips(value, type, language), from: Number }]
        if (this._rangeType === 'dual') {
            tooltips.push({ to: (value: number) => this.formatPips(value, type, language), from: Number })
        }

        return tooltips;
    }

    /**
     * Set slider range
     * @property range
     */
    set range(value: Range) {
        this._range = value;
    }
    /**
     * Get slider range
     * @property range
     */
    get range(): Range {
        return this._range;
    }

    /**
     * Set slider limit (dynamic)
     * @property limit
     */
    set limit(value: Range) {
        this._limit = value;
    }
    /**
     * Get slider limit (dynamic)
     * @property limit
     */
    get limit(): Range {
        return this._limit;
    }

    /**
     * Set slider limit (static)
     * @property limit
     */
    set limits(value: number[]) {
        this._limits = value;
    }
    /**
     * Get slider limit (static)
     * @property limit
     */
    get limits(): number[] {
        return this._limits;
    }

    /**
     * Set slider lock
     * @property lock
     */
    set lock(lock: boolean) {
        this._slider.lock = lock;
    }
    /**
     * Get slider lock
     * @property lock
     */
    get lock(): boolean {
        return this._slider.lock;
    }

    /**
     * Get slider range type is dual
     * @property lock
     */
    get dual(): boolean {
        return this._slider.dual;
    }

    /**
     * Set slider loop
     * @property loop
     */
    set loop(loop: boolean) {
        this._slider.loop = loop;
    }
    /**
     * Get slider loop
     * @property loop
     */
    get loop(): boolean {
        return this._slider.loop;
    }

    /**
     * Set slider delay
     * @property delay
     */
    set delay(delay: number) {
        this._slider.delay = delay;
    }
    /**
     * Get slider delay
     * @property delay
     */
    get delay(): number {
        return this._slider.delay;
    }

    /**
     * Set slider export
     * @property export
     */
    set export(exp: boolean) {
        this._slider.export = exp;
    }
    /**
     * Get slider export
     * @property export
     */
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
            // set play state to observable to change the icon
            SliderBar.setPlayState(play);

            // start play (it will wait the delay before doing is first step) and take snapshop if need be
            this._gifImages = [];
            this.setTakeSnapShot();
            this._playInterval = setInterval(() => this.playInstant(this.limit.max), this.delay);
        } else { this.pause(); }
    }

    /**
     * Loop play until the max limit is reach
     * @function playInstant
     * @param {Number} limitmax the max limit
     */
    playInstant(limitmax: number): void {
        // take snapshop if need be
        this.setTakeSnapShot();

        if (this._slider.range.max !== limitmax) {
            this.step('up');
        } else if (this._slider.loop) {
            // slider is in loop mode, reset ranges and continue playing
            this._slider.range.min = this.limit.min;

            if (this._stepType === 'dynamic') {
                this._slider.range.max = this._slider.range.min + this._step;
            } else if (this._stepType === 'static') {
                const leftHandle = (this._rangeType === 'dual') ? this._slider.noUiSlider.get().map(Number)[0] : +this._slider.noUiSlider.get();;
                const index = this.limit.staticItems.findIndex((item) => { return item === leftHandle; });
                this._slider.range.max = this.limit.staticItems[(this.limit.staticItems.length - 1) - index];
            }

            this._slider.noUiSlider.set([this._slider.range.min, this._slider.range.max]);
        } else { this.pause(); }
    }

    /**
     * Check if we need to take snapshot to export GIF
     * @function setTakeSnapShot
     */
    setTakeSnapShot() {
        // if export gif is selected, take a snapshot and use timeout to take it just before the next move
        // so definition query has finished
        if (this.export) setTimeout(() => { this.takeSnapShot(false); }, this.delay - 100);
    }

    /**
     * Take a snapshot of the map for the export gif function
     * @function takeSnapShot
     * @param {Boolean} stop true if it is the last snapshot and it needs to export the gif, false otherwise
     */
    takeSnapShot(stop: boolean): void {
        // get map node + width and height
        const node: any = document.getElementsByClassName('rv-esri-map')[0];

        domtoimage.toSvg(node, { bgcolor: 'white', quality: 0.5 }).then(dataUrl => {
            this._gifImages.push(dataUrl);
        }).catch(error => {
            console.error('Not able to save screen shot!', error);
        });
    }

    exportToGIF() {
        // get map node + width and height set a maximum size to reduce file size... keep proportion
        const node: any = document.getElementsByClassName('rv-esri-map')[0];
        const proportion = node.offsetHeight / node.offsetWidth;
        const width = (node.offsetWidth <= 1500) ? node.offsetWidth : 1500;
        const height = width * proportion;

        try {
            // biggest problem is they are using 10 frames by second. Even if our frame are not moving, to have a frame duration
            // of 3 seconds will require 30 frames of the same image. Interval and numFrames parameters doesn't change anything
            // sampleInterval will reduce the size a little bit but we loose color symbology
            // use timeout to let the ui refresh itself before creating the GIF
            setTimeout(() => {
                gifshot.createGIF({
                    'images': this._gifImages,
                    'frameDuration': 10, // amount of time (10 = 1s) to stay on each frame
                    'numFrames': 1,
                    'gifWidth': width,
                    'gifHeight': height
                }, obj => {
                    this._gifImages = [];

                    if (!obj.error) {
                        FileSaver.saveAs(this.dataURItoBlob(obj.image), 'fgpv-slider-export.gif' );
                    }
                });
            }, 500);
        } catch(error) {
            console.error('Not able to convert screen shot to GIF!', error);
        }
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
        this._slider.noUiSlider.set([this.range.min, this.range.max]);
        this.setDefinitionQuery(this.range);
        this.pause();
    }

    /**
     * Step the silder
     * @function step
     * @param {String} direction up or down
     */
    step(direction: string): void {
        // get handles values and set step
        let range: Range;
        if (this._rangeType === 'dual') {
            const values: number[] = this._slider.noUiSlider.get().map(Number);

            // if type of step is static, use slider step value to set the step
            // if dynamic, use predefine step value
            if (this._stepType === 'dynamic') {
                const step = (direction === 'up') ? this._step : -this._step;

                // calculate range values then apply to slider
                range = { min: this.lock ? values[0] : this.setLeftAnchorDynamic(values, direction, step), max: this.setRightAnchorDynamic(values, direction, step) };
            } else if (this._stepType === 'static' && this._rangeType == 'dual') {
                // left handle = this._slider.noUiSlider.steps()[0] - [0] step down, [1] step up - limit min = -0
                // right handle = this._slider.noUiSlider.steps()[1] - [0] step down, [1] step up - limit max = null
                const stepLeft = (direction === 'up') ? this._slider.noUiSlider.steps()[0][1] : -this._slider.noUiSlider.steps()[0][0];
                const stepRight = (direction === 'up') ? this._slider.noUiSlider.steps()[1][1] : -this._slider.noUiSlider.steps()[1][0];

                // calculate range values then apply to slider
                // check stepRight (null) when max limit is set and setLeft (-0) when min limit is set. This way we can keep the interval.
                range = { min: this.lock ? this._slider.range.min :
                            (stepRight !== null) ? this._slider.range.min + stepLeft: this._slider.range.min,
                        max: (stepLeft !== -0) ? this._slider.range.max + stepRight : this._slider.range.max};
            } 

            this._slider.noUiSlider.set([range.min, range.max]);
        } else if (this._rangeType === 'single') {
            const value = +this._slider.noUiSlider.get();
            const index = this.limit.staticItems.findIndex((item) => { return item === value; });

            let updateValue: number;
            if ((index === 0 || index === -1 && value === this.limit.min) && direction === 'down') { updateValue = this.limit.min; }
            else if ((index === this.limit.staticItems.length - 1 || index === -1 && value === this.limit.max) && direction === 'up') { updateValue = this.limit.max; }
            else if ((index === -1 && value === this.limit.max) && direction === 'down') { updateValue = this.limit.staticItems[this.limit.staticItems.length - 1]; }
            else {
                updateValue = (direction === 'up') ? this.limit.staticItems[index + 1] : this.limit.staticItems[index - 1];
            }
            range = { min: updateValue, max: updateValue };

            this._slider.noUiSlider.set(range.min);
        }

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
    setLeftAnchorDynamic(values: number[], direction: string, step: number): number {
        let value: number = 0;
        const limit: Range = this.limit;

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

        // precision needs to be an interger between 0 and 100, if it is a date it will -1 or -2, cahnge value
        const precision = (this._precision < 0) ? 0 : this._precision;
        return parseFloat(value.toFixed(precision));
    }

    /**
     * Set right anchor
     * @function setRightAnchor
     * @param {Number} values values to set anchors to
     * @param {String} direction up or down
     * @param {Number} step step value
     * @return {Number} Left anchor value
     */
    setRightAnchorDynamic(values: number[], direction: string, step: number): number {
        let value: number = 0;
        const limit: Range = this.limit;

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

        // precision needs to be an interger between 0 and 100, if it is a date it will -1 or -2, cahnge value
        const precision = (this._precision < 0) ? 0 : this._precision;
        return parseFloat(value.toFixed(precision));
    }

    /**
     * Set definition query to filter the data
     * @function setDefinitionQuery
     * @param {Range} range range to use to filter
     */
    setDefinitionQuery(range: Range): void {
        // Sample with cql_filter (Supported by GeoServer):
        // http://jsfiddle.net/ZkC5M/274/: http://gis.fba.org.uk/geoserver/RP_Workspace/wms?service=WMS&request=GetMap&version=1.1.1&layers=RP_Workspace:sites_view1&styles=&format=image/png&transparent=true&height=256&width=256&cql_filter=RMIGroup%20=%20%27Almond%20Catchment%20ARMI%27&srs=EPSG:3857&bbox=-1252344.2714243277,7514065.628545966,0,8766409.899970295

        for (let layer of this._config.layers) {
            const myLayer = this._mapApi.layers.getLayersById(layer.id)[0];
            const layerType = myLayer.type;

            if (layerType === 'esriDynamic' || layerType === 'esriFeature') {
                if (this._config.type === 'number') {
                    myLayer.setFilterSql('rangeSliderNumberFilter',
                        `${layer.field} >= ${range.min} AND ${layer.field} <= ${range.max}`);
                } else if (this._config.type === 'date') {
                    const dates = this.getDate(range);
                    myLayer.setFilterSql('rangeSliderDateFilter',
                        `${layer.field} >= DATE \'${dates[0]}\' AND ${layer.field} <= DATE \'${dates[1]}\'`);
                }
            } else if (layerType === 'esriImage') {
                // image server works differently. Instead of setting the query, we set the time extent for the map
                // because image server will work with single range type, we add 1 day to end date to create an array
                const dates = this.getDate(range);
                const timeExtent = new this._myBundle.timeExtent();
                timeExtent.startTime = new Date(dates[0]);
                timeExtent.endTime = new Date(dates[1]);
                this._mapApi.esriMap.setTimeExtent(timeExtent);
            } else if (layerType === 'ogcWms') {
                // the way it works with string (we can use wildcard like %)
                // myLayer.esriLayer.setCustomParameters({}, {layerDefs: "{'0': \"CLAIM_STAT LIKE 'SUSPENDED'\"}"});
                if (this._config.type === 'number') {
                    myLayer.esriLayer.setCustomParameters({}, { 'layerDefs':
                        `{'${myLayer._viewerLayer._defaultFC}': '${layer.field} >= ${range.min} AND ${layer.field} <= ${range.max}'}` });
                } else if (this._config.type === 'date') {
                    const dates = this.getDate(range);
                    myLayer.esriLayer.setCustomParameters({}, { 'layerDefs':
                        `{'${myLayer._viewerLayer._defaultFC}': \"${layer.field} >= DATE '${dates[0]}' AND ${layer.field} <= DATE '${dates[1]}'\"}` });
                } else if (this._config.type === 'wmst') {
                    const dates = this.getDate(range, 'wmst');
                    const query = (this._rangeType === 'single') ? `${dates[0]}` : `${dates[0]}/${dates[1]}`;
                    myLayer.esriLayer.setCustomParameters({}, { 'TIME':query });
 
                     // NOTE: WMS Time parameter seems to be related to how the service let the data be searched
                     // https://www.mapserver.org/ogc/wms_time.html#supported-time-requests
                     // https://geo.weather.gc.ca/geomet?SERVICE=WMS&REQUEST=GetMap&FORMAT=image/png&TRANSPARENT=TRUE&STYLES=&VERSION=1.3.0&LAYERS=RADAR_1KM_RSNO&WIDTH=2783&HEIGHT=690&CRS=EPSG:3978&BBOX=-10634186.928075515,-1179774.2916349573,11455919.752137847,4297111.6621369505&TIME=2020-09-17T16%3A50%3A00Z&_ts=1600371840628
                     // Time part is TIME=2020-09-17T16%3A50%3A00Z - 2020-09-17 for date anfd T16:50:00z for hour.
                     // Even if in the spec it is said we can query for the whole hour like T16, it didn't work with Geomet. Also, I can't ask for range, it needs to be a single value.
                     // https://eccc-msc.github.io/open-data/usage/tutorial_web-maps_en/#animating-time-enabled-wms-layers-with-openlayers
                     // To make some of the WMST works, we will need more parameters like the format for time parameter.
 
                     // Millisend date converter: https://currentmillis.com/
                }
            }
        }
    }

    /**
     * Set definition query to filter the data
     * @function getDate
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
            dateMin = this.getEsriDate(min);
            dateMax = this.getEsriDate(max);
        } else if (type === 'wmst') {
            dateMin = this.getDateWMTS(min);
            dateMax = this.getDateWMTS(max);
        }

        return [dateMin, dateMax];
    }

    /**
     * Format the date for ESRI string date
     * @function getEsriDate
     * @param {Date} date date to format
     * @return {String}formated date
     */
    getEsriDate(date: Date): string {
        return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()} ${(date.getUTCHours().toString() as any).padStart(2, '0')}:${(date.getUTCMinutes().toString() as any).padStart(2, '0')}:${(date.getSeconds().toString() as any).padStart(2, '0')}`;
    }

    /**
     * Format the date for WMS-T string date
     * @function getDateWMTS
     * @param {Date} date date to format
     * @return {String}formated date
     */
    getDateWMTS(date: Date): string {
        return `${date.getFullYear()}-${((date.getMonth() + 1).toString() as any).padStart(2, '0')}-${(date.getDate().toString() as any).padStart(2, '0')}T${(date.getHours().toString() as any).padStart(2, '0')}:${(date.getMinutes().toString() as any).padStart(2, '0')}:${(date.getSeconds().toString() as any).padStart(2, '0')}Z`;
    }
}