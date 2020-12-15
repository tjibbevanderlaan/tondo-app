/**
 * Tondo
 * An app to stream whiteboard content captured by a webcam
 * This app is the frontend app which displays the camera feed.
 *
 * Tjibbe van der Laan (2020)
 * info@tjibbevanderlaan.nl
 */

/**
 * TondoAppController is the controller which
 * fetches the camera feed. If this fails, the controller
 * will fetch details to inform the user why calibration
 * of the camera failed.
 */
var TondoAppController = function() {
    this.statusbar = new TondoStatusBar(this); // statusbar viewer
    this.board = new TondoBoard(this); // board viewer
    this.api = {
        "feed": "/boardfeed",
        "details": "/boardfeed_details"
    }
}

/**
 * init will start the TondoAppController
 */
TondoAppController.prototype.launch = function() {
    // initialize board, set viewer
    this.statusbar.init();
    this.board.hide();
    tac = this;

    // fetch status from backend
    fetch(tac.api.feed).then(function(response) {
        // all good? show board
        if(response.status === 200) return tac.launchSucceeded();

        // not good? check details
        fetch(tac.api.details).then(function(response) {
            if(response.status !== 200) {
                tac.launchFailed('Backend does not respond succesfully. ' +
                            'Status Code: ' + response.status);
                return;
            }

            // check details to give feedback why failed
            response.json().then(function(data) {
                if(data.status !== 'failed') return tac.launchSucceeded();

                failure_type = data.name
                missing_markers = data.details && data.details.missing;
                tac.launchFailed('', failure_type, missing_markers);
            });
        }).catch(function(err){ tac.launchFailed(err) });
    }).catch(function(err){ tac.launchFailed(err) });
}

/**
 * launchSucceeded is the controller function which arranges that the viewer
 * will show the board
 */
TondoAppController.prototype.launchSucceeded = function() {
    this.board.setSource(this.api.feed);
    this.statusbar.success();
    this.board.showOnLoad(this.launchFailed('Could not load videofeed.'));
}

/**
 * launchFailed is the controller function which makes sure the error
 * message is correctly organized by te viewer
 * @param  {String} failure_type    Optional: describes type of fault
 * @param  {String} missing_markers Optional: describes markers missing
 */
TondoAppController.prototype.launchFailed = function(err, failure_type, missing_markers) {
    if(err) console.log('TondoAppController: ' + err);
    this.statusbar.failed(failure_type, missing_markers);
}

/**
 * _getElement is a helper function to retrieve DOM element
 * @param  {String} name The name of the whiteboard-element to be found
 * @return {DOMelement}      DOMElement
 */
TondoAppController.prototype._getElement = function(name) {
    return document.getElementById('tondo-' + name);
};

/**
 * TondoStatusBar is the viewer of status in the whiteboard app
 * @param {Object} mainApp The parent object where TondoStatusBar is part of
 */
var TondoStatusBar = function(mainApp) {

    this.getElement = mainApp._getElement;
    this.ele = {
        'statusbar': this.getElement('statusbar'),
        'nojs': this.getElement('nojs'),
        'init_text': this.getElement('initializing-text'),
        'init_loader': this.getElement('initializing-loader'),
        'missingmarkers_amount': this.getElement('failed-missingmarkers-amount'),
        'status': {
            'init': this.getElement('initializing'),
            'nomarkersfound': this.getElement('failed-nomarkersfound'),
            'missingmarkers': this.getElement('failed-missingmarkers'),
            'failed': this.getElement('failed-default')
        }
    }
    this.ele.markers = [];
    for (var i = 0; i < 4; i++) {
        this.ele.markers.push(this.getElement('marker-' + i))
    }
}

/**
 * init will show the initialzing status message of the app
 */
TondoStatusBar.prototype.init = function() {
    this._hideEle(this.ele.nojs);
    this._setStatus('init');
    this._showEle(this.ele.statusbar);
    this.ele.init_text.innerText = "Starting camera...";
    this.ele.init_loader.classList.add('animate');
    this._setInitTimeout();
}

/**
 * delay will show the status message that initializing
 * takes longer then expected
 */
TondoStatusBar.prototype.delay = function() {
    this._clearInitTimeout("delay");
    this._showEle(this.ele.statusbar);
    this.ele.init_text.innerText = "This takes longer then expected...";
    this.ele.init_loader.classList.remove('animate');
}

/**
 * success will remove the statusbar since loading the 
 * content seems to be succesfull
 */
TondoStatusBar.prototype.success = function() {
    this._clearInitTimeout();
    this._hideEle(this.ele.statusbar);
}

/**
 * failed will throw an error message since loading content
 * seems to be failed
 * @param  {String} failure_type   Optional. 'NoMarkersFound', 'MissingMarkers'
 * @param  {Array} missingmarkers  Optional. Specifies which marker ids are missing
 */
TondoStatusBar.prototype.failed = function(failure_type, missingmarkers) {
    this._clearInitTimeout();
    this._showEle(this.ele.statusbar);
    switch (failure_type) {
        case 'NoMarkersFound':
            this._setStatus('nomarkersfound');
            break;
        case 'MissingMarkers':
            this._setStatus('missingmarkers');
            if (missingmarkers) {
                this.ele.missingmarkers_amount.innerText = missingmarkers.length;
                this.ele.markers.forEach(function(marker, index) {
                    if (missingmarkers.indexOf(index) > -1) this._showEle(marker);
                    else this._hideEle(marker);
                }.bind(this));
            }
            break;
        default:
            this._setStatus('failed');
    }
}

/**
 * _showEle will display an DOM element
 * @param  {DOMElement} element DOM element to display
 */
TondoStatusBar.prototype._showEle = function(element) {
    element.classList.remove('hide');
}

/**
 * _hideEle will not display an DOM element
 * @param  {DOMElement} element DOM element to display
 */
TondoStatusBar.prototype._hideEle = function(element) {
    element.classList.add('hide');
}

/**
 * _setStatus will show a particular status
 */
TondoStatusBar.prototype._setStatus = function(status) {
    for (item in this.ele.status) {
        ele = this.ele.status[item]
        if (item !== status) this._hideEle(ele);
        else this._showEle(ele);
    }
}

/**
 * _setInitTimeout will set a timeout to trigger .delay or .failed
 * to inform the user that it took longer then expected, or that
 * something has failed
 */
TondoStatusBar.prototype._setInitTimeout = function() {
    this.timer = {
        'delay': window.setTimeout(function(){ this.delay()}.bind(this), 10000),
        'failed': window.setTimeout(function(){ 
            this.failed();
            console.log("TondoAppController: Backend did not respond within 60s.");
        }.bind(this), 60000)
    }
}

/**
 * _clearInitTimeout will clear the timers set by _setInitTimoeut
 */
TondoStatusBar.prototype._clearInitTimeout = function(timerName) {
    // if timer is specified, only clear this timer
    if(timerName) return window.clearTimeout(this.timer[timerName]);

    // if timer is not specified, reset all timers
    for(var timer in this.timer) {
        window.clearTimeout(this.timer[timer]);
    }
}

/**
 * TondoBoard is the viewer of the whiteboard video stream
 * @param {Object} mainApp The parent object where TondoBoard is part of
 */
var TondoBoard = function(mainApp) {
    this.element = mainApp._getElement('board');
    this.holder = mainApp._getElement('board-holder');
}

/**
 * setSource sets the source of the video feed
 * @param {String} sourceUrl URL of video feed of whiteboard
 */
TondoBoard.prototype.setSource = function(sourceUrl) {
    this.holder.src = sourceUrl;
}

/**
 * showOnLoad will trigger to show the board, once the image
 * has been fully loaded by the DOM (so it needs to be fully fetched
 * before triggering the show function)
 * @param {Function} onError Callback in case loading was not succesfull
 */
TondoBoard.prototype.showOnLoad = function(onError) {
    this.holder.onLoad = this.show;
    this.holder.onError = onError;
}

/**
 * show will show the TondoBoard
 */
TondoBoard.prototype.show = function() {
    this.element.classList.remove('hide');
    this.holder.classList.add('tondo-fadein');
    this.holder.classList.remove('tondo-fadeout');
}

/**
 * hide will hide the TondoBoard
 */
TondoBoard.prototype.hide = function() {
    this.element.classList.add('hide');
    this.holder.classList.add('tondo-fadeout');
    this.holder.classList.remove('tondo-fadein');
}
