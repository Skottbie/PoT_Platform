// client/src/components/ResponsiveNavbar.jsx - 更新版本

import { useState, useEffect } from 'react';
import Navbar from './Navbar';
import MobileNavbar from './MobileNavbar';

const ResponsiveNavbar = ({ user, onUserUpdate }) => {
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
    <MobileNavbar user={user} onUserUpdate={onUserUpdate} />
  ) : (
    <Navbar user={user} onUserUpdate={onUserUpdate} />
  );
};

export default ResponsiveNavbar;