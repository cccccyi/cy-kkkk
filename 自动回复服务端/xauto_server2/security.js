import crypto from 'crypto';

export function loadSecurityConfig(env = process.env) {
  const token = (env.API_AUTH_TOKEN || '').trim();
  if (token.length < 32) {
    throw new Error('API_AUTH_TOKEN must be configured with at least 32 characters');
  }

  const allowedOrigins = new Set(
    (env.CORS_ORIGINS || '')
      .split(',')
      .map(origin => origin.trim())
      .filter(Boolean)
  );

  return {
    tokenDigest: crypto.createHash('sha256').update(token, 'utf8').digest(),
    corsOptions: {
      origin(origin, callback) {
        if (!origin) {
          return callback(null, true);
        }
        return callback(null, allowedOrigins.has(origin));
      },
      allowedHeaders: ['Authorization', 'Content-Type'],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
    }
  };
}

export function createBearerAuth(tokenDigest) {
  return (req, res, next) => {
    const match = /^Bearer ([^\s]+)$/.exec(req.get('authorization') || '');
    const candidateDigest = crypto
      .createHash('sha256')
      .update(match ? match[1] : '', 'utf8')
      .digest();

    if (!match || !crypto.timingSafeEqual(candidateDigest, tokenDigest)) {
      res.set('WWW-Authenticate', 'Bearer');
      return res.status(401).json({ success: false, message: '未授权' });
    }

    return next();
  };
}
