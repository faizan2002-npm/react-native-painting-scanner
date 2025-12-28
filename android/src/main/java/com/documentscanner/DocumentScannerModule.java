package com.documentscanner;

import android.util.Base64;
import com.documentscanner.views.MainView;
import com.documentscanner.ImageProcessor;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReadableMap;
import org.opencv.core.Mat;
import org.opencv.core.MatOfByte;
import org.opencv.core.Point;
import org.opencv.imgcodecs.Imgcodecs;

/**
 * Created by andre on 28/11/2017.
 */

public class DocumentScannerModule extends ReactContextBaseJavaModule{

    public DocumentScannerModule(ReactApplicationContext reactContext){
        super(reactContext);
    }


    @Override
    public String getName() {
        return "RNPdfScannerManager";
    }

    @ReactMethod
    public void capture(){
        MainView view = MainView.getInstance();
        view.capture();
    }

    @ReactMethod
    public void reapplyPerspectiveCrop(String imageInput, ReadableMap coordinates, 
                                        double quality, Promise promise)
    {
        Mat originalMat = null;
        MatOfByte matOfByteInput = null;
        
        try {
            // Handle both file paths and base64 strings
            if (imageInput.startsWith("file://")) {
                // File path - read directly
                String filePath = imageInput.replace("file://", "");
                originalMat = Imgcodecs.imread(filePath, Imgcodecs.IMREAD_COLOR);
                matOfByteInput = null; // Not needed for file path
            } else {
                // Base64 string - decode first
                byte[] decodedBytes = Base64.decode(imageInput, Base64.DEFAULT);
                matOfByteInput = new MatOfByte(decodedBytes);
                originalMat = Imgcodecs.imdecode(matOfByteInput, Imgcodecs.IMREAD_COLOR);
            }
            
            if (originalMat == null || originalMat.empty()) {
                if (matOfByteInput != null) {
                    matOfByteInput.release();
                }
                promise.reject("DECODE_ERROR", "Failed to decode image", (Throwable) null);
                return;
            }
            
            // Extract coordinates from ReadableMap
            ReadableMap topLeftMap = coordinates.getMap("topLeft");
            ReadableMap topRightMap = coordinates.getMap("topRight");
            ReadableMap bottomLeftMap = coordinates.getMap("bottomLeft");
            ReadableMap bottomRightMap = coordinates.getMap("bottomRight");
            
            if (topLeftMap == null || topRightMap == null || bottomLeftMap == null || bottomRightMap == null) {
                originalMat.release();
                if (matOfByteInput != null) {
                    matOfByteInput.release();
                }
                promise.reject("INVALID_COORDINATES", "Missing coordinate data", (Throwable) null);
                return;
            }
            
            Point[] points = new Point[4];
            // Order: topLeft, topRight, bottomRight, bottomLeft (matching fourPointTransform)
            points[0] = new Point(topLeftMap.getDouble("x"), topLeftMap.getDouble("y")); // topLeft
            points[1] = new Point(topRightMap.getDouble("x"), topRightMap.getDouble("y")); // topRight
            points[2] = new Point(bottomRightMap.getDouble("x"), bottomRightMap.getDouble("y")); // bottomRight
            points[3] = new Point(bottomLeftMap.getDouble("x"), bottomLeftMap.getDouble("y")); // bottomLeft
            
            // Call ImageProcessor to re-apply perspective transform
            Mat processedMat = ImageProcessor.reapplyPerspectiveTransform(originalMat, points, quality);
            
            if (processedMat == null || processedMat.empty()) {
                originalMat.release();
                if (matOfByteInput != null) {
                    matOfByteInput.release();
                }
                promise.reject("PROCESS_ERROR", "Failed to process image", (Throwable) null);
                return;
            }
            
            // Convert Mat back to base64
            MatOfByte matOfByteOutput = new MatOfByte();
            Imgcodecs.imencode(".jpg", processedMat, matOfByteOutput);
            byte[] byteArray = matOfByteOutput.toArray();
            String base64Result = Base64.encodeToString(byteArray, Base64.NO_WRAP);
            
            promise.resolve(base64Result);
            
            // Release Mat resources
            originalMat.release();
            processedMat.release();
            if (matOfByteInput != null) {
                matOfByteInput.release();
            }
            matOfByteOutput.release();
            
        } catch (Exception e) {
            // Clean up resources in case of error
            if (originalMat != null && !originalMat.empty()) {
                originalMat.release();
            }
            if (matOfByteInput != null) {
                matOfByteInput.release();
            }
            promise.reject("CROP_ERROR", "Failed to reapply perspective crop: " + e.getMessage(), e);
        }
    }
}
