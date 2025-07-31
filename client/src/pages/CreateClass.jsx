import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse'; // CSV解析库
import api from '../api/axiosInstance';

const CreateClass = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', description: '' });
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setPreviewData([]);
    setMessage('');

    if (!selectedFile) return;

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const rows = result.data;
        // 改进：确保检查的键是小写且无BOM，以匹配后端解析
        const firstRowKeys = rows.length > 0 ? Object.keys(rows[0]).map(key => key.replace(/^\uFEFF/, '').trim().toLowerCase()) : [];
        const hasRequiredFields = firstRowKeys.includes('name') && firstRowKeys.includes('studentid');

        if (!hasRequiredFields) {
          setMessage('❌ CSV文件必须包含 name 和 studentId 两列');
          return;
        }

        // 统一处理CSV数据，确保键名匹配后端预期 (无BOM，小写)
        const processedRows = rows.map(row => {
            const newRow = {};
            for (const key in row) {
                const cleanKey = key.replace(/^\uFEFF/, '').trim();
                newRow[cleanKey] = row[key];
            }
            return newRow;
        });

        setPreviewData(processedRows); // 使用处理后的数据
      },
      error: () => {
        setMessage('❌ CSV 解析失败，请检查文件格式');
      },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!form.name.trim()) return setMessage('❌ 请填写班级名称');
    if (!file) return setMessage('❌ 请上传学生名单 CSV 文件');
    if (previewData.length === 0) return setMessage('❌ 无有效学生数据');

    try {
      const data = new FormData();
      data.append('name', form.name);
      data.append('description', form.description);
      data.append('studentList', file);

      // ✅ 关键修改：将响应赋值给 res 变量
      const res = await api.post('/class/create', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // 确保后端响应的数据结构正确
      if (res.data && res.data.success) {
        setMessage(`✅ 班级创建成功，邀请码：${res.data.inviteCode}`);
        setTimeout(() => navigate('/teacher'), 2000);
      } else {
        // 后端成功响应但 success 为 false 或没有预期的 inviteCode
        setMessage(`❌ 创建失败: ${res.data.message || '未知错误'}`);
      }
      
    } catch (err) {
      console.error('前端创建班级请求出错:', err); // 增加日志以便调试
      // 尝试获取后端返回的错误信息
      const errorMessage = err.response?.data?.message || '请检查文件格式或网络连接';
      setMessage(`❌ 创建失败: ${errorMessage}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-xl mx-auto bg-white p-8 rounded-2xl shadow">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">📘 创建新班级</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block font-medium text-gray-700 mb-1">班级名称 *</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full border p-2 rounded-lg"
              placeholder="如：高一英语班A组"
              required
            />
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-1">班级描述</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="w-full border p-2 rounded-lg"
              placeholder="可选，如教学目标、备注等"
              rows={3}
            />
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-1">学生名单（CSV）*</label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="w-full p-2 border rounded-lg bg-gray-50"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              文件必须包含列 <strong>name</strong> 和 <strong>studentId</strong><br />
              示例：
              <br />
              name,studentId<br />
              张三,20230001<br />
              李四,20230002
            </p>
          </div>

          {/* ✅ CSV预览部分 */}
          {previewData.length > 0 && (
            <div className="border rounded-lg bg-gray-50 p-3 text-sm">
              <p className="font-medium mb-2 text-gray-700">👀 预览学生名单：</p>
              <div className="max-h-40 overflow-y-auto">
                <table className="w-full text-left text-xs border">
                  <thead className="bg-gray-200">
                    <tr>
                      <th className="p-1 border">姓名</th>
                      <th className="p-1 border">学号</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* 确保这里使用处理过的键名 */}
                    {previewData.map((row, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="p-1 border">{row.name}</td>
                        <td className="p-1 border">{row.studentId}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                共 {previewData.length} 条记录
              </p>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-xl shadow hover:bg-blue-700 transition-all"
          >
            ✅ 创建班级
          </button>

          {message && (
            <p
              className={`text-sm mt-2 ${
                message.startsWith('✅') ? 'text-green-600' : 'text-red-500'
              }`}
            >
              {message}
            </p>
          )}
        </form>

        <button
              onClick={() => navigate('/teacher')}
              className="bg-gray-300 text-gray-800 py-2 px-4 rounded-xl shadow hover:bg-gray-400 transition"
            >
              👈 返回仪表盘
        </button>
      </div>
    </div>
  );
};

export default CreateClass;