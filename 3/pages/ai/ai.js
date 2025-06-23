// pages/ai/ai.js
Page({
  data: {
    messageList: [], // 消息列表
    inputMessage: '', // 输入框的内容
    scrollToMessage: '', // 用于消息自动滚动
    isLoading: false, // 是否正在加载回复
    defaultUserAvatar: '/image/yonghu.jpg', // 默认用户头像
    systemPrompt: `你是一名资深私人形象顾问，拥有10年高端时尚行业经验和ISTA国际形象顾问认证，精通服装设计、色彩心理学、面料科学及体型分析。你的任务是根据用户的个人特征（体型/肤色/风格偏好）、具体场景（商务会议/约会/旅行等）、季节气候及预算限制，提供精准的穿搭解决方案。

工作准则：
1️⃣ 深度诊断：当信息不全时，通过≤3个精准提问补全以下关键维度：
   ▪ 场合类型（例：周五商务晚宴）
   ▪ 体型特征（例：梨形/宽肩）
   ▪ 当前季节
   ▪ 预算范围（例：¥2000内单品）

2️⃣ 科学决策：基于三大核心原理：
   ▪ 色彩搭配：运用「四季色彩理论」（例："冷调肤色适合宝石蓝+银灰"）
   ▪ 体型优化：应用「视错原理」（例："H型廓形大衣可修饰腰线"）
   ▪ 面料决策：结合环境湿度/体感需求（例："30℃潮湿天气选亚麻透气面料"）

3️⃣ 结构化输出：采用「场景-问题-方案」格式：
   【场景】具体说明场合
   【用户痛点】明确提出问题
   【方案】
   ▪ 廓形建议：（视觉优化方案）
   ▪ 色彩方案：（色彩搭配逻辑）
   ▪ 点睛配饰：（重点配饰建议）

4️⃣ 专业表达：
   ▪ 首次提及专业术语需括号简释
   ▪ 禁用模糊词（"可能/或许"）
   ▪ 避免主观形容词堆砌
   ▪ 将行业术语转化为大众表达

5️⃣ 预算适配：
   ▪ 根据预算自动推荐对应品牌
   ▪ 预算紧张时提供平替方案
   ▪ 关注性价比和实用性

6️⃣ 用户画像：主动记忆并更新用户信息：
   ▪ 体型特征
   ▪ 肤色类型
   ▪ 风格偏好
   ▪ 预算范围
   ▪ 禁忌事项

请以专业、精准、实用的态度为用户提供个性化的穿搭建议。`,
  },

  // 当输入内容改变时的处理函数
  onInputChange(e) {
    this.setData({
      inputMessage: e.detail.value
    });
  },

  // 发送消息
  async onSendMessage() {
    const content = this.data.inputMessage.trim();
    if (!content || this.data.isLoading) return;

    // 构建用户消息对象
    const userMessage = {
      id: Date.now(),
      content: content,
      isUser: true,
      timestamp: new Date().toLocaleTimeString()
    };

    // 更新消息列表
    this.setData({
      messageList: [...this.data.messageList, userMessage],
      inputMessage: '',
      scrollToMessage: `msg-${userMessage.id}`,
      isLoading: true
    });

    try {
      // 调用Moonshot API
      const response = await this.callMoonshotAPI(content);
      
      if (response && response.choices && response.choices[0] && response.choices[0].message) {
        const aiMessage = {
          id: Date.now(),
          content: response.choices[0].message.content,
          isUser: false,
          timestamp: new Date().toLocaleTimeString()
        };

        this.setData({
          messageList: [...this.data.messageList, aiMessage],
          scrollToMessage: `msg-${aiMessage.id}`
        });
      } else {
        throw new Error('Invalid API response');
      }
    } catch (error) {
      console.error('API调用错误:', error);
      
      // 根据错误类型显示不同的提示
      let errorMessage = '连接失败，请稍后重试';
      if (error.errMsg && error.errMsg.includes('url not in domain list')) {
        errorMessage = '请在小程序后台添加request合法域名：https://api.moonshot.cn';
      }
      
      wx.showToast({
        title: errorMessage,
        icon: 'none',
        duration: 3000
      });
    } finally {
      this.setData({
        isLoading: false
      });
    }
  },

  // 调用Moonshot API
  callMoonshotAPI(userMessage) {
    return new Promise((resolve, reject) => {
      // 检查是否处于开发环境
      const isDev = wx.getSystemInfoSync().platform === 'devtools';
      
      // 配置请求选项
      const requestOptions = {
        url: 'https://api.moonshot.cn/v1/chat/completions',
        method: 'POST',
        header: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer sk-4QQ7PuSUFKjYjRS0B03EtadZjKx08IJKHHdpgNobPbNGYUnG'
        },
        data: {
          messages: [
            {
              role: "system",
              content: this.data.systemPrompt
            },
            {
              role: "user",
              content: userMessage
            }
          ],
          model: "moonshot-v1-8k",
          temperature: 0.7
        },
        timeout: 30000,
        success: (res) => {
          if (res.statusCode === 200) {
            resolve(res.data);
          } else {
            reject(new Error(`API request failed with status ${res.statusCode}`));
          }
        },
        fail: (err) => {
          reject(err);
        }
      };

      // 在开发环境下，启用不校验合法域名选项
      if (isDev) {
        wx.request({
          ...requestOptions,
          enableHttp2: true,
          enableQuic: true,
          enableCache: true
        });
      } else {
        wx.request(requestOptions);
      }
    });
  },

  onLoad() {
    // 添加一条欢迎消息
    const welcomeMessage = {
      id: Date.now(),
      content: '你好！我是你的个人穿搭师，请问有什么可以帮你搭配的吗？',
      isUser: false,
      timestamp: new Date().toLocaleTimeString()
    };
    
    this.setData({
      messageList: [welcomeMessage]
    });
  },

  onReady: function () {
    // 页面首次渲染完成时的操作
  },

  onShow: function () {
    // 页面显示时的操作
  }
}); 