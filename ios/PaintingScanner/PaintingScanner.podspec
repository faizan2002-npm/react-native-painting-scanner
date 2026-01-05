require "json"

package = JSON.parse(File.read(File.join(__dir__, "..", "..", "package.json")))

Pod::Spec.new do |s|
  s.name         = "PaintingScanner"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.description  = <<-DESC
                  A high-performance painting/document scanner module built with Nitro
                   DESC
  s.homepage     = "https://github.com/yourusername/react-native-painting-scanner"
  s.license      = "MIT"
  s.author       = { "author" => "author@example.com" }
  s.platforms    = { :ios => "13.0" }
  s.source       = { :git => "https://github.com/yourusername/react-native-painting-scanner.git", :tag => "#{s.version}" }

  s.source_files = "PaintingScanner/**/*.{swift,h,m,mm}"
  s.requires_arc = true

  s.dependency "React-Core"
  s.dependency "react-native-nitro-modules"

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    "DEFINES_MODULE" => "YES",
    "SWIFT_COMPILATION_MODE" => "wholemodule"
  }

  # Frameworks required
  s.frameworks = "AVFoundation", "CoreImage", "CoreVideo", "GLKit", "UIKit"
end

