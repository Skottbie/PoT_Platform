// src/components/ProtectedLayout.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import Navbar from './Navbar';

const ProtectedLayout = ({ children }) => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get('/user/profile');
        setUser(res.data);
      } catch (err) {
        navigate('/'); // token 失效或未登录
      }
    };
    fetchUser();
  }, [navigate]);

  if (!user) return <div className="p-6 text-center text-gray-600">验证身份中...</div>;

  return (
    <div>
      <Navbar user={user} />
      <div className="p-4">{children}</div>
    </div>
  );
};

export default ProtectedLayout;
