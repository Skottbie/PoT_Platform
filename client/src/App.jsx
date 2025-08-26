import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import OnboardingEntrance from './pages/OnboardingEntrance'; // 🆕 新增引导入口页面
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import SubmitTask from './pages/SubmitTask';
import TeacherTaskSubmissions from './pages/TeacherTaskSubmissions';
import CreateClass from './pages/CreateClass';
import StudentJoinClass from './pages/StudentJoinClass';
import MyClasses from './pages/MyClasses';
import ClassStudents from './pages/ClassStudents';
import JoinClass from './pages/JoinClass';
import ProtectedLayout from './components/ProtectedLayout';
import { useState, useEffect } from 'react';
import FeedbackWidget from './components/FeedbackWidget';
import ClassSubmissionStatus from './pages/ClassSubmissionStatus';
import EditClassStudents from './pages/EditClassStudents';
import ClassHistory from './pages/ClassHistory';
import ViewSubmission from './pages/ViewSubmission';
import UserProfile from './pages/UserProfile'; // 🆕 导入用户设置页面
import Footer from './components/Footer';
import { ThemeProvider } from './contexts/ThemeContext'; // 🆕 导入主题提供者

import Test from './Test'; // 导入测试组件

function App() {
  const [hideFeedback, setHideFeedback] = useState(false);
  useEffect(() => {
    const handler = () => {
      setHideFeedback(localStorage.getItem('hideFeedback') === '1');
    };
    window.addEventListener('toggleFeedback', handler);
    handler(); // 初始化同步
    return () => window.removeEventListener('toggleFeedback', handler);
  }, []);
  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen flex flex-col"> 
          <div className="flex-1"> 
            <Routes>
              {/* 🆕 引导流程路由 */}
              <Route path="/" element={<OnboardingEntrance />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* 现有的功能路由 */}
              <Route path="/teacher" element={<ProtectedLayout><TeacherDashboard /></ProtectedLayout>} />
              <Route path="/student" element={<ProtectedLayout><StudentDashboard /></ProtectedLayout>} />
              <Route path="/submit/:taskId" element={<SubmitTask />} />
              <Route path="/task/:taskId/submissions" element={<TeacherTaskSubmissions />} />
              <Route path="/create-class" element={<CreateClass />} />
              <Route path="/student/join" element={<StudentJoinClass />} />
              <Route path="/my-classes" element={<MyClasses />} />
              <Route path="/class/:classId/students" element={<ClassStudents />} />
              <Route path="/join-class" element={<JoinClass />} />
              <Route path="/task/:taskId/class-status" element={<ClassSubmissionStatus />} />
              <Route path="/class/:classId/edit-students" element={<EditClassStudents />} />
              <Route path="/class/:classId/history" element={<ClassHistory />} />
              <Route path="/view-submission/:taskId" element={<ViewSubmission />} />
              
              {/* 🆕 用户设置页面路由 */}
              <Route path="/user-profile" element={<ProtectedLayout><UserProfile /></ProtectedLayout>} />

              <Route path="/test" element={<Test />} />
            </Routes>
          </div>
          <Footer />
        </div>
        {!hideFeedback && <FeedbackWidget />}
      </Router>
    </ThemeProvider>
  );
}

export default App;