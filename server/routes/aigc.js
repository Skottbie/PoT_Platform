// routes/aigc.js
const express = require('express');
const dotenv = require('dotenv');
const axios = require('axios');

dotenv.config();
const router = express.Router();

// ✅ 扩展通义千问请求函数 - 支持动态模型
const callQwen = async (messages, modelName = 'qwen-turbo') => {
  const res = await axios.post(
    'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
    {
      model: modelName, // 使用传入的模型名
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
  const { messages, model = 'qwen' } = req.body;

  try {
    let reply = '';

    if (model === 'qwen') {
      // 保持原有调用方式
      reply = await callQwen(messages);
    } else if (model === 'qwen-flash') {
      reply = await callQwen(messages, 'qwen-flash');
    } else if (model === 'qwen-plus') {
      reply = await callQwen(messages, 'qwen-plus');
    } else {
      return res.status(400).json({ error: 'OpenAI服务已暂时禁用' });
    }

    res.json({ reply });
  } catch (err) {
    console.error('❌ AI响应失败：', err.response?.data || err.message);
    res.status(500).json({ error: 'AI响应失败' });
  }
});

module.exports = router;