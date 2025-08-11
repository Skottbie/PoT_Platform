// src/components/ResponsiveNavbar.jsx - 响应式导航容器
import { useState, useEffect } from 'react';
import Navbar from './Navbar';
import MobileNavbar from './MobileNavbar';

const ResponsiveNavbar = ({ user }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return isMobile ? (
    <MobileNavbar user={user} />
  ) : (
    <Navbar user={user} />
  );
};

export default ResponsiveNavbar;