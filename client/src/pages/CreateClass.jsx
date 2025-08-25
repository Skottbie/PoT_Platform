//src/pages/CreateClass.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import api from '../api/axiosInstance';
import Button from '../components/Button';
import { 
  ArrowLeft, 
  BookOpen, 
  Plus, 
  Check, 
  CheckCircle, 
  AlertCircle, 
  X, 
  Lightbulb,
  FolderOpen,
  Edit3,
  Trash2,
  Eye
} from 'lucide-react';


const styles = `
  @keyframes progress {
    0% { width: 0%; opacity: 0.6; }
    50% { width: 70%; opacity: 1; }
    100% { width: 100%; opacity: 0.6; }
  }

  @keyframes shimmer {
    0% { background-position: -200px 0; }
    100% { background-position: calc(200px + 100%) 0; }
  }

  .loading-shimmer {
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
    background-size: 200px 100%;
    animation: shimmer 1.5s infinite;
  }

  .pulse-dot {
    animation: pulse-dot 1.4s ease-in-out infinite;
  }

  .pulse-dot:nth-child(2) { animation-delay: 0.2s; }
  .pulse-dot:nth-child(3) { animation-delay: 0.4s; }

  @keyframes pulse-dot {
    0%, 80%, 100% { 
      transform: scale(0.8);
      opacity: 0.5;
    }
    40% { 
      transform: scale(1);
      opacity: 1;
    }
  }
  `;



const CreateClass = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', description: '' });
  const [activeTab, setActiveTab] = useState('csv'); // 'csv' 或 'manual'
  
  // CSV上传相关状态
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);

  const [csvParsing, setCsvParsing] = useState(false);
  
  // 手动输入相关状态
  const [manualStudents, setManualStudents] = useState([
    { name: '', studentId: '' },
    { name: '', studentId: '' },
    { name: '', studentId: '' }
  ]);
  
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // CSV文件处理
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setPreviewData([]);
    setMessage('');

    if (!selectedFile) return;



    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      beforeFirstChunk: () => {
        setCsvParsing(true);
        setMessage('');
      },
      complete: (result) => {
        setCsvParsing(false);
        const rows = result.data;
        const firstRowKeys = rows.length > 0 ?
          Object.keys(rows[0]).map(key => key.replace(/^\uFEFF/, '').trim().toLowerCase()) : [];
        const hasRequiredFields = firstRowKeys.includes('name') && firstRowKeys.includes('studentid');

        if (!hasRequiredFields) {
          setMessage('CSV文件必须包含 name 和 studentId 两列');
          return;
        }

        const processedRows = rows.map(row => {
            const newRow = {};
            for (const key in row) {
                const cleanKey = key.replace(/^\uFEFF/, '').trim();
                newRow[cleanKey] = row[key];
            }
            return newRow;
        });

        setPreviewData(processedRows);
      },
      error: () => {
        setCsvParsing(false);
        setMessage('CSV 解析失败，请检查文件格式');
      },
    })
  }

  // 手动输入学生信息处理
  const updateManualStudent = (index, field, value) => {
    const newStudents = [...manualStudents];
    newStudents[index][field] = value;
    setManualStudents(newStudents);
  };

  const addStudentRow = () => {
    setManualStudents([...manualStudents, { name: '', studentId: '' }]);
  };

  const removeStudentRow = (index) => {
    if (manualStudents.length > 1) {
      const newStudents = manualStudents.filter((_, i) => i !== index);
      setManualStudents(newStudents);
    }
  };

  // 批量粘贴功能
  const handleBatchPaste = (e) => {
    const pastedText = e.clipboardData.getData('text');
    
    // 解析粘贴的数据（支持制表符分隔和换行分隔）
    const lines = pastedText.trim().split('\n');
    const newStudents = [];
    
    lines.forEach(line => {
      const parts = line.trim().split('\t');
      if (parts.length >= 2) {
        newStudents.push({
          name: parts[0].trim(),
          studentId: parts[1].trim()
        });
      } else if (parts.length === 1 && parts[0].trim()) {
        // 如果只有一列，假设是姓名，学号留空
        newStudents.push({
          name: parts[0].trim(),
          studentId: ''
        });
      }
    });

    if (newStudents.length > 0) {
      // 替换当前的学生列表，但保持至少3行
      const finalStudents = newStudents.length >= 3 
        ? newStudents 
        : [...newStudents, ...Array(3 - newStudents.length).fill({ name: '', studentId: '' })];
      
      setManualStudents(finalStudents);
      setMessage(`✅ 已粘贴 ${newStudents.length} 条学生信息`);
      
      // 3秒后清除提示
      setTimeout(() => setMessage(''), 3000);
    }
  };

  // 验证手动输入的学生数据
  const validateManualStudents = () => {
    const validStudents = manualStudents.filter(s => s.name.trim() && s.studentId.trim());
    
    if (validStudents.length === 0) {
      return { isValid: false, message: '❌ 请至少输入一个学生的姓名和学号' };
    }

    // 检查学号重复
    const studentIds = validStudents.map(s => s.studentId.trim());
    const duplicateIds = studentIds.filter((id, index) => studentIds.indexOf(id) !== index);
    
    if (duplicateIds.length > 0) {
      return { isValid: false, message: `❌ 学号重复：${[...new Set(duplicateIds)].join(', ')}` };
    }

    return { isValid: true, students: validStudents };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!form.name.trim()) return setMessage('请填写班级名称');

    let studentsData = [];

    if (activeTab === 'csv') {
      if (!file) return setMessage('请上传学生名单 CSV 文件');
      if (previewData.length === 0) return setMessage('无有效学生数据');
      studentsData = previewData;
    } else {
      const validation = validateManualStudents();
      if (!validation.isValid) return setMessage(validation.message);
      studentsData = validation.students;
    }

    // 开始提交流程
    setIsSubmitting(true);
    
    try {
      const data = new FormData();
      data.append('name', form.name);
      data.append('description', form.description);

      if (activeTab === 'csv') {
        // CSV模式：上传文件
        data.append('studentList', file);
      } else {
        // 手动模式：创建CSV格式的Blob并上传
        const csvContent = 'name,studentId\n' + 
          studentsData.map(s => `"${s.name}","${s.studentId}"`).join('\n');
        const csvBlob = new Blob([csvContent], { type: 'text/csv' });
        data.append('studentList', csvBlob, 'manual_students.csv');
      }

      const res = await api.post('/class/create', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data && res.data.success) {
        setMessage(`班级创建成功，邀请码：${res.data.inviteCode}`);
        setTimeout(() => navigate('/teacher'), 2000);
      } else {
        setMessage(`创建失败: ${res.data.message || '未知错误'}`);
      }
      
    } catch (err) {
      console.error('前端创建班级请求出错:', err);
      const errorMessage = err.response?.data?.message || '请检查网络连接';
      setMessage(`创建失败: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 获取有效学生数量
  const getValidStudentCount = () => {
    if (activeTab === 'csv') {
      return previewData.length;
    } else {
      return manualStudents.filter(s => s.name.trim() && s.studentId.trim()).length;
    }
  };

    useEffect(() => {
      const styleSheet = document.createElement("style");
      styleSheet.type = "text/css";
      styleSheet.innerText = styles;
      document.head.appendChild(styleSheet);
      
      return () => {
        document.head.removeChild(styleSheet);
      };
    }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4 transition-colors duration-300">
      <div className="relative max-w-4xl mx-auto bg-white dark:bg-gray-800 
                      p-8 rounded-2xl shadow-lg transition-colors duration-300">

        {/* 返回仪表盘按钮 */}
        <div className="flex justify-end mb-4 md:absolute md:top-4 md:right-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/teacher')}
            className="w-full md:w-auto flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            返回仪表盘
          </Button>
        </div>

        <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100 flex items-center gap-3">
          <BookOpen className="w-7 h-7 text-blue-600 dark:text-blue-400" />
          创建新班级
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 班级基本信息 */}
          <div className="space-y-4">
            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-200 mb-1">
                班级名称 *
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full border border-gray-300 dark:border-gray-600
                          rounded-lg bg-white/70 dark:bg-gray-700/70
                          text-gray-900 dark:text-gray-100 p-3
                          backdrop-blur-sm shadow-sm
                          transition-colors duration-300"
                placeholder="如：高一英语班A组"
                required
              />
            </div>

            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-200 mb-1">
                班级描述
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                className="w-full border border-gray-300 dark:border-gray-600
                          rounded-lg bg-white/70 dark:bg-gray-700/70
                          text-gray-900 dark:text-gray-100 p-3
                          backdrop-blur-sm shadow-sm
                          transition-colors duration-300"
                placeholder="可选，如教学目标、备注等"
                rows={3}
              />
            </div>
          </div>

          {/* 学生信息录入方式选择 */}
          <div>
            <label className="block font-medium text-gray-700 dark:text-gray-200 mb-3">
              学生信息录入方式 *
            </label>
            
            {/* Tab切换 */}
            <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg mb-4">
              <button
                type="button"
                onClick={() => setActiveTab('csv')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  activeTab === 'csv'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                <FolderOpen className="w-4 h-4" />
                CSV文件
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('manual')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  activeTab === 'manual'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                <Edit3 className="w-4 h-4" />
                手动输入
              </button>
            </div>

            {/* CSV上传模式 */}
            {activeTab === 'csv' && (
              <div className="space-y-4">
                <div>
                  <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                      disabled={csvParsing}
                      className={`w-full border border-gray-300 dark:border-gray-600
                                rounded-lg bg-white/70 dark:bg-gray-700/70
                                text-gray-900 dark:text-gray-100 p-3
                                backdrop-blur-sm shadow-sm
                                transition-colors duration-300
                                ${csvParsing ? 'opacity-50 cursor-not-allowed loading-shimmer' : ''}`}
                      required={activeTab === 'csv'}
                    />

                    {csvParsing && (
                      <div className="flex items-center justify-center gap-2 mt-2 text-sm text-blue-600 dark:text-blue-400">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-current rounded-full pulse-dot"></div>
                          <div className="w-2 h-2 bg-current rounded-full pulse-dot"></div>
                          <div className="w-2 h-2 bg-current rounded-full pulse-dot"></div>
                        </div>
                        <span>解析CSV文件中...</span>
                      </div>
                    )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    文件必须包含列 <strong>name</strong> 和 <strong>studentId</strong><br />
                    示例：name,studentId<br />
                    张三,20230001<br />
                    李四,20230002
                  </p>
                </div>

                {/* CSV预览 */}
                {previewData.length > 0 && (
                  <div className="border border-gray-300 dark:border-gray-600
                                rounded-2xl bg-white/60 dark:bg-gray-800/60
                                backdrop-blur-xl p-4 text-sm transition-colors duration-300">
                    <p className="font-medium mb-3 text-gray-700 dark:text-gray-200 flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      预览学生名单：
                    </p>
                    <div className="max-h-48 overflow-y-auto rounded-xl shadow-inner">
                      <table className="w-full text-left text-xs rounded-xl border border-gray-200 dark:border-gray-600">
                        <thead className="bg-gray-200/80 dark:bg-gray-600/80 text-gray-700 dark:text-gray-100">
                          <tr>
                            <th className="p-2 border border-gray-200 dark:border-gray-600">序号</th>
                            <th className="p-2 border border-gray-200 dark:border-gray-600">姓名</th>
                            <th className="p-2 border border-gray-200 dark:border-gray-600">学号</th>
                          </tr>
                        </thead>
                        <tbody>
                          {previewData.map((row, idx) => (
                            <tr key={idx} className="hover:bg-gray-100/70 dark:hover:bg-gray-600/70 transition-colors duration-200">
                              <td className="p-2 border border-gray-200 dark:border-gray-600">{idx + 1}</td>
                              <td className="p-2 border border-gray-200 dark:border-gray-600">{row.name}</td>
                              <td className="p-2 border border-gray-200 dark:border-gray-600">{row.studentId}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      共 {previewData.length} 条记录
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 手动输入模式 */}
            {activeTab === 'manual' && (
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                  <p className="text-sm text-blue-700 dark:text-blue-300 flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>批量粘贴提示：</strong>您可以从Excel复制学生信息，然后在表格中按 Ctrl+V 粘贴。
                      <br />支持格式：姓名和学号用制表符分隔，每行一个学生。
                    </span>
                  </p>
                </div>

                <div className="border border-gray-300 dark:border-gray-600 rounded-xl overflow-hidden">
                  <div 
                    className="bg-white dark:bg-gray-800"
                    onPaste={handleBatchPaste}
                  >
                    {/* 桌面端表格布局 */}
                    <div className="hidden md:block">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-200 w-16">序号</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-200">姓名 *</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-200">学号 *</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-200 w-20">操作</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                          {manualStudents.map((student, index) => (
                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                              <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                {index + 1}
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  type="text"
                                  value={student.name}
                                  onChange={(e) => updateManualStudent(index, 'name', e.target.value)}
                                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm
                                            bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                                            focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="学生姓名"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  type="text"
                                  value={student.studentId}
                                  onChange={(e) => updateManualStudent(index, 'studentId', e.target.value)}
                                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm
                                            bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                                            focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="学号"
                                />
                              </td>
                              <td className="px-4 py-3">
                                {manualStudents.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeStudentRow(index)}
                                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center aigc-native-button"
                                    title="删除学生"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* 移动端卡片布局 */}
                    <div className="md:hidden space-y-3 p-4">
                      {manualStudents.map((student, index) => (
                        <div key={index} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              第 {index + 1} 位学生
                            </span>
                            {manualStudents.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeStudentRow(index)}
                                    className=" text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center aigc-native-button"
                                    title="删除学生"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                            )}
                          </div>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                学生姓名 *
                              </label>
                              <input
                                type="text"
                                value={student.name}
                                onChange={(e) => updateManualStudent(index, 'name', e.target.value)}
                                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm
                                          bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                                          focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="请输入学生姓名"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                学号 *
                              </label>
                              <input
                                type="text"
                                value={student.studentId}
                                onChange={(e) => updateManualStudent(index, 'studentId', e.target.value)}
                                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm
                                          bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                                          focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="请输入学号"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={addStudentRow}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    添加学生
                  </Button>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    有效学生数量：{getValidStudentCount()}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 创建按钮 */}
          <Button
            type="submit"
            variant="primary"
            size="md"
            fullWidth
            disabled={isSubmitting}
            className="flex items-center justify-center gap-2 relative overflow-hidden"
          >
            {isSubmitting ? (
              <>
                <div className="flex items-center gap-2">
                  <svg 
                    className="animate-spin w-5 h-5" 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24"
                  >
                    <circle 
                      className="opacity-25" 
                      cx="12" 
                      cy="12" 
                      r="10" 
                      stroke="currentColor" 
                      strokeWidth="4"
                    />
                    <path 
                      className="opacity-75" 
                      fill="currentColor" 
                      d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>创建中...</span>
                </div>
                {/* 进度条动画 */}
                <div className="absolute bottom-0 left-0 h-1 bg-white/30 animate-pulse" 
                    style={{
                      width: '100%',
                      animation: 'progress 2s ease-in-out infinite'
                    }} 
                />
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                创建班级
              </>
            )}
          </Button>

          {message && (
            <div className={`text-sm mt-3 p-3 rounded-lg flex items-start gap-2 ${
              message.includes('成功') || message.includes('已粘贴')
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700' 
                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700'
            }`}>
              {message.includes('成功') || message.includes('已粘贴') ? (
                <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              )}
              <span>{message}</span>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default CreateClass;