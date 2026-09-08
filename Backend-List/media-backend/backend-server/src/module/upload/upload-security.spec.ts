import { BadRequestException, PayloadTooLargeException } from '@nestjs/common';
import {
  createSafeImageFileName,
  detectAllowedImage,
  getStaticImageMimeType,
  MAX_IMAGE_UPLOAD_BYTES,
  validateImageBuffer,
  validateUploadId,
} from './upload-security';

describe('upload security policy', () => {
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
    'base64',
  );

  it('accepts a structurally delimited raster image from its bytes', () => {
    expect(detectAllowedImage(png)).toEqual({ extension: 'png', mimeType: 'image/png' });
  });

  it.each(['<html><script>alert(1)</script></html>', '<svg onload="alert(1)"/>', '<?xml version="1.0"?>', 'alert(1)'])(
    'rejects active content regardless of a claimed MIME type: %s',
    (content) => {
      expect(() => validateImageBuffer(Buffer.from(content))).toThrow(BadRequestException);
    },
  );

  it('rejects a fake JPEG prefix without a valid image terminator', () => {
    const prefixedHtml = Buffer.concat([Buffer.from('ffd8ff', 'hex'), Buffer.from('<html><script>alert(1)</script></html>')]);
    expect(() => validateImageBuffer(prefixedHtml)).toThrow(BadRequestException);
  });

  it('rejects delimiter-only image and JavaScript polyglots', () => {
    const gifScript = Buffer.from('GIF89a=1;alert(1);//;');
    const jpegWrappedHtml = Buffer.concat([
      Buffer.from('ffd8ff', 'hex'),
      Buffer.from('<html><script>alert(1)</script></html>'),
      Buffer.from('ffd9', 'hex'),
    ]);
    expect(() => validateImageBuffer(gifScript)).toThrow(BadRequestException);
    expect(() => validateImageBuffer(jpegWrappedHtml)).toThrow(BadRequestException);
  });

  it('rejects bytes above the hard upload limit', () => {
    expect(() => validateImageBuffer(Buffer.alloc(MAX_IMAGE_UPLOAD_BYTES + 1))).toThrow(PayloadTooLargeException);
  });

  it('uses a server-generated flat filename with the detected extension', () => {
    expect(createSafeImageFileName({ extension: 'png', mimeType: 'image/png' })).toMatch(/^[a-f0-9]{32}\.png$/);
  });

  it('rejects traversal in upload task identifiers', () => {
    expect(() => validateUploadId('../outside')).toThrow(BadRequestException);
  });

  it('only marks raster extensions as safe for inline static responses', () => {
    expect(getStaticImageMimeType('/tmp/image.webp')).toBe('image/webp');
    expect(getStaticImageMimeType('/tmp/payload.gif')).toBeNull();
    expect(getStaticImageMimeType('/tmp/payload.svg')).toBeNull();
    expect(getStaticImageMimeType('/tmp/payload.html')).toBeNull();
  });
});
