import axios from 'axios';
import fs from 'fs';
import { readFile } from "fs/promises";
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import { ImageContent } from '@modelcontextprotocol/sdk/types.js';
import { fileTypeFromBuffer } from "file-type";


// 定义类型
type ImageSource = string;

export async function compressAndStoreImage(
  imageUrl: ImageSource,
  outputDir: string,
  quality = 80,
  format = 'jpg',
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

    await sharp(inputBuffer)
      // @ts-ignore
      .toFormat(format ? format : originalExt?.replace('.', ''), {
        quality,
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

/**
 * Generates an image content object from a URL, file path, or buffer.
 */
export const imageContent = async (
  input: { url: string } | { path: string } | { buffer: Buffer },
): Promise<ImageContent> => {
  let rawData: Buffer;

  if ("url" in input) {
    const response = await fetch(input.url);

    if (!response.ok) {
      throw new Error(`Failed to fetch image from URL: ${response.statusText}`);
    }

    rawData = Buffer.from(await response.arrayBuffer());
  } else if ("path" in input) {
    rawData = await readFile(input.path);
  } else if ("buffer" in input) {
    rawData = input.buffer;
  } else {
    throw new Error(
      "Invalid input: Provide a valid 'url', 'path', or 'buffer'",
    );
  }

  const mimeType = await fileTypeFromBuffer(rawData);

  const base64Data = rawData.toString("base64");

  return {
    type: "image",
    data: base64Data,
    mimeType: mimeType?.mime ?? "image/png",
  } as const;
};


