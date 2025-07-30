// routes/aigc.js
const express = require('express');
const dotenv = require('dotenv');
const axios = require('axios');
const OpenAI = require('openai'); // ✅ 不要解构了！

dotenv.config();
const router = express.Router();

// ✅ 新版本初始化方式
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ✅ 通义千问请求函数
const callQwen = async (messages) => {
  const res = await axios.post(
    'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
    {
      model: 'qwen-turbo',
      input: { messages },
      parameters: { temperature: 0.7 },
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.DASHSCOPE_API_KEY}`,
      },
    }
  );
  return res.data.output.text;
};

router.post('/chat', async (req, res) => {
  const { messages, model = 'openai' } = req.body;

  try {
    let reply = '';

    if (model === 'openai') {
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages,
      });
      reply = completion.choices[0].message.content;
    } else if (model === 'qwen') {
      reply = await callQwen(messages);
    } else {
      return res.status(400).json({ error: '不支持的模型类型' });
    }

    res.json({ reply });
  } catch (err) {
    console.error('❌ AI响应失败：', err.response?.data || err.message);
    res.status(500).json({ error: 'AI响应失败' });
  }
});

module.exports = router;
