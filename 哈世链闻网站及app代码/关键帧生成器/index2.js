const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

// 配置项
const config = {
  baseImage: 'base.png',
  colorImage: 'color.png',
  outputDir: 'frames',
  frames: 90,
  outputFormat: 'png',
  tiltMaxOffset: 100,    // 倾斜效果：右边下沉像素
  opacity: 0.8,         // 着色透明度 (0~1)
  scaleRatio: 0.8,      // 缩小图像比例 (<1 缩小，居中加透明边)
  maxSize: 500          // 输出最大尺寸，宽或高最大像素值
};

async function loadAndPrepareImage(filePath, width, height) {
  const scaledWidth = Math.round(width * config.scaleRatio);
  const scaledHeight = Math.round(height * config.scaleRatio);

  return sharp(filePath)
    .resize(scaledWidth, scaledHeight, { fit: 'contain' })
    .extend({
      top: Math.floor((height - scaledHeight) / 2),
      bottom: Math.ceil((height - scaledHeight) / 2),
      left: Math.floor((width - scaledWidth) / 2),
      right: Math.ceil((width - scaledWidth) / 2),
      background: { r: 0, g: 0, b: 0, alpha: 0 } // 透明边
    })
    .raw()
    .toBuffer();
}

async function main() {
  try {
    await fs.mkdir(config.outputDir, { recursive: true });

    // 获取元数据
    const [baseMeta, colorMeta] = await Promise.all([
      sharp(config.baseImage).metadata(),
      sharp(config.colorImage).metadata()
    ]);

    if (baseMeta.width !== colorMeta.width || baseMeta.height !== colorMeta.height) {
      throw new Error('基础图和着色图尺寸不一致');
    }

    // 处理最大尺寸
    let width = baseMeta.width;
    let height = baseMeta.height;
    if (config.maxSize > 0 && (width > config.maxSize || height > config.maxSize)) {
      const ratio = Math.min(config.maxSize / width, config.maxSize / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }

    console.log(`输出图像尺寸: ${width}x${height}`);

    // 准备图像数据（缩放、填充）
    const [baseBuffer, colorBuffer] = await Promise.all([
      loadAndPrepareImage(config.baseImage, width, height),
      loadAndPrepareImage(config.colorImage, width, height)
    ]);

    const rowsPerFrame = height / config.frames;

    for (let frame = 0; frame < config.frames; frame++) {
      const frameBuffer = Buffer.from(baseBuffer);
      const baseY = Math.round((frame + 1) * rowsPerFrame);

      for (let x = 0; x < width; x++) {
        const offsetRatio = x / width;
        const tiltOffset = Math.round(offsetRatio * config.tiltMaxOffset);
        const colMaxY = Math.max(0, Math.min(height, baseY - tiltOffset));

        for (let y = 0; y < colMaxY; y++) {
          const idx = (y * width + x) * 4;

          // 混合 RGB，不动 alpha（保留透明背景）
          for (let c = 0; c < 3; c++) {
            frameBuffer[idx + c] = Math.round(
              config.opacity * colorBuffer[idx + c] + (1 - config.opacity) * baseBuffer[idx + c]
            );
          }

          // 保留 base 图原始透明度（不会黑底）
          frameBuffer[idx + 3] = baseBuffer[idx + 3];
        }
      }

      const framePath = path.join(
        config.outputDir,
        `frame-${frame.toString().padStart(3, '0')}.${config.outputFormat}`
      );

      await sharp(frameBuffer, {
        raw: { width, height, channels: 4 }
      })
      .toFormat(config.outputFormat)
      .toFile(framePath);

      console.log(`✅ 已生成帧 ${frame + 1}/${config.frames}`);
    }

    console.log(`🎉 动画帧生成完成，共 ${config.frames} 帧，保存于 "${config.outputDir}"`);

  } catch (err) {
    console.error('❌ 错误:', err.message);
    process.exit(1);
  }
}

main();
