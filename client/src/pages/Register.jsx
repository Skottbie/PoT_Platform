// client/src/pages/Register.jsx - 全面优化版本（含封测协议模态框）

import { useState, useCallback, useMemo, useEffect } from 'react';
import axios from '../api/axiosInstance';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Users, FileText, ChevronRight, AlertTriangle, CheckCircle } from 'lucide-react';
import Button from '../components/Button';
import toast from 'react-hot-toast';

const Register = () => {
  // 原有状态
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // 新增模态框状态
  const [showBetaModal, setShowBetaModal] = useState(true);
  const [showFullAgreement, setShowFullAgreement] = useState(false);
  const [hasAgreed, setHasAgreed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // 禁用背景滚动
  useEffect(() => {
    if (showBetaModal || showFullAgreement) {
      // 禁用背景滚动
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${window.scrollY}px`;
      document.body.style.width = '100%';
    } else {
      // 恢复滚动
      const scrollY = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, parseInt(scrollY || '0') * -1);
    }

    return () => {
      // 清理函数
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
    };
  }, [showBetaModal, showFullAgreement]);
  
  const navigate = useNavigate();

  // 设备检测
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // 页面加载时检查是否已登录
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await axios.get('/user/profile');
          const role = res.data.role;
          navigate(role === 'teacher' ? '/teacher' : '/student');
        } catch (error) {
          localStorage.removeItem('token');
          localStorage.removeItem('role');
        }
      }
    };
    checkAuthStatus();
  }, [navigate]);

  // 处理协议同意
  const handleAgree = useCallback(() => {
    setHasAgreed(true);
    setShowBetaModal(false);
  }, []);

  // 处理拒绝
  const handleDecline = useCallback(() => {
    navigate('/');
  }, [navigate]);

  // 显示完整协议
  const handleShowFullAgreement = useCallback(() => {
    setShowFullAgreement(true);
  }, []);

  // 关闭完整协议
  const handleCloseFullAgreement = useCallback(() => {
    setShowFullAgreement(false);
  }, []);

  // 注册提交处理
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (loading) return;
    
    setError('');
    setLoading(true);
    
    try {
      await axios.post('/auth/register', {
        email,
        password,
        role,
        inviteCode,
      });
      
      toast.success('注册成功，请登录');
      navigate('/login');
    } catch (err) {
      const errorMessage = err.response?.data?.message || '注册失败';
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [email, password, role, inviteCode, loading, navigate]);

  // 按钮配置
  const buttonProps = useMemo(() => ({
    type: "submit",
    variant: "primary",
    size: isMobile ? "lg" : "md",
    fullWidth: true,
    loading: loading,
    disabled: !email || !password || !inviteCode || loading
  }), [email, password, inviteCode, loading, isMobile]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 relative">
      
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 dark:bg-purple-900 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 dark:bg-blue-900 rounded-full opacity-20 blur-3xl"></div>
      </div>

      {/* 主注册卡片 - 只在同意协议后显示 */}
      <AnimatePresence>
        {hasAgreed && (
          <motion.div
            className={`w-full ${isMobile ? 'max-w-sm' : 'max-w-md'} relative z-10`}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* Logo区域 */}
            <motion.div
              className="text-center mb-8"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-3xl font-light text-gray-800 dark:text-gray-100 mb-2">
                创建账号
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                加入 PoT Academy，开始你的学习之旅
              </p>
            </motion.div>

            {/* 注册卡片 */}
            <motion.div
              className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6 sm:p-8"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <form onSubmit={handleSubmit} className="space-y-5">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    邮箱
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="username"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600
                              bg-gray-50/50 dark:bg-gray-700/50 backdrop-blur-md
                              text-gray-900 dark:text-gray-100 shadow-sm
                              focus:outline-none focus:ring-2 focus:ring-blue-500
                              hover:shadow-md hover:scale-[1.01] transition-all duration-200"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    密码
                  </label>
                  <input
                    id="password"
                    type="password"
                    placeholder="请输入密码"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600
                              bg-gray-50/50 dark:bg-gray-700/50 backdrop-blur-md
                              text-gray-900 dark:text-gray-100 shadow-sm
                              focus:outline-none focus:ring-2 focus:ring-blue-500
                              hover:shadow-md hover:scale-[1.01] transition-all duration-200"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    邀请码
                  </label>
                  <input
                    id="inviteCode"
                    type="text"
                    placeholder="请输入邀请码"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600
                              bg-gray-50/50 dark:bg-gray-700/50 backdrop-blur-md
                              text-gray-900 dark:text-gray-100 shadow-sm
                              focus:outline-none focus:ring-2 focus:ring-blue-500
                              hover:shadow-md hover:scale-[1.01] transition-all duration-200"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    身份
                  </label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600
                              bg-gray-50/50 dark:bg-gray-700/50 backdrop-blur-md
                              text-gray-900 dark:text-gray-100 shadow-sm
                              focus:outline-none focus:ring-2 focus:ring-blue-500
                              hover:shadow-md hover:scale-[1.01] transition-all duration-200"
                  >
                    <option value="student">学生</option>
                    <option value="teacher">教师</option>
                  </select>
                </motion.div>

                {error && (
                  <motion.div
                    className="text-red-500 dark:text-red-400 text-sm text-center
                              bg-red-50/50 dark:bg-red-900/20 
                              rounded-xl py-3 px-4 border border-red-200 dark:border-red-800"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {error}
                  </motion.div>
                )}

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  <Button {...buttonProps}>
                    {loading ? '注册中...' : '创建账号'}
                  </Button>
                </motion.div>
              </form>

              <motion.div
                className="text-center mt-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
              >
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  已有账号？
                </span>
                <a
                  href="/login"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline ml-1 font-medium"
                >
                  立即登录
                </a>
              </motion.div>
            </motion.div>

            {/* 安全提示 */}
            <motion.div
              className="mt-6 p-4 bg-green-50/50 dark:bg-green-900/20 rounded-xl border border-green-200/50 dark:border-green-700/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.0 }}
            >
              <p className="text-xs text-green-700 dark:text-green-300 text-center leading-relaxed">
                🎓 感谢参与封测！你的反馈将帮助我们打造更好的学习体验
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 封测协议主模态框 */}
      <AnimatePresence>
        {showBetaModal && !showFullAgreement && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className={`bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 w-full ${
                isMobile ? 'max-w-sm max-h-[90vh]' : 'max-w-lg max-h-[85vh]'
              } overflow-hidden`}
              initial={isMobile ? { opacity: 0, y: '100%' } : { opacity: 0, scale: 0.9, y: 20 }}
              animate={isMobile ? { opacity: 1, y: 0 } : { opacity: 1, scale: 1, y: 0 }}
              exit={isMobile ? { opacity: 0, y: '100%' } : { opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {/* 头部 */}
              <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 px-6 py-5 text-center relative">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-white">
                    欢迎加入 PoT Academy
                  </h2>
                </div>
                <p className="text-white/90 text-sm">
                  开始前，请了解我们的安全承诺
                </p>
              </div>

              {/* 内容区域 */}
              <div className="p-6 overflow-y-auto flex-1 space-y-5">
                {/* 安全保障 */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        你的信息，安全无虞。
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                        我们采用<strong>企业级安全加密技术</strong>来保护你的账户密码。所有作业文件、图片和学习记录都通过高级加密和安全存储系统妥善保管，保障你的数据完整性和隐私。
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mt-2">
                        我们建立了完善的异常行为监控系统，为你的每一次学习和学术工作保驾护航。
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        持续守护，值得信赖。
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                        PoTAcademy 承诺持续投入最高标准的安全防护。我们将时刻监控系统安全，定期更新防护机制，确保你能够专注于学习，无后顾之忧。
                      </p>
                    </div>
                  </div>

                  {/* 重要提醒 */}
                  <div className="bg-orange-50/80 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="text-sm font-semibold text-orange-800 dark:text-orange-200 mb-1">
                          重要提醒：这是封闭测试版本。
                        </h3>
                        <p className="text-xs text-orange-700 dark:text-orange-300 leading-relaxed">
                          你的数据安全是我们的首要承诺，但我们强烈建议你为重要信息<strong>保留本地备份</strong>。
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 协议链接 */}
                  <div className="text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                      通过继续注册，你同意遵守相关条款
                    </p>
                    <button
                      type="button"
                      onClick={handleShowFullAgreement}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium flex items-center gap-1 mx-auto"
                    >
                      <FileText className="w-4 h-4" />
                      📋 查看完整封测参与协议
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* 共创感召 */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-5">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        你，就是未来教育的共创者。
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                        每一次使用、每一条反馈，都在帮助 AI 时代的教学新范式的完善。你是这场教育变革中不可或缺的一员。
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mt-2 italic">
                        期待与你一起，让思考变得更加深刻而纯粹。
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 底部按钮 */}
              <div className="px-6 pb-6 space-y-3">
                <button
                  onClick={handleAgree}
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 
                           text-white font-semibold rounded-xl shadow-lg
                           hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]
                           transition-all duration-200 ease-out
                           focus:outline-none focus:ring-4 focus:ring-blue-500/50"
                >
                  ✅ 我已阅读并同意，继续注册
                </button>
                
                <button
                  onClick={handleDecline}
                  className="w-full py-2.5 px-4 text-gray-600 dark:text-gray-400 
                           hover:text-gray-800 dark:hover:text-gray-200
                           font-medium text-sm transition-colors duration-200"
                >
                  暂不参与
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 完整协议模态框 */}
      <AnimatePresence>
        {showFullAgreement && (
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-60 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 w-full ${
                isMobile ? 'h-[90vh]' : 'max-w-4xl h-[85vh]'
              } overflow-hidden flex flex-col`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {/* 协议头部 */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    封测参与协议
                  </h3>
                </div>
                <button
                  onClick={handleCloseFullAgreement}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              {/* 协议内容 - 可滚动区域 */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-6 space-y-6 text-gray-800 dark:text-gray-200">
                  
                  {/* 版本信息 */}
                  <div className="text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 pb-3">
                    <p><strong>版本号：</strong> 1.0</p>
                    <p><strong>生效日期：</strong> 2025年8月29日</p>
                  </div>

                  {/* 第一条 定义与主体信息 */}
                  <section>
                    <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
                      第一条 定义与主体信息
                    </h4>
                    <div className="space-y-2 text-sm leading-relaxed">
                      <p>1. <strong>平台</strong>：指"PoT Academy"及其提供的相关网站/小程序/应用与后台系统。</p>
                      <p>2. <strong>运营方/我们</strong>：指 PoT Academy 开发团队。</p>
                      <p>3. <strong>用户/您</strong>：指参与封测并使用平台服务的自然人。</p>
                      <p>4. <strong>保密信息</strong>：指一切未公开的与平台有关的信息（含功能、界面、架构、源代码、测试账号、技术文档、性能/缺陷数据、非公开沟通等）。</p>
                      <p>5. <strong>用户内容</strong>：指您在平台上传、提交或产生的内容（如作业、笔记、评论、附件、日志等）。</p>
                      <p>6. <strong>测试期</strong>：指自本协议生效起至平台公告的封测结束日，或我们书面通知的其他日期。</p>
                    </div>
                    
                    <div className="mt-4 p-4 bg-blue-50/80 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        <strong>【显著提示】</strong> 您点击"我已阅读并同意"或实际使用平台，即视为您已充分理解并接受本协议及其附件（含《隐私政策》《漏洞报告与披露政策》）。
                      </p>
                    </div>
                  </section>

                  {/* 第二条 协议性质与适用范围 */}
                  <section>
                    <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
                      第二条 协议性质与适用范围
                    </h4>
                    <div className="space-y-2 text-sm leading-relaxed">
                      <p>1. 本协议是您与运营方就封测活动达成的具有法律约束力的电子协议。</p>
                      <p>2. 本协议适用于您在测试期内的一切相关行为，包括注册、登录、使用、信息发布、数据传输、反馈提交与漏洞报告等。</p>
                      <p>3. 若您不同意本协议任何条款，应立即停止使用并注销账号。</p>
                    </div>
                  </section>

                  {/* 第三条 资格与未成年人保护 */}
                  <section>
                    <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
                      第三条 资格与未成年人保护
                    </h4>
                    <div className="space-y-2 text-sm leading-relaxed">
                      <p>1. 您承诺具备与封测相适应的民事行为能力。</p>
                      <p>2. <strong>未成年人特别规则</strong>：</p>
                      <ul className="list-disc list-inside ml-4 space-y-1">
                        <li><strong>未满14周岁</strong>的未成年人参与封测须事先取得监护人明示同意，我们将实施专门的个人信息处理规则；</li>
                        <li><strong>已满14未满18周岁</strong>的未成年人参与封测，建议征得监护人知情与同意。</li>
                      </ul>
                      <p>3. 您承诺按要求提供真实、准确、完整的注册信息。如信息变更，应及时更新。</p>
                    </div>
                  </section>

                  {/* 第四条 保密义务 */}
                  <section>
                    <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
                      第四条 保密义务
                    </h4>
                    <div className="space-y-2 text-sm leading-relaxed">
                      <p>1. 未经我们书面许可，您不得披露、传播、公开展示或以任何方式向第三方提供保密信息。</p>
                      <p>2. 您不得以截图、录屏、录音、转述、逆向工程、反编译、反汇编等任何方式获取或传播保密信息或源代码。</p>
                      <p>3. 本条义务<strong>不因测试期结束而终止</strong>，存续期为保密信息公开之日起不少于<strong>三年</strong>；法律另有更长要求的，从其规定。</p>
                    </div>
                  </section>

                  {/* 第五条 使用规范与禁止行为 */}
                  <section>
                    <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
                      第五条 使用规范与禁止行为
                    </h4>
                    <div className="space-y-2 text-sm leading-relaxed">
                      <p>1. 您仅可为<strong>学习、教学辅助与产品验证</strong>之目的、按正常用户路径使用平台。</p>
                      <p>2. <strong>禁止行为</strong>包括但不限于：</p>
                      <ol className="list-decimal list-inside ml-4 space-y-1">
                        <li>恶意测试/攻击（如SQL注入、XSS、DDoS、口令穷举、自动化扫描等）；</li>
                        <li>未经授权访问他人数据、后台或非公开接口；</li>
                        <li>利用缺陷牟利或进行任何违法违规活动；</li>
                        <li>上传/传播违法、有害、虚假、淫秽、暴力、侵权内容或可能危害网络安全的代码/文件；</li>
                        <li>侵犯任何第三方合法权益。</li>
                      </ol>
                      <p>3. <strong>善意报告"安全港"</strong>：若您在<strong>正常使用中偶然发现</strong>疑似漏洞，<strong>应当</strong>依《漏洞报告与披露政策》（附件二）通过指定渠道上报，期间<strong>不得扩大量级验证、不得对外披露或用于牟利</strong>；我们在合规前提下对<strong>善意、及时、配合修复</strong>的研究者给予<strong>不予追责的承诺</strong>（法律法规另有规定或存在恶意/实际损害的除外）。</p>
                      <p>4. <strong>违规处理</strong>：我们可视情形对违规用户采取<strong>警告、功能限制、下线内容、冻结/注销账号、追究法律责任</strong>等措施。</p>
                    </div>
                  </section>

                  {/* 第六条 知识产权 */}
                  <section>
                    <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
                      第六条 知识产权
                    </h4>
                    <div className="space-y-2 text-sm leading-relaxed">
                      <p>1. 平台及其相关技术、代码、界面、设计、文档、商标等之<strong>全部知识产权</strong>归运营方或相应权利人所有。</p>
                      <p>2. <strong>用户内容</strong>：您对原创用户内容享有权利；但您授予我们及关联方<strong>全球范围内、不可撤销、非独占、可转授权与再许可的免费许可</strong>，用于提供/运营/维护/改进服务及<strong>在封测语境下的演示与研究</strong>（在不披露个人信息的前提下可脱敏展示）。</p>
                      <p>3. <strong>反馈/建议/缺陷报告</strong>：您同意对您提交的意见、建议、缺陷报告等赋予我们<strong>永久、不可撤销、免费</strong>的使用与实施权利（<strong>不涉及您作品的法定人身权</strong>）。</p>
                      <p>4. 若平台包含第三方/开源软件，相关许可条款与本协议共同适用；冲突时以<strong>更严格者</strong>为准。</p>
                    </div>
                  </section>

                  {/* 第七条 数据与隐私保护 */}
                  <section>
                    <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
                      第七条 数据与隐私保护（摘要）
                    </h4>
                    <div className="space-y-2 text-sm leading-relaxed">
                      <p>1. 我们将遵守适用法律开展个人信息处理，仅收集实现功能所必要的数据。</p>
                      <p>2. <strong>告知要素</strong>：我们会以《隐私政策》（附件一）明确<strong>处理者名称及联系方式、目的、方式、类型、保存期限、共享/委托处理/对外提供情况、跨境传输、用户权利与行使方式</strong>等。</p>
                      <p>3. <strong>安全措施</strong>：采用行业通行措施（如<strong>bcrypt</strong>口令哈希、访问控制、加密存储、异常监测、最小化授权、审计日志与脱敏处理等）。</p>
                      <p>4. <strong>用户权利</strong>：依法享有<strong>查询/复制、更正、补充、删除、撤回同意、账户注销</strong>等权利；我们将设置便捷通道处理您的请求。</p>
                      <p>5. <strong>跨境传输</strong>：若涉及跨境处理个人信息，我们将依法履行评估、合同、认证或其他合规义务，并<strong>征得必要同意</strong>。</p>
                      <p>6. <strong>未成年人信息保护</strong>：对<strong>未满14周岁</strong>个人信息实施<strong>专门规则</strong>并取得<strong>监护人明示同意</strong>。</p>
                      <p>7. <strong>日志与遥测</strong>：为保障安全与改进体验，您同意我们在封测范围内记录必要的<strong>技术日志与故障诊断信息</strong>，并仅用于安全与改进之目的。</p>
                    </div>
                    
                    <div className="mt-4 p-3 bg-gray-100/80 dark:bg-gray-700/30 rounded-lg">
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        完整规则以《隐私政策》（附件一）为准；若本条与附件不一致，以<strong>对用户更有利</strong>者为准。
                      </p>
                    </div>
                  </section>

                  {/* 第八条 测试期风险提示与免责声明 */}
                  <section>
                    <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
                      第八条 测试期风险提示与免责声明
                    </h4>
                    
                    <div className="bg-red-50/80 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-4">
                      <p className="text-sm text-red-800 dark:text-red-200 font-semibold">
                        【重要提示—责任限制】请您务必仔细阅读并以<strong>加粗/弹窗</strong>等方式确认。
                      </p>
                    </div>
                    
                    <div className="space-y-2 text-sm leading-relaxed">
                      <p>1. <strong>测试期特性</strong>：服务可能出现<strong>中断/延迟、数据丢失或损坏、功能缺陷或不稳定、潜在安全漏洞</strong>等风险；请您为重要数据<strong>做好本地备份</strong>。</p>
                      <p>2. <strong>按现状/按可用</strong>提供：我们不对<strong>不间断性、无错误、与特定目的适配</strong>作明示或默示担保（<strong>法律禁止的除外</strong>）。</p>
                      <p>3. <strong>有限责任</strong>：在法律允许的最大范围内，<strong>对因封测服务引发或与之相关的任何损失</strong>，我们的总责任上限为：</p>
                      <ul className="list-disc list-inside ml-4 space-y-1">
                        <li>若本服务<strong>免费</strong>：人民币<strong>0</strong>元；</li>
                        <li>若存在<strong>付费</strong>：不超过您就相关服务在<strong>最近12个月</strong>实际支付的费用总额。</li>
                      </ul>
                      <p>4. <strong>不可免责范围</strong>：法律明确禁止免除或限制的责任（例如依法应承担的对人身、生命健康造成损害的责任等）不受上述限制。</p>
                    </div>
                  </section>

                  {/* 第九条 违约与救济 */}
                  <section>
                    <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
                      第九条 违约与救济
                    </h4>
                    <div className="space-y-2 text-sm leading-relaxed">
                      <p>1. 如您违反本协议或法律法规，您应赔偿因此给我们造成的<strong>全部损失</strong>（包括但不限于直接损失、调查取证费用、律师费、诉讼/仲裁费、合理维权开支与商誉损失等）。</p>
                      <p>2. 对于<strong>恶意攻击、数据泄露、牟利性利用漏洞</strong>等严重情形，我们有权向有关机关报案并依法追责。</p>
                    </div>
                  </section>

                  {/* 第十条 期限、暂停与终止 */}
                  <section>
                    <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
                      第十条 期限、暂停与终止
                    </h4>
                    <div className="space-y-2 text-sm leading-relaxed">
                      <p>1. 本协议自您同意之时生效，至测试期结束或您的账户注销之日终止，以在先发生者为准。</p>
                      <p>2. 如您存在或我们合理怀疑存在违反本协议或法律的行为，我们可<strong>立即</strong>暂停或终止向您提供服务。</p>
                      <p>3. 法律法规或监管要求发生变化导致服务无法继续提供的，我们可暂停/终止服务并尽商合理努力进行数据处置与通知。</p>
                    </div>
                  </section>

                  {/* 第十一条 变更与通知 */}
                  <section>
                    <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
                      第十一条 变更与通知
                    </h4>
                    <div className="space-y-2 text-sm leading-relaxed">
                      <p>1. 我们可以<strong>合理通知</strong>后对本协议与附件进行更新；涉及<strong>个人信息处理目的、方式、类型、共享或保存期限等重大变化</strong>的，将<strong>再次征得您的明示同意</strong>。</p>
                      <p>2. 我们将通过<strong>站内通知/弹窗/邮件/页面公告</strong>等至少一种方式进行提示；您继续使用即视为同意更新条款。</p>
                    </div>
                  </section>

                  {/* 第十二条 联系与通知送达 */}
                  <section>
                    <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
                      第十二条 联系与通知送达
                    </h4>
                    <div className="space-y-2 text-sm leading-relaxed">
                      <p>• 联系方式：平台内反馈功能</p>
                      <p>• 法律文书送达：可通过您绑定的<strong>手机号/邮箱/平台站内信</strong>送达，自发送之时即视为送达。</p>
                    </div>
                  </section>

                  {/* 第十三条 法律适用与争议解决 */}
                  <section>
                    <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
                      第十三条 法律适用与争议解决
                    </h4>
                    <div className="space-y-2 text-sm leading-relaxed">
                      <p>1. 本协议的订立、效力、履行、解释及争议解决适用<strong>中华人民共和国大陆地区法律</strong>。</p>
                      <p>2. 因本协议产生的争议，双方应首先<strong>友好协商</strong>；协商不成的，任何一方均可向<strong>平台实际运营地有管辖权的人民法院</strong>提起诉讼。</p>
                    </div>
                  </section>

                  {/* 第十四条 其他 */}
                  <section>
                    <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
                      第十四条 其他
                    </h4>
                    <div className="space-y-2 text-sm leading-relaxed">
                      <p>1. <strong>不可抗力</strong>：自然灾害、公共卫生事件、战争、政府行为、网络/电力故障等不可抗力或意外事件导致一方不能履行的，责任可在法律允许范围内予以免责。</p>
                      <p>2. <strong>转让</strong>：未经我们书面同意，您不得转让本协议项下权利义务；我们可在<strong>不降低您权利</strong>的前提下，将相关权利义务转让给关联方或继受公司，并予以公告/通知。</p>
                      <p>3. <strong>条款独立</strong>：任一条款被判无效，不影响其他条款之效力。</p>
                      <p>4. <strong>版本与语言</strong>：本协议以中文为准。我们会保留版本号与生效日期以供查验。</p>
                      <p>5. <strong>完整协议</strong>：本协议与附件构成双方就封测事项达成的完整协议。</p>
                    </div>
                  </section>

                  <div className="text-center text-xs text-gray-500 dark:text-gray-400 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <p><strong>运营方：</strong>PoT Academy 开发团队</p>
                    <p><strong>联系方式：</strong>平台内反馈功能</p>
                    <p className="mt-2"><strong>PoT Academy 开发团队</strong></p>
                    <p><strong>2025年8月</strong></p>
                  </div>
                </div>
              </div>

              {/* 协议底部按钮 */}
              <div className="p-6 bg-gray-50/50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleCloseFullAgreement}
                  className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-xl
                           hover:bg-blue-700 transition-colors duration-200"
                >
                  我已了解，返回
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Register;