#!/usr/bin/env python
""" Tondo
    An app to stream whiteboard content captured by a webcam
    This app is the Flask app which serves the camera feed
    to the frontend app of Tondo.

    Tjibbe van der Laan (2020) """
from flask import Flask, render_template, Response, jsonify
from camera_board import Camera
from boardmarker import BoardMarkerException

app = Flask(__name__)

@app.route('/')
def index():
    """Video streaming home page."""
    return render_template('index.html')

def gen(camera):
    """Video streaming generator function."""
    while True:
        frame = camera.get_frame()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

@app.route('/boardfeed')
def boardfeed():
    """ Video feed of board """
    mimetype = 'multipart/x-mixed-replace; boundary=frame'
    try:
        camera = Camera()
    except Camera.CalibrateException:
        # Could not calibrate board, so no content to display
        return Response(status=204, mimetype=mimetype)
    else:
        # Video streaming route. Put this in the src attribute of an img tag.
        return Response(gen(camera),mimetype=mimetype)

@app.route('/boardfeed_details')
def boardfeed_details():
    """ Details of video feed """
    try:
        Camera()
    except Camera.CalibrateException as err:
        response = {'status': 'failed', 'message': str(err)}

        # if there are details which can be shared in the frontend,
        # add that to response
        if isinstance(err.details, BoardMarkerException):
            response['name'] = err.details.__class__.__name__
            response['details'] = err.details.props
        return jsonify(response), 200
    else:
        return jsonify({'status': 'success'}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, threaded=True)
