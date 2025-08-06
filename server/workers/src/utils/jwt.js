// server/workers/src/utils/jwt.js - JWT 工具

// 简化版 JWT 实现（使用 Web Crypto API）
export async function generateJWT(payload, secret) {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  // 添加过期时间 (2小时)
  const now = Math.floor(Date.now() / 1000);
  const exp = now + (2 * 60 * 60);
  
  const fullPayload = {
    ...payload,
    iat: now,
    exp: exp
  };

  // Base64 编码
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(fullPayload));
  
  // 创建签名
  const message = `${encodedHeader}.${encodedPayload}`;
  const signature = await createSignature(message, secret);
  
  return `${message}.${signature}`;
}

export async function verifyJWT(token, secret) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const [encodedHeader, encodedPayload, signature] = parts;
    
    // 验证签名
    const message = `${encodedHeader}.${encodedPayload}`;
    const expectedSignature = await createSignature(message, secret);
    
    if (signature !== expectedSignature) {
      return null;
    }

    // 解码 payload
    const payload = JSON.parse(atob(encodedPayload));
    
    // 检查过期时间
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && now > payload.exp) {
      return null;
    }

    return payload;
  } catch (error) {
    console.error('JWT 验证失败:', error);
    return null;
  }
}

async function createSignature(message, secret) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, messageData);
  
  // 转为 base64 (URL safe)
  return btoa(String.fromCharCode.apply(null, new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}