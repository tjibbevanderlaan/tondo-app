#!/usr/bin/env python
""" CameraBoard
    Implementation of BaseCamera of the actual camera used for the whiteboard.
    This implementation is especially optimized for an INTERFIX 2k webcam.
    Tjibbe van der Laan (2020) """

import cv2
import cv2.aruco as aruco
import numpy as np
import math
from base_camera import BaseCamera
from boardmarker import BoardMarkerRectangle
from boardmarker import BoardMarkerException

# Initial camera calibration metrics
CAM_DIM = (1280, 720)
CAM_K = np.array([[917.4853276592257, 0.0, 605.4052226598109], [0.0, 918.1292012233695, 320.7718201894898], [0.0, 0.0, 1.0]])
CAM_D = np.array([[-0.03841030416616685], [0.11959407692635408], [-0.47996172427935363], [0.3453542777923639]])
map1, map2 = cv2.fisheye.initUndistortRectifyMap(CAM_K, CAM_D, np.eye(3), CAM_K, CAM_DIM, cv2.CV_16SC2)

# Secondary marker calibration props
aruco_dict = aruco.Dictionary_get(aruco.DICT_4X4_250)
parameters = aruco.DetectorParameters_create()


class Camera(BaseCamera):
    board_transform_matrix = None
    board_dimensions = None

    def __init__(self):
        super(Camera, self).__init__()

    @staticmethod
    def calibrate():
        camera = cv2.VideoCapture(0)
        camera.set(3, 1280)
        camera.set(4, 720)

        if not camera.isOpened():
            raise RuntimeError('Could not start camera.')

        # read current frame
        _, frame = camera.read()

        # fisheye calibrate frame
        frame = cv2.remap(frame, map1, map2, interpolation=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)
        gray_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        # marker calibrate frame
        detection = aruco.detectMarkers(gray_frame, aruco_dict, parameters=parameters)
        try:
            board = BoardMarkerRectangle(detection)
        except BoardMarkerException as err:
            raise Camera.CalibrateException('Could not calibrate board', details=err)

        Camera.board_transform_matrix, Camera.board_dimensions = board.get_transform()
        Camera.is_calibrated = True


    @staticmethod
    def frames():
        camera = cv2.VideoCapture(0)
        camera.set(3, 1280)
        camera.set(4, 720)

        if not camera.isOpened():
            raise RuntimeError('Could not start camera.')

        if not Camera.is_calibrated:
            self.calibrate()

        while True:
            # read current frame
            _, frame = camera.read()

            # calibrate frame
            frame = cv2.remap(frame, map1, map2, interpolation=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)

            # warp frame to markers
            frame = cv2.warpPerspective(frame, Camera.board_transform_matrix, Camera.board_dimensions)

            # rotate frame 180
            frame = cv2.rotate(frame, cv2.ROTATE_180)

            # encode as a jpeg image and return it
            _, jpeg = cv2.imencode('.jpg', frame)
            yield jpeg.tobytes()

