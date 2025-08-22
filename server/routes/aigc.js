// server/routes/aigc.js - 简化版PoT模式支持
const express = require('express');
const dotenv = require('dotenv');
const axios = require('axios');

dotenv.config();
const router = express.Router();

// ===== 现有模型调用函数 =====

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
      model: 'deepseek-r1-distill-llama-70b',
      input: { messages },
      parameters: { 
        temperature: 0.7,
        result_format: 'message'
      },
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.DASHSCOPE_API_KEY}`,
      },
    }
  );
  
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
        'Authorization': `Bearer ${process.env.BAIDU_API_KEY}`,
      },
    }
  );

  return res.data.choices[0].message.content;
};

// ===== 🆕 PoT智能体应用调用函数 =====

/**
 * 调用PoT智能体应用 - 自行管理模式
 * @param {Array} messages - 完整消息历史
 * @returns {Object} 智能体响应
 */
const callPoTAgent = async (messages) => {
  const appId = process.env.POT_APP_ID;
  
  if (!appId) {
    throw new Error('PoT智能体应用ID未配置，请设置POT_APP_ID环境变量');
  }

  const url = `https://dashscope.aliyuncs.com/api/v1/apps/${appId}/completion`;
  
  // 构建请求体 - 自行管理模式
  const requestBody = {
    input: {
      messages: messages // 传递完整消息历史
    },
    parameters: {
      temperature: 0.8,
      top_p: 0.9
    },
    debug: {}
  };

  try {
    const res = await axios.post(url, requestBody, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DASHSCOPE_API_KEY}`,
      },
      timeout: 30000
    });

    console.log(`✅ PoT智能体响应成功`);
    
    return {
      content: res.data.output.text,
      finish_reason: res.data.output.finish_reason,
      usage: res.data.usage,
      request_id: res.data.request_id,
      isPotMode: true
    };
  } catch (error) {
    console.error('❌ PoT智能体调用失败:', error.response?.data || error.message);
    throw new Error(`PoT智能体调用失败: ${error.response?.data?.message || error.message}`);
  }
};

// 删除估算功能，直接使用智能体原始输出

// ===== 🔧 主要聊天路由 =====

router.post('/chat', async (req, res) => {
  const { 
    messages, 
    model = 'qwen-flash', 
    potMode = false // PoT模式标识
  } = req.body;

  try {
    let reply = '';
    let reasoning_content = null;
    let isPotResponse = false;

    // 🎯 PoT模式检测和处理
    if (potMode) {
      console.log(`🧠 PoT模式请求`);
      
      try {
        // 直接调用PoT智能体应用，传递完整消息历史
        const potResult = await callPoTAgent(messages);
        
        reply = potResult.content;
        isPotResponse = true;

        console.log(`✅ PoT对话成功`);
      } catch (error) {
        console.error('❌ PoT智能体调用失败，降级到普通模式:', error.message);
        
        // 降级处理：使用普通qwen-plus模型
        reply = await callQwen(messages, 'qwen-plus');
        console.log('🔄 已降级到通义千问-Plus模型');
      }
    } else {
      // 🎯 普通模式处理（现有逻辑）
      if (model === 'qwen-flash') {
        reply = await callQwen(messages, 'qwen-flash');
      } else if (model === 'qwen-plus') {
        reply = await callQwen(messages, 'qwen-plus');
      } else if (model === 'qwen') {
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
    }

    // 🎯 构建统一响应格式
    const response = { 
      reply,
      potMode: isPotResponse
    };

    // 添加推理内容（非PoT模式）
    if (reasoning_content && !isPotResponse) {
      response.reasoning_content = reasoning_content;
    }

    // 添加PoT相关信息
    if (isPotResponse) {
      response.model = 'pot-tutor'; // 固定模型名
    }

    res.json(response);
  } catch (err) {
    console.error('❌ AI响应失败：', err.response?.data || err.message);
    res.status(500).json({ 
      error: 'AI响应失败',
      details: err.message,
      potMode: potMode || false
    });
  }
});

module.exports = router;