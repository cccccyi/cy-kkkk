const path = require('path')
const { spawnSync } = require('child_process')

const ACCOUNT_CACHE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/
const CHILD_DIRECTORY_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/
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

function requireSafeAccountCache(value) {
    if (typeof value !== 'string' || !ACCOUNT_CACHE_PATTERN.test(value)) {
        throw new Error('account_cache must be a 1-64 character alphanumeric slug')
    }
    return value
}

function resolveSafeChildDirectory(baseDirectory, childName) {
    if (typeof childName !== 'string' || !CHILD_DIRECTORY_PATTERN.test(childName)) {
        throw new Error('Directory name must be a safe 1-128 character slug')
    }
    const resolvedBase = path.resolve(baseDirectory)
    const resolvedChild = path.resolve(resolvedBase, childName)
    if (path.dirname(resolvedChild) !== resolvedBase) {
        throw new Error('Resolved directory escaped its configured base')
    }
    return resolvedChild
}

function runCrawlerProcess(executable, scriptPath, userDataDirectory, showWindow = true) {
    const args = [
        '--no-sandbox',
        `--script=${scriptPath}`,
        `--userData=${userDataDirectory}`,
        `--showWin=${showWindow ? 'true' : 'false'}`
    ]
    const result = spawnSync(executable, args, {
        shell: false,
        maxBuffer: 200 * 1024 * 1024
    })
    return {
        ok: !result.error && result.status === 0,
        status: result.status,
        signal: result.signal,
        errorCode: result.error && result.error.code ? result.error.code : null
    }
}

module.exports = {
    buildCrawlerUrl,
    getCrawlerRequestConfig,
    requireSafeAccountCache,
    resolveSafeChildDirectory,
    runCrawlerProcess
}
