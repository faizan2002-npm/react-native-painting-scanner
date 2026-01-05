import UIKit
import AVFoundation
import CoreMedia
import CoreVideo
import CoreImage
import ImageIO
import GLKit

enum IPDFCameraViewType {
    case blackAndWhite
    case normal
}

enum IPDFRectangeType {
    case good
    case badAngle
    case tooFar
}

protocol IPDFCameraViewControllerDelegate: AnyObject {
    func didDetectRectangle(_ rectangle: CIRectangleFeature, withType type: IPDFRectangeType)
}

class IPDFCameraViewController: UIView {
    var enableBorderDetection: Bool = false
    var enableTorch: Bool = false {
        didSet {
            updateTorch()
        }
    }
    var useFrontCam: Bool = false {
        didSet {
            if useFrontCam != oldValue {
                stop()
                setupCameraView()
                start()
            }
        }
    }
    weak var delegate: IPDFCameraViewControllerDelegate?
    var cameraViewType: IPDFCameraViewType = .normal {
        didSet {
            applyCameraViewType()
        }
    }
    
    var overlayColor: UIColor = UIColor(red: 1.0, green: 0.0, blue: 0.0, alpha: 0.5)
    var saturation: Float = 1.0
    var contrast: Float = 1.0
    var brightness: Float = 0.0
    var detectionRefreshRateInMS: Int = 100
    
    private var captureSession: AVCaptureSession?
    private var captureDevice: AVCaptureDevice?
    private var context: EAGLContext?
    private var stillImageOutput: AVCaptureStillImageOutput?
    private var forceStop: Bool = false
    private var lastDetectionRate: Int = 100
    
    private var coreImageContext: CIContext?
    private var renderBuffer: GLuint = 0
    private var glkView: GLKView?
    
    private var isStopped: Bool = true
    private var imageDetectionConfidence: CGFloat = 0.0
    private var borderDetectTimeKeeper: Timer?
    private var borderDetectFrame: Bool = false
    private var borderDetectLastRectangleFeature: CIRectangleFeature?
    private var isCapturing: Bool = false
    
    override init(frame: CGRect) {
        super.init(frame: frame)
        setupNotifications()
    }
    
    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setupNotifications()
    }
    
    deinit {
        NotificationCenter.default.removeObserver(self)
    }
    
    private func setupNotifications() {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(backgroundMode),
            name: UIApplication.willResignActiveNotification,
            object: nil
        )
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(foregroundMode),
            name: UIApplication.didBecomeActiveNotification,
            object: nil
        )
    }
    
    @objc private func backgroundMode() {
        forceStop = true
    }
    
    @objc private func foregroundMode() {
        forceStop = false
    }
    
    func createGLKView() {
        guard context == nil else { return }
        
        context = EAGLContext(api: .openGLES2)
        guard let context = context else { return }
        
        let view = GLKView(frame: bounds)
        view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        view.translatesAutoresizingMaskIntoConstraints = true
        view.context = context
        view.contentScaleFactor = 1.0
        view.drawableDepthFormat = .format24
        insertSubview(view, at: 0)
        glkView = view
        
        glGenRenderbuffers(1, &renderBuffer)
        glBindRenderbuffer(GLenum(GL_RENDERBUFFER), renderBuffer)
        coreImageContext = CIContext(eaglContext: context)
        EAGLContext.setCurrent(context)
    }
    
    func setupCameraView() {
        createGLKView()
        
        var device: AVCaptureDevice?
        let devices = AVCaptureDevice.devices(for: .video)
        
        for possibleDevice in devices {
            if useFrontCam {
                if possibleDevice.position == .front {
                    device = possibleDevice
                    break
                }
            } else {
                if possibleDevice.position != .front {
                    device = possibleDevice
                    break
                }
            }
        }
        
        guard let captureDevice = device else { return }
        
        imageDetectionConfidence = 0.0
        
        let session = AVCaptureSession()
        self.captureSession = session
        session.beginConfiguration()
        self.captureDevice = captureDevice
        
        do {
            let input = try AVCaptureDeviceInput(device: captureDevice)
            session.sessionPreset = .photo
            if session.canAddInput(input) {
                session.addInput(input)
            }
            
            let dataOutput = AVCaptureVideoDataOutput()
            dataOutput.alwaysDiscardsLateVideoFrames = true
            dataOutput.videoSettings = [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA]
            dataOutput.setSampleBufferDelegate(self, queue: DispatchQueue.main)
            if session.canAddOutput(dataOutput) {
                session.addOutput(dataOutput)
            }
            
            stillImageOutput = AVCaptureStillImageOutput()
            if session.canAddOutput(stillImageOutput!) {
                session.addOutput(stillImageOutput!)
            }
            
            if let connection = dataOutput.connections.first {
                connection.videoOrientation = .portrait
            }
            
            if captureDevice.isFlashAvailable {
                try captureDevice.lockForConfiguration()
                captureDevice.flashMode = .off
                if captureDevice.isFocusModeSupported(.continuousAutoFocus) {
                    captureDevice.focusMode = .continuousAutoFocus
                }
                captureDevice.unlockForConfiguration()
            }
            
            session.commitConfiguration()
        } catch {
            print("Error setting up camera: \(error)")
        }
    }
    
    private func applyCameraViewType() {
        let effect = UIBlurEffect(style: .dark)
        let viewWithBlurredBackground = UIVisualEffectView(effect: effect)
        viewWithBlurredBackground.frame = bounds
        insertSubview(viewWithBlurredBackground, aboveSubview: glkView!)
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
            viewWithBlurredBackground.removeFromSuperview()
        }
    }
    
    private func updateTorch() {
        guard let device = captureDevice,
              device.hasTorch && device.hasFlash else { return }
        
        do {
            try device.lockForConfiguration()
            device.torchMode = enableTorch ? .on : .off
            device.unlockForConfiguration()
        } catch {
            print("Error updating torch: \(error)")
        }
    }
    
    func start() {
        isStopped = false
        captureSession?.startRunning()
        
        let detectionRefreshRate = CGFloat(detectionRefreshRateInMS) / 100.0
        
        if lastDetectionRate != detectionRefreshRateInMS {
            borderDetectTimeKeeper?.invalidate()
            borderDetectTimeKeeper = Timer.scheduledTimer(
                withTimeInterval: TimeInterval(detectionRefreshRate),
                repeats: true
            ) { [weak self] _ in
                self?.enableBorderDetectFrame()
            }
        }
        
        hideGLKView(false, completion: nil)
        lastDetectionRate = detectionRefreshRateInMS
    }
    
    func stop() {
        isStopped = true
        captureSession?.stopRunning()
        borderDetectTimeKeeper?.invalidate()
        hideGLKView(true, completion: nil)
    }
    
    private func enableBorderDetectFrame() {
        borderDetectFrame = true
    }
    
    func focusAtPoint(_ point: CGPoint, completionHandler: @escaping () -> Void) {
        guard let device = captureDevice else {
            completionHandler()
            return
        }
        
        let frameSize = bounds.size
        let pointOfInterest = CGPoint(
            x: point.y / frameSize.height,
            y: 1.0 - (point.x / frameSize.width)
        )
        
        if device.isFocusPointOfInterestSupported && device.isFocusModeSupported(.autoFocus) {
            do {
                try device.lockForConfiguration()
                if device.isFocusModeSupported(.continuousAutoFocus) {
                    device.focusMode = .continuousAutoFocus
                    device.focusPointOfInterest = pointOfInterest
                }
                
                if device.isExposurePointOfInterestSupported && device.isExposureModeSupported(.continuousAutoExposure) {
                    device.exposurePointOfInterest = pointOfInterest
                    device.exposureMode = .continuousAutoExposure
                }
                device.unlockForConfiguration()
                completionHandler()
            } catch {
                completionHandler()
            }
        } else {
            completionHandler()
        }
    }
    
    func captureImageWithCompletionHandler(_ completionHandler: @escaping (UIImage?, UIImage?, CIRectangleFeature?) -> Void) {
        guard !isCapturing else { return }
        
        hideGLKView(true) {
            self.hideGLKView(false) {
                self.hideGLKView(true, completion: nil)
            }
        }
        
        isCapturing = true
        
        guard let stillImageOutput = stillImageOutput else {
            isCapturing = false
            completionHandler(nil, nil, nil)
            return
        }
        
        var videoConnection: AVCaptureConnection?
        for connection in stillImageOutput.connections {
            for port in connection.inputPorts {
                if port.mediaType == .video {
                    videoConnection = connection
                    break
                }
            }
            if videoConnection != nil { break }
        }
        
        guard let connection = videoConnection else {
            isCapturing = false
            completionHandler(nil, nil, nil)
            return
        }
        
        stillImageOutput.captureStillImageAsynchronously(from: connection) { [weak self] imageSampleBuffer, error in
            guard let self = self else { return }
            
            if let error = error {
                print("Error capturing image: \(error)")
                self.isCapturing = false
                completionHandler(nil, nil, nil)
                return
            }
            
            guard let imageSampleBuffer = imageSampleBuffer,
                  let imageData = AVCaptureStillImageOutput.jpegStillImageNSDataRepresentation(imageSampleBuffer) else {
                self.isCapturing = false
                completionHandler(nil, nil, nil)
                return
            }
            
            if self.cameraViewType == .blackAndWhite || self.enableBorderDetection {
                guard let enhancedImage = CIImage(data: imageData) else {
                    self.isCapturing = false
                    completionHandler(UIImage(data: imageData), UIImage(data: imageData), nil)
                    return
                }
                
                let processedImage: CIImage
                if self.cameraViewType == .blackAndWhite {
                    processedImage = self.filteredImageUsingEnhanceFilter(on: enhancedImage)
                } else {
                    processedImage = self.filteredImageUsingContrastFilter(on: enhancedImage)
                }
                
                if self.enableBorderDetection && rectangleDetectionConfidenceHighEnough(self.imageDetectionConfidence) {
                    let detector = self.highAccuracyRectangleDetector()
                    let rectangles = detector.features(in: processedImage) as? [CIRectangleFeature] ?? []
                    let rectangleFeature = self.biggestRectangle(in: rectangles)
                    
                    if let rectangle = rectangleFeature {
                        let correctedImage = self.correctPerspective(for: processedImage, withFeatures: rectangle)
                        
                        UIGraphicsBeginImageContext(CGSize(width: correctedImage.extent.size.height, height: correctedImage.extent.size.width))
                        UIImage(ciImage: correctedImage, scale: 1.0, orientation: .right).draw(in: CGRect(x: 0, y: 0, width: correctedImage.extent.size.height, height: correctedImage.extent.size.width))
                        let image = UIGraphicsGetImageFromCurrentImageContext()
                        let initialImage = UIImage(data: imageData)
                        UIGraphicsEndImageContext()
                        
                        self.hideGLKView(false, completion: nil)
                        self.isCapturing = false
                        completionHandler(image, initialImage, rectangle)
                        return
                    }
                }
                
                self.hideGLKView(false, completion: nil)
                let initialImage = UIImage(data: imageData)
                self.isCapturing = false
                completionHandler(initialImage, initialImage, nil)
            } else {
                self.hideGLKView(false, completion: nil)
                let initialImage = UIImage(data: imageData)
                self.isCapturing = false
                completionHandler(initialImage, initialImage, nil)
            }
        }
    }
    
    private func hideGLKView(_ hidden: Bool, completion: (() -> Void)?) {
        UIView.animate(withDuration: 0.1, animations: {
            self.glkView?.alpha = hidden ? 0.0 : 1.0
        }) { _ in
            completion?()
        }
    }
    
    private func filteredImageUsingEnhanceFilter(on image: CIImage) -> CIImage {
        start()
        let filter = CIFilter(name: "CIColorControls")
        filter?.setValue(image, forKey: kCIInputImageKey)
        filter?.setValue(brightness, forKey: kCIInputBrightnessKey)
        filter?.setValue(contrast, forKey: kCIInputContrastKey)
        filter?.setValue(saturation, forKey: kCIInputSaturationKey)
        return filter?.outputImage ?? image
    }
    
    private func filteredImageUsingContrastFilter(on image: CIImage) -> CIImage {
        let filter = CIFilter(name: "CIColorControls")
        filter?.setValue(1.0, forKey: kCIInputContrastKey)
        filter?.setValue(image, forKey: kCIInputImageKey)
        return filter?.outputImage ?? image
    }
    
    private func correctPerspective(for image: CIImage, withFeatures rectangleFeature: CIRectangleFeature) -> CIImage {
        var rectangleCoordinates: [String: Any] = [:]
        let newLeft = CGPoint(x: rectangleFeature.topLeft.x + 30, y: rectangleFeature.topLeft.y)
        let newRight = CGPoint(x: rectangleFeature.topRight.x, y: rectangleFeature.topRight.y)
        let newBottomLeft = CGPoint(x: rectangleFeature.bottomLeft.x + 30, y: rectangleFeature.bottomLeft.y)
        let newBottomRight = CGPoint(x: rectangleFeature.bottomRight.x, y: rectangleFeature.bottomRight.y)
        
        rectangleCoordinates["inputTopLeft"] = CIVector(cgPoint: newLeft)
        rectangleCoordinates["inputTopRight"] = CIVector(cgPoint: newRight)
        rectangleCoordinates["inputBottomLeft"] = CIVector(cgPoint: newBottomLeft)
        rectangleCoordinates["inputBottomRight"] = CIVector(cgPoint: newBottomRight)
        
        return image.applyingFilter("CIPerspectiveCorrection", parameters: rectangleCoordinates)
    }
    
    private func rectangleDetector() -> CIDetector {
        struct Static {
            static let detector: CIDetector = CIDetector(
                ofType: CIDetectorTypeRectangle,
                context: nil,
                options: [
                    CIDetectorAccuracy: CIDetectorAccuracyLow,
                    CIDetectorTracking: true
                ]
            )!
        }
        return Static.detector
    }
    
    private func highAccuracyRectangleDetector() -> CIDetector {
        struct Static {
            static let detector: CIDetector = CIDetector(
                ofType: CIDetectorTypeRectangle,
                context: nil,
                options: [
                    CIDetectorAccuracy: CIDetectorAccuracyHigh,
                    CIDetectorReturnSubFeatures: true
                ]
            )!
        }
        return Static.detector
    }
    
    private func biggestRectangle(in rectangles: [CIRectangleFeature]) -> CIRectangleFeature? {
        guard !rectangles.isEmpty else { return nil }
        
        var halfPerimeterValue: CGFloat = 0
        var biggestRectangle = rectangles[0]
        
        for rect in rectangles {
            let p1 = rect.topLeft
            let p2 = rect.topRight
            let width = hypot(p1.x - p2.x, p1.y - p2.y)
            
            let p3 = rect.topLeft
            let p4 = rect.bottomLeft
            let height = hypot(p3.x - p4.x, p3.y - p4.y)
            
            let currentHalfPerimeterValue = height + width
            
            if halfPerimeterValue < currentHalfPerimeterValue {
                halfPerimeterValue = currentHalfPerimeterValue
                biggestRectangle = rect
            }
        }
        
        if let delegate = delegate {
            delegate.didDetectRectangle(biggestRectangle, withType: typeForRectangle(biggestRectangle))
        }
        
        return biggestRectangle
    }
    
    private func typeForRectangle(_ rectangle: CIRectangleFeature) -> IPDFRectangeType {
        guard let glkView = glkView else { return .good }
        
        if abs(rectangle.topRight.y - rectangle.topLeft.y) > 100 ||
           abs(rectangle.topRight.x - rectangle.bottomRight.x) > 100 ||
           abs(rectangle.topLeft.x - rectangle.bottomLeft.x) > 100 ||
           abs(rectangle.bottomLeft.y - rectangle.bottomRight.y) > 100 {
            return .badAngle
        } else if (glkView.frame.origin.y + glkView.frame.size.height) - rectangle.topLeft.y > 150 ||
                  (glkView.frame.origin.y + glkView.frame.size.height) - rectangle.topRight.y > 150 ||
                  glkView.frame.origin.y - rectangle.bottomLeft.y > 150 ||
                  glkView.frame.origin.y - rectangle.bottomRight.y > 150 {
            return .tooFar
        }
        return .good
    }
    
    private func drawHighlightOverlay(for image: CIImage, topLeft: CGPoint, topRight: CGPoint, bottomLeft: CGPoint, bottomRight: CGPoint) -> CIImage {
        let overlay = CIImage(color: CIColor(color: overlayColor))
            .cropped(to: image.extent)
        
        let transform = CIFilter(name: "CIPerspectiveTransformWithExtent")
        transform?.setValue(CIVector(cgRect: image.extent), forKey: "inputExtent")
        transform?.setValue(CIVector(cgPoint: topLeft), forKey: "inputTopLeft")
        transform?.setValue(CIVector(cgPoint: topRight), forKey: "inputTopRight")
        transform?.setValue(CIVector(cgPoint: bottomLeft), forKey: "inputBottomLeft")
        transform?.setValue(CIVector(cgPoint: bottomRight), forKey: "inputBottomRight")
        
        let transformedOverlay = transform?.outputImage ?? overlay
        return transformedOverlay.composited(over: image)
    }
}

func rectangleDetectionConfidenceHighEnough(_ confidence: CGFloat) -> Bool {
    return confidence > 1.0
}

// MARK: - AVCaptureVideoDataOutputSampleBufferDelegate
extension IPDFCameraViewController: AVCaptureVideoDataOutputSampleBufferDelegate {
    func captureOutput(_ output: AVCaptureOutput, didOutput sampleBuffer: CMSampleBuffer, from connection: AVCaptureConnection) {
        guard !forceStop, !isStopped, !isCapturing, CMSampleBufferIsValid(sampleBuffer) else { return }
        
        guard let pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer) else { return }
        var image = CIImage(cvPixelBuffer: pixelBuffer)
        
        if cameraViewType != .normal {
            image = filteredImageUsingEnhanceFilter(on: image)
        } else {
            image = filteredImageUsingContrastFilter(on: image)
        }
        
        if enableBorderDetection {
            if borderDetectFrame {
                let detector = highAccuracyRectangleDetector()
                borderDetectLastRectangleFeature = biggestRectangle(in: detector.features(in: image) as? [CIRectangleFeature] ?? [])
                borderDetectFrame = false
            }
            
            if let rectangle = borderDetectLastRectangleFeature {
                imageDetectionConfidence += 0.5
                image = drawHighlightOverlay(
                    for: image,
                    topLeft: rectangle.topLeft,
                    topRight: rectangle.topRight,
                    bottomLeft: rectangle.bottomLeft,
                    bottomRight: rectangle.bottomRight
                )
            } else {
                imageDetectionConfidence = 0.0
            }
        }
        
        if let context = context, let coreImageContext = coreImageContext {
            coreImageContext.draw(image, in: bounds, from: image.extent)
            context.presentRenderbuffer(Int(GL_RENDERBUFFER))
            glkView?.setNeedsDisplay()
        }
    }
}

