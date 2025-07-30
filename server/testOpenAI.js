// testOpenAI.js
/*
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('❌ 没有找到 OPENAI_API_KEY，请检查 .env 文件');
  process.exit(1);
}

async function testOpenAI() {
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: '你好，GPT！你能听到我吗？' }],
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      console.error('❌ 请求失败:', err);
    } else {
      const data = await res.json();
      console.log('✅ 成功响应：', data.choices[0].message.content);
    }
  } catch (err) {
    console.error('❌ 网络或其他错误：', err);
  }
}

testOpenAI();
*/