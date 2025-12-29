
#import "RNPdfScannerManager.h"
#import "DocumentScannerView.h"

@interface RNPdfScannerManager()
@property (strong, nonatomic) DocumentScannerView *scannerView;
@end

@implementation RNPdfScannerManager

- (dispatch_queue_t)methodQueue
{
    return dispatch_get_main_queue();
}

RCT_EXPORT_MODULE()

RCT_EXPORT_VIEW_PROPERTY(onPictureTaken, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onRectangleDetect, RCTBubblingEventBlock)


RCT_EXPORT_VIEW_PROPERTY(overlayColor, UIColor)
RCT_EXPORT_VIEW_PROPERTY(enableTorch, BOOL)
RCT_EXPORT_VIEW_PROPERTY(useFrontCam, BOOL)
RCT_EXPORT_VIEW_PROPERTY(useBase64, BOOL)
RCT_EXPORT_VIEW_PROPERTY(saveInAppDocument, BOOL)
RCT_EXPORT_VIEW_PROPERTY(captureMultiple, BOOL)
RCT_EXPORT_VIEW_PROPERTY(detectionCountBeforeCapture, NSInteger)
RCT_EXPORT_VIEW_PROPERTY(detectionRefreshRateInMS, NSInteger)
RCT_EXPORT_VIEW_PROPERTY(saturation, float)
RCT_EXPORT_VIEW_PROPERTY(quality, float)
RCT_EXPORT_VIEW_PROPERTY(brightness, float)
RCT_EXPORT_VIEW_PROPERTY(contrast, float)

RCT_EXPORT_METHOD(capture) {

    [_scannerView capture];
}

RCT_EXPORT_METHOD(reapplyPerspectiveCrop:(NSString *)base64Image
                  coordinates:(NSDictionary *)coordinates
                  quality:(float)quality
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    // Process image on background queue to avoid blocking UI
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        // Create a temporary scanner view instance for processing
        // This doesn't need to be the same instance as the view
        DocumentScannerView *tempScannerView = [[DocumentScannerView alloc] init];
        NSString *result = [tempScannerView reapplyPerspectiveCropToImage:base64Image 
                                                       withCoordinates:coordinates 
                                                               quality:quality];
        // Return result on main queue
        dispatch_async(dispatch_get_main_queue(), ^{
            if (result) {
                resolve(result);
            } else {
                reject(@"CROP_ERROR", @"Failed to reapply perspective crop", nil);
            }
        });
    });
}

- (UIView*) view {
    _scannerView = [[DocumentScannerView alloc] init];
    return _scannerView;
}

@end
