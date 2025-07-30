import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
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

import FeedbackWidget from './components/FeedbackWidget';


import Test from './Test'; // 导入测试组件


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/teacher" element={<ProtectedLayout><TeacherDashboard /></ProtectedLayout>} />
        <Route path="/student" element={<ProtectedLayout><StudentDashboard /></ProtectedLayout>} />
        <Route path="/submit/:taskId" element={<SubmitTask />} />
        <Route path="/task/:taskId/submissions" element={<TeacherTaskSubmissions />} />
        <Route path="/create-class" element={<CreateClass />} />

        <Route path="/student/join" element={<StudentJoinClass />} />
        <Route path="/my-classes" element={<MyClasses />} />
        <Route path="/class/:classId/students" element={<ClassStudents />} />
        <Route path="/join-class" element={<JoinClass />} />


        <Route path="/test" element={<Test />} />
      </Routes>
      <FeedbackWidget />
    </Router>
  );
}

export default App;
