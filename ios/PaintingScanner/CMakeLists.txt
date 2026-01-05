cmake_minimum_required(VERSION 3.13)
project(PaintingScanner)

# Find required packages
find_package(ReactNative REQUIRED)

# Add Swift files
set(SWIFT_SOURCES
    PaintingScanner/IPDFCameraViewController.swift
    PaintingScanner/HybridPaintingScanner.swift
)

# Add generated headers (will be created by nitrogen)
set(GENERATED_HEADERS
    ${CMAKE_CURRENT_BINARY_DIR}/generated/HybridPaintingScannerSpec.h
)

# Include directories
include_directories(
    ${CMAKE_CURRENT_SOURCE_DIR}
    ${CMAKE_CURRENT_BINARY_DIR}/generated
)

# Link to Nitro modules
target_link_libraries(${PROJECT_NAME} PRIVATE
    react-native-nitro-modules
)

