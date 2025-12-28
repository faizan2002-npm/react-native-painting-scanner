package org.opencv.engine;

import android.os.IBinder;
import android.os.IInterface;
import android.os.RemoteException;

/**
 * Stub interface for OpenCV Engine Service
 * This is a placeholder to allow compilation when AIDL generation fails
 */
public interface OpenCVEngineInterface extends IInterface {
    int getEngineVersion() throws RemoteException;
    String getLibPathByVersion(String version) throws RemoteException;
    boolean installVersion(String version) throws RemoteException;
    String getLibraryList(String version) throws RemoteException;
    
    abstract class Stub {
        public static OpenCVEngineInterface asInterface(IBinder obj) {
            // Return null to indicate service not available
            // This will trigger the fallback to embedded OpenCV
            return null;
        }
    }
}

