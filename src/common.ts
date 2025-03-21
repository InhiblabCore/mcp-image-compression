import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

// 定义类型
type ImageSource = string;

export async function compressAndStoreImage(
  imageUrl: ImageSource,
  outputDir: string,
  quality = 80,
  format = null,
): Promise<string> {
  try {
    // 校验输出目录
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    let inputBuffer: Buffer;

    // 判断是否是网络地址
    if (/^https?:\/\//.test(imageUrl)) {
      // 下载网络图片
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 10000
      });
      inputBuffer = Buffer.from(response.data, 'binary');
    } else {
      // 读取本地图片
      if (!fs.existsSync(imageUrl)) {
        throw new Error(`Local file not found: ${imageUrl}`);
      }
      inputBuffer = await fs.promises.readFile(imageUrl);
    }

    // 读取文件原始名称
    const originalFilename = path.basename(imageUrl);
    const originalExt = path.parse(originalFilename).ext;

    // 生成唯一文件名
    const outputFilename = format ? `${uuidv4()}.${format}` : `${uuidv4()}${originalExt}`;
    const outputPath = path.join(outputDir, outputFilename);

    // 使用 Sharp 进行图片处理
    await sharp(inputBuffer)
      .jpeg({
        quality,
        mozjpeg: true
      })
      .toFile(outputPath);

    return outputPath;
  } catch (error) {
    throw new Error(`Image processing failed`);
  }
}

export function isImageSource(str: string): boolean {
  // 匹配常规图片地址
  if (/\.(jpe?g|png|gif|webp|bmp|svg|avif)(\?[^#]*)?(#[^\s]*)?$/i.test(str)) {
    return true;
  }

  // 匹配Base64数据URI
  if (/^data:image\/(jpe?g|png|gif|webp|bmp|svg\+xml|avif);base64,/i.test(str)) {
    return true;
  }

  // 可选：匹配无扩展名但包含图片路由的情况（如CDN地址）
  // 示例：/image/12345?format=jpg
  if (/\/(image|img|photo|pic)s?\/[^/]+(\?.*?(format|type)=(jpe?g|png|gif|webp|bmp|svg|avif))/i.test(str)) {
    return true;
  }

  return false;
}

