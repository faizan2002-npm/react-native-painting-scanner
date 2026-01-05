#import <React/RCTBridgeModule.h>
#import <ReactCommon/RCTTurboModule.h>

#import "RCTRequired.h"
#import "RCTTypeSafety.h"

NS_ASSUME_NONNULL_BEGIN

@protocol NativePaintingScannerSpec <RCTBridgeModule, RCTTurboModule>

- (void)scanPainting:(NSString *)imageUri
            resolve:(RCTPromiseResolveBlock)resolve
             reject:(RCTPromiseRejectBlock)reject;

- (NSString *)getScannerVersion;

- (BOOL)isAvailable;

@end

NS_ASSUME_NONNULL_END

