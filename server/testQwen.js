// testQwen.js
/*
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const QWEN_API_KEY = process.env.DASHSCOPE_API_KEY;

const messages = [
  { role: 'user', content: '用一句话解释什么是人工智能。' }
];

const run = async () => {
  try {
    const res = await axios.post(
      'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
      {
        model: 'qwen-turbo',
        input: { messages },
        parameters: { temperature: 0.7 }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${QWEN_API_KEY}`
        }
      }
    );

    const reply = res.data.output?.text || '[无返回内容]';
    console.log('✅ AI 回复：', reply);
  } catch (err) {
    console.error('❌ 通义千问调用失败：', err.response?.data || err.message);
  }
};

run();
*/