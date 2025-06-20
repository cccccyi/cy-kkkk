// server/middleware/website-images.ts
export default defineEventHandler(async (event) => {
    const { req, res } = event
    const url = getRequestURL(event)
    
    if (!url.pathname.startsWith('/website_images/')) return
  
    const targetUrl = `https://hashnews.pro${url.pathname}`
  
    const response = await fetch(targetUrl)
  
    const contentType = response.headers.get('content-type') || 'image/png'
    const buffer = await response.arrayBuffer()
  
    setHeader(event, 'Content-Type', contentType)
    setResponseStatus(event, response.status)
    return Buffer.from(buffer)
  })
  