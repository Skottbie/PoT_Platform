// server/workers/src/utils/crypto.js - 加密工具

// 使用 Web Crypto API 进行密码哈希
export async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  
  // 生成盐值
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  // 使用 PBKDF2 进行哈希
  const key = await crypto.subtle.importKey(
    'raw',
    data,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 10000,
      hash: 'SHA-256'
    },
    key,
    256
  );
  
  // 将盐值和哈希值组合
  const hashArray = new Uint8Array(hashBuffer);
  const combined = new Uint8Array(salt.length + hashArray.length);
  combined.set(salt);
  combined.set(hashArray, salt.length);
  
  // 转为 base64
  return btoa(String.fromCharCode.apply(null, combined));
}

export async function verifyPassword(password, hashedPassword) {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    
    // 解码存储的哈希
    const combined = new Uint8Array(
      atob(hashedPassword).split('').map(char => char.charCodeAt(0))
    );
    
    // 提取盐值和哈希值
    const salt = combined.slice(0, 16);
    const storedHash = combined.slice(16);
    
    // 重新计算哈希
    const key = await crypto.subtle.importKey(
      'raw',
      data,
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );
    
    const hashBuffer = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 10000,
        hash: 'SHA-256'
      },
      key,
      256
    );
    
    const computedHash = new Uint8Array(hashBuffer);
    
    // 比较哈希值
    if (computedHash.length !== storedHash.length) {
      return false;
    }
    
    for (let i = 0; i < computedHash.length; i++) {
      if (computedHash[i] !== storedHash[i]) {
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('密码验证失败:', error);
    return false;
  }
}