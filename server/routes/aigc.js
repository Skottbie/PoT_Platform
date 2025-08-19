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
      model: modelName,
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

// ✅ 修正后的 DeepSeek-R1-Distill-Llama-70B 请求函数
const callDeepSeekR1 = async (messages) => {
  const res = await axios.post(
    'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
    {
      model: 'deepseek-r1-distill-llama-70b', // ✅ 模型名称正确
      input: { messages },
      parameters: { 
        temperature: 0.7,
        result_format: 'message' // ✅ 必须设置为 'message'
      },
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.DASHSCOPE_API_KEY}`,
      },
    }
  );
  
  // ✅ 正确的响应路径
  const choice = res.data.output.choices[0];
  return {
    content: choice.message.content,
    reasoning_content: choice.message.reasoning_content || null
  };
};

// ✅ 新增：百度ERNIE Speed 请求函数 (v2 API - OpenAI兼容)
const callErnieSpeed = async (messages) => {
  const res = await axios.post(
    'https://qianfan.baidubce.com/v2/chat/completions',
    {
      model: 'ernie-speed-128k',
      messages: messages,
      temperature: 0.7,
      top_p: 0.8,
      stream: false
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.BAIDU_API_KEY}`, // v2 API使用Bearer Token
      },
    }
  );

  return res.data.choices[0].message.content;
};

router.post('/chat', async (req, res) => {
  const { messages, model = 'qwen-flash' } = req.body;

  try {
    let reply = '';
    let reasoning_content = null;

    if (model === 'qwen-flash') {
      reply = await callQwen(messages, 'qwen-flash');
    } else if (model === 'qwen-plus') {
      reply = await callQwen(messages, 'qwen-plus');
    } else if (model === 'qwen') {
      // 保持向后兼容
      reply = await callQwen(messages, 'qwen-turbo');
    } else if (model === 'deepseek-r1-distill') {
      const result = await callDeepSeekR1(messages);
      reply = result.content;
      reasoning_content = result.reasoning_content;
    } else if (model === 'ernie-speed') {
      reply = await callErnieSpeed(messages);
    } else {
      return res.status(400).json({ error: '不支持的模型类型' });
    }

    // 统一返回格式
    const response = { reply };
    if (reasoning_content) {
      response.reasoning_content = reasoning_content;
    }

    res.json(response);
  } catch (err) {
    console.error('❌ AI响应失败：', err.response?.data || err.message);
    res.status(500).json({ error: 'AI响应失败' });
  }
});

module.exports = router;