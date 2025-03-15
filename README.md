# mcp-image-compression

## 项目简介

mcp-image-compression 是一个高效的图片压缩微服务，基于 MCP (Micro Content Processing) 架构设计。该服务专注于提供快速、高质量的图片压缩功能，帮助开发者优化网站和应用的图片资源，提升加载速度和用户体验。

## 主要特性

- **多格式支持**：支持 JPEG, PNG, WebP, AVIF 等主流图片格式的压缩
- **智能压缩**：根据图片内容自动选择最佳压缩参数
- **批量处理**：支持多图片并行压缩，提高处理效率
- **质量控制**：可自定义压缩质量，平衡文件大小与视觉效果
- **API 接口**：提供简洁易用的 RESTful API
- **实时处理**：支持实时图片压缩请求
- **云原生**：易于部署在各种云环境中

## 快速开始

### 安装依赖

```bash
npm install

### 配置服务
编辑 config.js 文件，设置服务端口、压缩参数等配置项。

### 启动服务
```bash
npm start
 ```

服务默认运行在 <http://localhost:3000>

## API 使用

### 压缩单张图片

```plaintext
POST /api/compress
 ```

请求体 (multipart/form-data):

- image : 图片文件
- quality : 压缩质量 (1-100，可选，默认 80)
- format : 输出格式 (可选，默认保持原格式)

### 批量压缩

```plaintext
POST /api/compress/batch
 ```

请求体 (multipart/form-data):

- images[] : 多个图片文件
- quality : 压缩质量 (可选)
- format : 输出格式 (可选)