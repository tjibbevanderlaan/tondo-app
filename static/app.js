/**
 * Tjibbe van der Laan (2020)
 * info@tjibbevanderlaan.nl
 */

/**
 * WhiteBoardCameraApp is the controller which 
 * fethes the camera status and video stream from the 
 * backend and controls the frontend viewer to show 
 * the information 
 */
var WhiteboardCameraApp = function() {
    this.statusbar = new StatusBar(this); // statusbar viewer
    this.board = new Board(this); // board viewer
    this.feedurl = "/boardfeed"
}

/**
 * init will start the WhiteBoardCameraApp
 */
WhiteboardCameraApp.prototype.init = function() {
    // initialize board
    // set viewer
    statusbar = this.statusbar;
    board = this.board;
    statusbar.init();
    board.hide();

    // fetch status from backend
    fetch(this.feedurl).then(function(response) {
        // all good? show board
        if(response.status === 200) return this.showBoard();

        // not good? check details
        fetch("/boardfeed_details").then(function(response) {
            if(response.status !== 200) {
                statusbar.failed();
                console.log('Looks like there was a problem. Status Code: ' + response.status);
                return;
            }
            
            // check details to give feedback why failed
            response.json().then(function(data) {
                if(data.status !== 'failed') return this.showBoard(); 
   
                failure_type = data.name
                missing_markers = data.details && data.details.missing
                statusbar.failed(failure_type, missing_markers);
            });
        });
    });
}

/**
 * showBoard is the controller function which arranges that the viewer
 * will show the board
 */
WhiteboardCameraApp.prototype.showBoard = function() {
    board = this.board;
    board.setSource(this.feedurl);
    statusbar.success();
    board.show();
}

/**
 * _getElement is a helper function to retrieve DOM element
 * @param  {String} name The name of the whiteboard-element to be found
 * @return {DOMelement}      DOMElement 
 */
WhiteboardCameraApp.prototype._getElement = function(name) {
    return document.getElementById('wca-' + name);
};

/**
 * StatusBar is the viewer of status in the whiteboard app
 * @param {Object} mainApp The parent object where StatusBar is part of
 */
var StatusBar = function(mainApp) {

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
StatusBar.prototype.init = function() {
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
StatusBar.prototype.delay = function() {
    this._clearInitTimeout();
    this._showEle(this.ele.statusbar);
    this.ele.init_text.innerText = "This takes longer then expected...";
    this.ele.init_loader.classList.remove('animate');
}

/**
 * success will remove the statusbar since loading the 
 * content seems to be succesfull
 */
StatusBar.prototype.success = function() {
    this._clearInitTimeout();
    this._hideEle(this.ele.statusbar);
}

/**
 * failed will throw an error message since loading content
 * seems to be failed
 * @param  {String} failure_type   Optional. 'NoMarkersFound', 'MissingMarkers'
 * @param  {Array} missingmarkers  Optional. Specifies which marker ids are missing
 */
StatusBar.prototype.failed = function(failure_type, missingmarkers) {
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
StatusBar.prototype._showEle = function(element) {
    element.classList.remove('hide');
}

/**
 * _hideEle will not display an DOM element
 * @param  {DOMElement} element DOM element to display
 */
StatusBar.prototype._hideEle = function(element) {
    element.classList.add('hide');
}

/**
 * _setStatus will show a particular status
 */
StatusBar.prototype._setStatus = function(status) {
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
StatusBar.prototype._setInitTimeout = function() {
    this.timer = [
        window.setTimeout(this.delay.bind(this), 10000),
        window.setTimeout(this.failed.bind(this), 60000)
    ]
}

/**
 * _clearInitTimeout will clear the timers set by _setInitTimoeut
 */
StatusBar.prototype._clearInitTimeout = function() {
    for (var i = 0; i < this.timer.length; i++) window.clearTimeout(this.timer[i]);
}


/**
 * Board is the viewer of the whiteboard video stream
 * @param {Object} mainApp The parent object where Board is part of
 */
var Board = function(mainApp) {
    this.element = mainApp._getElement('board');
    this.holder = mainApp._getElement('board-holder');
}

/**
 * setSource sets the source of the video feed
 * @param {String} sourceUrl URL of video feed of whiteboard
 */
Board.prototype.setSource = function(sourceUrl) {
    this.holder.src = sourceUrl;
}

/**
 * show will show the Board 
 */
Board.prototype.show = function() {
    this.element.classList.remove('hide');
    this.holder.classList.add('wca-fadein');
    this.holder.classList.remove('wca-fadeout');
}

/**
 * hide will hide the Board
 */
Board.prototype.hide = function() {
    this.element.classList.add('hide');
    this.holder.classList.add('wca-fadeout');
    this.holder.classList.remove('wca-fadein');
}