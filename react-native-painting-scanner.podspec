require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "react-native-painting-scanner"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.description  = <<-DESC
                  A Turbo Module for React Native painting scanner
                   DESC
  s.homepage     = "https://github.com/yourusername/react-native-painting-scanner"
  s.license      = "MIT"
  s.author       = { "author" => "" }
  s.platforms    = { :ios => "13.4" }
  s.source       = { :git => "https://github.com/yourusername/react-native-painting-scanner.git", :tag => "#{s.version}" }

  s.source_files = "ios/**/*.{h,m,mm,swift}"
  s.requires_arc = true

  s.dependency "React-Core"
  s.dependency "React-RCTFabric"
  s.dependency "React-Codegen"
  s.dependency "RCTRequired"
  s.dependency "RCTTypeSafety"
  s.dependency "ReactCommon/turbomodule/core"

  # Enable codegen for this library
  install_modules_dependencies(s)

  if ENV['RCT_NEW_ARCH_ENABLED'] == '1' then
    s.compiler_flags = "-DRCT_NEW_ARCH_ENABLED=1"
    s.pod_target_xcconfig = {
      "HEADER_SEARCH_PATHS" => "\"$(PODS_ROOT)/boost\"",
      "CLANG_CXX_LANGUAGE_STANDARD" => "c++17"
    }
  end
end

