const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

// 配置参数
const config = {
  baseImage: 'base.png',      // 基础图（无色）
  colorImage: 'color.png',    // 着色图（有色）
  outputDir: 'frames',        // 输出帧的目录
  frames: 90,                 // 总帧数
  outputFormat: 'png',        // 输出格式
  angle: 15,                  // 水流斜度（度）
  maxSize: null,              // 最大输出尺寸（像素，null表示不限制）
  maxPercent: 80,            // 原图缩放百分比（1-100）
};

async function main() {
  try {
    // 确保输出目录存在
    await fs.mkdir(config.outputDir, { recursive: true });
    
    // 读取两张图片
    const baseImage = sharp(path.join(__dirname, config.baseImage));
    const colorImage = sharp(path.join(__dirname, config.colorImage));
    
    // 获取图片元数据
    const [baseMetadata, colorMetadata] = await Promise.all([
      baseImage.metadata(),
      colorImage.metadata()
    ]);
    
    // 验证图片尺寸匹配
    if (baseMetadata.width !== colorMetadata.width || baseMetadata.height !== colorMetadata.height) {
      throw new Error('基础图和着色图尺寸不匹配');
    }
    
    // 原始图片尺寸
    const originalWidth = baseMetadata.width;
    const originalHeight = baseMetadata.height;
    
    // 计算最终输出尺寸（考虑最大尺寸限制）
    let targetWidth = originalWidth;
    let targetHeight = originalHeight;
    
    if (config.maxSize && Math.max(targetWidth, targetHeight) > config.maxSize) {
      const ratio = config.maxSize / Math.max(targetWidth, targetHeight);
      targetWidth = Math.round(targetWidth * ratio);
      targetHeight = Math.round(targetHeight * ratio);
      console.log(`调整输出尺寸: ${originalWidth}x${originalHeight}px -> ${targetWidth}x${targetHeight}px`);
    } else {
      console.log(`原始尺寸: ${targetWidth}x${targetHeight}px`);
    }
    
    // 计算原图缩放后的尺寸（根据maxPercent）
    const scaledPercent = config.maxPercent / 100;
    const scaledWidth = Math.round(originalWidth * scaledPercent);
    const scaledHeight = Math.round(originalHeight * scaledPercent);
    
    // 计算需要添加的边距
    const paddingX = Math.round((targetWidth - scaledWidth) / 2);
    const paddingY = Math.round((targetHeight - scaledHeight) / 2);
    
    console.log(`原图缩放: ${config.maxPercent}% (${scaledWidth}x${scaledHeight}px)`);
    console.log(`透明边距: 左右各${paddingX}px, 上下各${paddingY}px`);
    console.log(`生成参数: 斜度${config.angle}°, 共${config.frames}帧`);
    
    // 调整图片大小并添加透明边距
    const [baseResized, colorResized] = await Promise.all([
      baseImage
        .resize(scaledWidth, scaledHeight)
        .extend({
          top: paddingY,
          bottom: paddingY,
          left: paddingX,
          right: paddingX,
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .raw()
        .toBuffer(),
      
      colorImage
        .resize(scaledWidth, scaledHeight)
        .extend({
          top: paddingY,
          bottom: paddingY,
          left: paddingX,
          right: paddingX,
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .raw()
        .toBuffer()
    ]);
    
    // 计算斜度相关参数
    const angleRad = (config.angle * Math.PI) / 180;
    const slopeOffset = Math.tan(angleRad) * targetHeight;
    
    // 生成帧
    for (let frame = 0; frame < config.frames; frame++) {
      // 创建当前帧的像素缓冲区副本
      const frameBuffer = Buffer.from(baseResized);
      
      // 计算当前帧应显示的颜色进度
      const progress = (frame + 1) / config.frames;
      
      // 逐行处理（带斜度）
      for (let y = 0; y < targetHeight; y++) {
        // 计算当前行的水平偏移（斜度效果）
        const xOffset = Math.round((y / targetHeight) * slopeOffset * progress);
        
        // 计算颜色截止点（考虑斜度）
        const colorCutoff = Math.round(progress * targetWidth) + xOffset;
        
        // 逐像素处理当前行
        for (let x = 0; x < targetWidth; x++) {
          // 只有当x小于截止点时才应用颜色
          if (x < colorCutoff) {
            const pixelIndex = (y * targetWidth + x) * 4;
            
            // 确保索引在有效范围内
            if (pixelIndex < frameBuffer.length) {
              // 复制着色图的像素到当前位置
              frameBuffer[pixelIndex] = colorResized[pixelIndex];         // R
              frameBuffer[pixelIndex + 1] = colorResized[pixelIndex + 1]; // G
              frameBuffer[pixelIndex + 2] = colorResized[pixelIndex + 2]; // B
              frameBuffer[pixelIndex + 3] = colorResized[pixelIndex + 3]; // A
            }
          }
        }
      }
      
      // 保存当前帧
      const framePath = path.join(
        config.outputDir, 
        `frame-${frame.toString().padStart(3, '0')}.${config.outputFormat}`
      );
      
      await sharp(frameBuffer, {
        raw: {
          width: targetWidth,
          height: targetHeight,
          channels: 4
        }
      })
      .toFormat(config.outputFormat)
      .toFile(framePath);
      
      console.log(`已生成帧 ${frame+1}/${config.frames}: ${Math.round(progress*100)}%着色`);
    }
    
    console.log(`动画帧生成完成! 共生成 ${config.frames} 帧，保存在 "${config.outputDir}" 目录中。`);
    
  } catch (error) {
    console.error('处理过程中出错:', error.message);
    process.exit(1);
  }
}

// 执行主函数
main();    