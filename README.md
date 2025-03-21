# mcp-image-compression

## Project Overview

mcp-image-compression is a high-performance image compression microservice based on MCP (Micro Content Processing) architecture. This service focuses on providing fast and high-quality image compression capabilities to help developers optimize image resources for websites and applications, improving loading speed and user experience.

## Features

- **Multi-format support**: Compress mainstream image formats including JPEG, PNG, WebP, AVIF
- **Offline Usage**: No need to connect to the internet to use
- **Smart compression**: Automatically select optimal compression parameters based on image content
- **Batch processing**: Support parallel compression of multiple images for improved efficiency
- **Quality control**: Customizable compression quality to balance file size and visual quality

## TOOLS

1. `image_compression`
   - Image compression
   - Inputs:
     - `urls` (strings): URLs of images to compress
     - `quality` (int): Quality of compression (0-100)
     - `format` (string): Format of compressed image (e.g. "jpeg", "png", "webp", "avif")
   - Returns: Compressed images url

## License

This MCP server is licensed under the MIT License. This means you are free to use, modify, and distribute the software, subject to the terms and conditions of the MIT License. For more details, please see the LICENSE file in the project repository.

