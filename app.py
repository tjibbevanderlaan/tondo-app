#!/usr/bin/env python
from importlib import import_module
from flask import Flask, render_template, Response, jsonify
from camera_board import Camera
import pprint
from boardmarker import BoardMarkerException

 # from camera_dummy import Camera

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

@app.route('/boardfeed_details')
def boardfeed_details():
    try:
        camera = Camera()
    except Camera.CalibrateException as err:
        # Could not calibrate board, so no content to display
        error_message = {'status': 'failed', 'message': str(err)}
        return jsonify(error_message), 200
    else:
        return jsonify({'status': 'success'}), 200

# @app.route('/start_feed')
# def start_feed():
#     print('ping to start_feed')
#     try:
#         camera = Camera()
#     except Camera.CalibrateException as err:
#         response = {'status': 'failed', 'message': str(err)}

#         # if there are details which can be shared in the frontend,
#         # add that to response
#         if isinstance(err.details, BoardMarkerException):
#             response['name'] = err.details.__class__.__name__
#             response['details'] = err.details.props

#         # return response
#         return jsonify(response), 200

#     return jsonify({'status': 'success'}), 200


@app.route('/boardfeed')
def boardfeed():
    mimetype = 'multipart/x-mixed-replace; boundary=frame'
    try:
        camera = Camera()
    except Camera.CalibrateException as err:
        # Could not calibrate board, so no content to display
        return Response(status=204, mimetype=mimetype)
    else:
        """Video streaming route. Put this in the src attribute of an img tag."""
        return Response(gen(Camera()),mimetype=mimetype)


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, threaded=True)
