const TOKEN_PATTERN = /^[\x21-\x7e]{32,512}$/

function requireCrawlerApiToken() {
  const token = process.env.CRAWLER_API_TOKEN
  if (typeof token !== 'string' || !TOKEN_PATTERN.test(token)) {
    throw new Error('CRAWLER_API_TOKEN must be a 32-512 character printable token without spaces')
  }
  return token
}

function buildCrawlerUrl(operationPath) {
  const configuredBaseUrl = process.env.CRAWLER_API_BASE_URL
  if (!configuredBaseUrl) {
    throw new Error('CRAWLER_API_BASE_URL is required')
  }

  let baseUrl
  try {
    baseUrl = new URL(configuredBaseUrl)
  } catch (error) {
    throw new Error('CRAWLER_API_BASE_URL must be an absolute URL')
  }

  if (baseUrl.username || baseUrl.password || baseUrl.search || baseUrl.hash) {
    throw new Error('CRAWLER_API_BASE_URL must not contain credentials, a query, or a fragment')
  }
  const hostname = baseUrl.hostname.toLowerCase().replace(/^\[|\]$/g, '')
  const isLoopback = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'
  if (baseUrl.protocol !== 'https:' && !(isLoopback && baseUrl.protocol === 'http:')) {
    throw new Error('CRAWLER_API_BASE_URL must use HTTPS unless it targets localhost')
  }
  if (!/^\/[A-Za-z0-9_/-]+$/.test(operationPath)) {
    throw new Error('Invalid crawler operation path')
  }

  baseUrl.pathname = `${baseUrl.pathname.replace(/\/+$/, '')}/${operationPath.replace(/^\/+/, '')}`
  return baseUrl.toString()
}

function getCrawlerRequestConfig(extraHeaders = {}) {
  return {
    headers: {
      ...extraHeaders,
      Authorization: `Bearer ${requireCrawlerApiToken()}`
    }
  }
}

module.exports = { buildCrawlerUrl, getCrawlerRequestConfig }
