import DOMPurify from 'dompurify'

const sanitizeHtml = (value: unknown): string =>
  DOMPurify.sanitize(String(value ?? ''), {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's',
      'ul', 'ol', 'li', 'blockquote', 'figure', 'figcaption',
      'img', 'span', 'div'
    ],
    ALLOWED_ATTR: ['src', 'alt', 'title', 'class', 'width', 'height', 'loading'],
    ALLOW_DATA_ATTR: false
  })

export default defineNuxtPlugin(() => ({
  provide: {
    sanitizeHtml
  }
}))
