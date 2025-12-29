#import "DocumentScannerView.h"
#import "IPDFCameraViewController.h"

@implementation DocumentScannerView

- (instancetype)init {
    self = [super init];
    if (self) {
        [self setEnableBorderDetection:YES];
        [self setDelegate: self];
    }

    return self;
}


- (void) didDetectRectangle:(CIRectangleFeature *)rectangle withType:(IPDFRectangeType)type {
    switch (type) {
        case IPDFRectangeTypeGood:
            self.stableCounter ++;
            break;
        default:
            self.stableCounter = 0;
            break;
    }
    if (self.onRectangleDetect) {
        self.onRectangleDetect(@{@"stableCounter": @(self.stableCounter), @"lastDetectionType": @(type)});
    }
}

- (void) capture {
    [self captureImageWithCompletionHander:^(UIImage *croppedImage, UIImage *initialImage, CIRectangleFeature *rectangleFeature) {
      if (self.onPictureTaken) {
            NSData *croppedImageData = UIImageJPEGRepresentation(croppedImage, self.quality);

            if (initialImage.imageOrientation != UIImageOrientationUp) {
                UIGraphicsBeginImageContextWithOptions(initialImage.size, false, initialImage.scale);
                [initialImage drawInRect:CGRectMake(0, 0, initialImage.size.width
                                                    , initialImage.size.height)];
                initialImage = UIGraphicsGetImageFromCurrentImageContext();
                UIGraphicsEndImageContext();
            }
            NSData *initialImageData = UIImageJPEGRepresentation(initialImage, self.quality);

            /*
             RectangleCoordinates expects a rectanle viewed from portrait,
             while rectangleFeature returns a rectangle viewed from landscape, which explains the nonsense of the mapping below.
             Sorry about that.
             */
            NSDictionary *rectangleCoordinates = rectangleFeature ? @{
                                     @"topLeft": @{ @"y": @(rectangleFeature.bottomLeft.x + 30), @"x": @(rectangleFeature.bottomLeft.y)},
                                     @"topRight": @{ @"y": @(rectangleFeature.topLeft.x + 30), @"x": @(rectangleFeature.topLeft.y)},
                                     @"bottomLeft": @{ @"y": @(rectangleFeature.bottomRight.x), @"x": @(rectangleFeature.bottomRight.y)},
                                     @"bottomRight": @{ @"y": @(rectangleFeature.topRight.x), @"x": @(rectangleFeature.topRight.y)},
                                     } : [NSNull null];
            if (self.useBase64) {
              self.onPictureTaken(@{
                                    @"croppedImage": [croppedImageData base64EncodedStringWithOptions:NSDataBase64Encoding64CharacterLineLength],
                                    @"initialImage": [initialImageData base64EncodedStringWithOptions:NSDataBase64Encoding64CharacterLineLength],
                                    @"rectangleCoordinates": rectangleCoordinates });
            }
            else {
                NSString *dir = NSTemporaryDirectory();
                if (self.saveInAppDocument) {
                    dir = [NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES) firstObject];
                }
               NSString *croppedFilePath = [dir stringByAppendingPathComponent:[NSString stringWithFormat:@"cropped_img_%i.jpeg",(int)[NSDate date].timeIntervalSince1970]];
               NSString *initialFilePath = [dir stringByAppendingPathComponent:[NSString stringWithFormat:@"initial_img_%i.jpeg",(int)[NSDate date].timeIntervalSince1970]];

              [croppedImageData writeToFile:croppedFilePath atomically:YES];
              [initialImageData writeToFile:initialFilePath atomically:YES];

               self.onPictureTaken(@{
                                     @"croppedImage": croppedFilePath,
                                     @"initialImage": initialFilePath,
                                     @"rectangleCoordinates": rectangleCoordinates });
            }
        }

        if (!self.captureMultiple) {
          [self stop];
        }
    }];

}

- (NSString *)reapplyPerspectiveCropToImage:(NSString *)base64Image 
                            withCoordinates:(NSDictionary *)coordinates 
                                    quality:(float)quality {
    @try {
        if (!base64Image || base64Image.length == 0) {
            NSLog(@"Error: base64Image is nil or empty");
            return nil;
        }
        
        if (!coordinates) {
            NSLog(@"Error: coordinates is nil");
            return nil;
        }
        
        // Clean base64 string - remove whitespace and newlines
        // The base64 might have been encoded with NSDataBase64Encoding64CharacterLineLength
        NSString *cleanedBase64 = [base64Image stringByReplacingOccurrencesOfString:@"\n" withString:@""];
        cleanedBase64 = [cleanedBase64 stringByReplacingOccurrencesOfString:@"\r" withString:@""];
        cleanedBase64 = [cleanedBase64 stringByReplacingOccurrencesOfString:@" " withString:@""];
        
        // Decode base64 to UIImage
        NSData *imageData = [[NSData alloc] initWithBase64EncodedString:cleanedBase64 options:NSDataBase64DecodingIgnoreUnknownCharacters];
        if (!imageData || imageData.length == 0) {
            NSLog(@"Error: Failed to decode base64 image data. Base64 length: %lu", (unsigned long)cleanedBase64.length);
            return nil;
        }
        
        UIImage *originalImage = [UIImage imageWithData:imageData];
        if (!originalImage) {
            NSLog(@"Error: Failed to create UIImage from data");
            return nil;
        }
        
        // Fix orientation if needed
        if (originalImage.imageOrientation != UIImageOrientationUp) {
            UIGraphicsBeginImageContextWithOptions(originalImage.size, false, originalImage.scale);
            [originalImage drawInRect:CGRectMake(0, 0, originalImage.size.width, originalImage.size.height)];
            originalImage = UIGraphicsGetImageFromCurrentImageContext();
            UIGraphicsEndImageContext();
        }
        
        CIImage *ciImage = [CIImage imageWithCGImage:originalImage.CGImage];
        if (!ciImage) {
            NSLog(@"Error: Failed to create CIImage from UIImage");
            return nil;
        }
        
        NSLog(@"Original image size: %.2f x %.2f, CIImage extent: %@", 
              originalImage.size.width, originalImage.size.height,
              NSStringFromCGRect(ciImage.extent));
        
        // Extract coordinates from dictionary
        // Stored format (portrait view with y/x swapped):
        // topLeft: {y: bottomLeft.x + 30, x: bottomLeft.y}
        // topRight: {y: topLeft.x + 30, x: topLeft.y}
        // bottomLeft: {y: bottomRight.x, x: bottomRight.y}
        // bottomRight: {y: topRight.x, x: topRight.y}
        
        id topLeftObj = coordinates[@"topLeft"];
        id topRightObj = coordinates[@"topRight"];
        id bottomLeftObj = coordinates[@"bottomLeft"];
        id bottomRightObj = coordinates[@"bottomRight"];
        
        // Check for NSNull (React Native uses NSNull instead of nil)
        if ([topLeftObj isKindOfClass:[NSNull class]] || 
            [topRightObj isKindOfClass:[NSNull class]] || 
            [bottomLeftObj isKindOfClass:[NSNull class]] || 
            [bottomRightObj isKindOfClass:[NSNull class]]) {
            NSLog(@"Error: One or more coordinates is NSNull");
            return nil;
        }
        
        NSDictionary *topLeftDict = (NSDictionary *)topLeftObj;
        NSDictionary *topRightDict = (NSDictionary *)topRightObj;
        NSDictionary *bottomLeftDict = (NSDictionary *)bottomLeftObj;
        NSDictionary *bottomRightDict = (NSDictionary *)bottomRightObj;
        
        if (!topLeftDict || !topRightDict || !bottomLeftDict || !bottomRightDict) {
            NSLog(@"Error: Missing coordinate dictionaries. topLeft: %@, topRight: %@, bottomLeft: %@, bottomRight: %@", 
                  topLeftDict ? @"exists" : @"nil",
                  topRightDict ? @"exists" : @"nil",
                  bottomLeftDict ? @"exists" : @"nil",
                  bottomRightDict ? @"exists" : @"nil");
            return nil;
        }
        
        // Extract stored values
        double storedTopLeftY = [topLeftDict[@"y"] doubleValue];
        double storedTopLeftX = [topLeftDict[@"x"] doubleValue];
        double storedTopRightY = [topRightDict[@"y"] doubleValue];
        double storedTopRightX = [topRightDict[@"x"] doubleValue];
        double storedBottomLeftY = [bottomLeftDict[@"y"] doubleValue];
        double storedBottomLeftX = [bottomLeftDict[@"x"] doubleValue];
        double storedBottomRightY = [bottomRightDict[@"y"] doubleValue];
        double storedBottomRightX = [bottomRightDict[@"x"] doubleValue];
        
        NSLog(@"Extracted coordinates - topLeft: (%.2f, %.2f), topRight: (%.2f, %.2f), bottomLeft: (%.2f, %.2f), bottomRight: (%.2f, %.2f)",
              storedTopLeftX, storedTopLeftY,
              storedTopRightX, storedTopRightY,
              storedBottomLeftX, storedBottomLeftY,
              storedBottomRightX, storedBottomRightY);
        
        // Reverse the transformation to get back to landscape CIRectangleFeature format:
        // From stored topLeft {y, x} where y = bottomLeft.x + 30, x = bottomLeft.y
        // We get: bottomLeft.x = y - 30, bottomLeft.y = x
        // From stored topRight {y, x} where y = topLeft.x + 30, x = topLeft.y
        // We get: topLeft.x = y - 30, topLeft.y = x
        // From stored bottomLeft {y, x} where y = bottomRight.x, x = bottomRight.y
        // We get: bottomRight.x = y, bottomRight.y = x
        // From stored bottomRight {y, x} where y = topRight.x, x = topRight.y
        // We get: topRight.x = y, topRight.y = x
        
        // Reconstruct landscape CIRectangleFeature points
        CGPoint landscapeTopLeft = CGPointMake(storedTopRightY - 30, storedTopRightX);
        CGPoint landscapeTopRight = CGPointMake(storedBottomRightY, storedBottomRightX);
        CGPoint landscapeBottomLeft = CGPointMake(storedTopLeftY - 30, storedTopLeftX);
        CGPoint landscapeBottomRight = CGPointMake(storedBottomLeftY, storedBottomLeftX);
        
        // Apply perspective correction using the same method as correctPerspectiveForImage
        // This adds +30 offset to left points
        NSMutableDictionary *rectangleCoordinates = [NSMutableDictionary new];
        CGPoint newLeft = CGPointMake(landscapeTopLeft.x + 30, landscapeTopLeft.y);
        CGPoint newRight = CGPointMake(landscapeTopRight.x, landscapeTopRight.y);
        CGPoint newBottomLeft = CGPointMake(landscapeBottomLeft.x + 30, landscapeBottomLeft.y);
        CGPoint newBottomRight = CGPointMake(landscapeBottomRight.x, landscapeBottomRight.y);
        
        rectangleCoordinates[@"inputTopLeft"] = [CIVector vectorWithCGPoint:newLeft];
        rectangleCoordinates[@"inputTopRight"] = [CIVector vectorWithCGPoint:newRight];
        rectangleCoordinates[@"inputBottomLeft"] = [CIVector vectorWithCGPoint:newBottomLeft];
        rectangleCoordinates[@"inputBottomRight"] = [CIVector vectorWithCGPoint:newBottomRight];
        
        NSLog(@"Applying perspective correction with points - topLeft: %@, topRight: %@, bottomLeft: %@, bottomRight: %@",
              NSStringFromCGPoint(newLeft),
              NSStringFromCGPoint(newRight),
              NSStringFromCGPoint(newBottomLeft),
              NSStringFromCGPoint(newBottomRight));
        
        CIImage *correctedImage = [ciImage imageByApplyingFilter:@"CIPerspectiveCorrection" withInputParameters:rectangleCoordinates];
        
        if (!correctedImage) {
            NSLog(@"Error: Failed to apply perspective correction filter");
            return nil;
        }
        
        NSLog(@"Perspective correction applied successfully. Corrected image extent: %@", 
              NSStringFromCGRect(correctedImage.extent));
        
        // Convert CIImage to UIImage
        CIContext *context = [CIContext contextWithOptions:nil];
        CGImageRef cgImage = [context createCGImage:correctedImage fromRect:correctedImage.extent];
        if (!cgImage) {
            NSLog(@"Error: Failed to create CGImage from corrected CIImage");
            return nil;
        }
        
        UIImage *finalImage = [UIImage imageWithCGImage:cgImage];
        CGImageRelease(cgImage);
        
        if (!finalImage) {
            NSLog(@"Error: Failed to create UIImage from CGImage");
            return nil;
        }
        
        // Convert to base64
        NSData *finalImageData = UIImageJPEGRepresentation(finalImage, quality);
        if (!finalImageData || finalImageData.length == 0) {
            NSLog(@"Error: Failed to convert UIImage to JPEG data");
            return nil;
        }
        
        NSString *base64Result = [finalImageData base64EncodedStringWithOptions:NSDataBase64Encoding64CharacterLineLength];
        
        if (!base64Result || base64Result.length == 0) {
            NSLog(@"Error: Failed to encode image data to base64");
            return nil;
        }
        
        return base64Result;
    }
    @catch (NSException *exception) {
        NSLog(@"Exception in reapplyPerspectiveCropToImage: %@", exception.reason);
        NSLog(@"Exception stack: %@", exception.callStackSymbols);
        return nil;
    }
}

@end
