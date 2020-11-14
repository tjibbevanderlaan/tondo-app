import numpy as np
import cv2

class BoardMarkerException(Exception):
    """ Some type of boardmarker exception """
    def __init__(self, message, props={}):

        # Call the base class constructor with the parameters it needs
        super().__init__(message)

        # Now for your custom code...
        self.props = props

class NoMarkersFound(BoardMarkerException):
    """ Did not found any marker exception """
    pass

class MissingMarkers(BoardMarkerException):
    """ Missing 1 or more markers exception """
    pass

class BoardMarker:

    def __init__(self, aruco_id, corners):
        self.aruco_id = aruco_id
        self.corners = corners
        self.corners_x = [p[0] for p in self.corners]
        self.corners_y = [p[1] for p in self.corners]

    def get_centroid(self):
        centroid = (int(sum(self.corners_x) / len(self.corners)), int(sum(self.corners_y) / len(self.corners)))
        return centroid

    def get_bounding_box(self):
        min_x = min(self.corners_x)
        min_y = min(self.corners_y)
        max_x = max(self.corners_x)
        max_y = max(self.corners_y)
        return [(min_x, min_y), (max_x, min_y), (max_x, max_y), (min_x, max_y)]

    def __str__(self):
        return "BoardMarker-%d (center:%d,%d)" % self.aruco_id, self.get_centroid()


class BoardMarkerRectangle:

    def __init__(self, aruco_detection):
        self.markers = []
        
        ids = aruco_detection[1]
        corners = aruco_detection[0]

        if ids is None:
            raise NoMarkersFound("No markers found.")
        elif len(ids) < 4:
            msg = "Did only found %d marker(s)." % len(ids)
            
            # find missing markers
            all_ids = [0,1,2,3] # all possible marker ids
            missing_ids = [this_id for this_id in all_ids if this_id not in ids]
            raise MissingMarkers(msg, props={'missing': missing_ids})

        for ind, aruco_id in enumerate(ids):
            self.markers.append(BoardMarker(aruco_id, corners[ind][0]))
        

    def get_all(self):
        pts = []
        for marker in self.markers:
            pts += marker.get_bounding_box()
        return pts

    def get_rectangle(self):
        # initialzie a list of coordinates that will be ordered
        # such that the first entry in the list is the top-left,
        # the second entry is the top-right, the third is the
        # bottom-right, and the fourth is the bottom-left
        rect = np.zeros((4, 2), dtype = "float32")

        pts = []
        for marker in self.markers:
            bb = marker.get_bounding_box()
            pts += bb

        # the top-left point will have the smallest sum, whereas
        # the bottom-right point will have the largest sum
        s = np.sum(pts, axis=1)
        rect[0] = pts[np.argmin(s)]
        rect[2] = pts[np.argmax(s)]
        # now, compute the difference between the points, the
        # top-right point will have the smallest difference,
        # whereas the bottom-left will have the largest difference
        diff = np.diff(pts, axis = 1)
        rect[1] = pts[np.argmin(diff)]
        rect[3] = pts[np.argmax(diff)]
        # return the ordered coordinates
        return rect

    def get_transform(self):
        # obtain a consistent order of the points and unpack them
        # individually
        rect = self.get_rectangle()
        (tl, tr, br, bl) = rect
        # compute the width of the new image, which will be the
        # maximum distance between bottom-right and bottom-left
        # x-coordiates or the top-right and top-left x-coordinates
        widthA = np.sqrt(((br[0] - bl[0]) ** 2) + ((br[1] - bl[1]) ** 2))
        widthB = np.sqrt(((tr[0] - tl[0]) ** 2) + ((tr[1] - tl[1]) ** 2))
        maxWidth = max(int(widthA), int(widthB))
        # compute the height of the new image, which will be the
        # maximum distance between the top-right and bottom-right
        # y-coordinates or the top-left and bottom-left y-coordinates
        heightA = np.sqrt(((tr[0] - br[0]) ** 2) + ((tr[1] - br[1]) ** 2))
        heightB = np.sqrt(((tl[0] - bl[0]) ** 2) + ((tl[1] - bl[1]) ** 2))
        maxHeight = max(int(heightA), int(heightB))
        # now that we have the dimensions of the new image, construct
        # the set of destination points to obtain a "birds eye view",
        # (i.e. top-down view) of the image, again specifying points
        # in the top-left, top-right, bottom-right, and bottom-left
        # order
        dst = np.array([
            [0, 0],
            [maxWidth - 1, 0],
            [maxWidth - 1, maxHeight - 1],
            [0, maxHeight - 1]], dtype = "float32")
        # compute the perspective transform matrix and then apply it
        matrix = cv2.getPerspectiveTransform(rect, dst)
        # warped = cv2.warpPerspective(image, M, (maxWidth, maxHeight))
        # return the warped image
        return (matrix, (maxWidth, maxHeight))
