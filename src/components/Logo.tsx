import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import logoImg from '../assets/images/business_logo_png_1779092570942.png';

interface LogoProps {
  className?: string;
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Logo({ className = '', size = 'md' }: LogoProps) {
  const [logoUrl, setLogoUrl] = useState<string>('');

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "config", "general"), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data && data.logoUrl) {
          setLogoUrl(data.logoUrl);
        } else {
          setLogoUrl('');
        }
      }
    });
    return () => unsub();
  }, []);

  const sizes = {
    sm: 'h-16 md:h-18',
    md: 'h-24 md:h-28',
    lg: 'h-36 md:h-44',
    xl: 'h-48 md:h-56'
  };

  const currentSizeClass = sizes[size];
  const urlToRender = logoUrl || logoImg;

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      <motion.img 
        src={urlToRender} 
        alt="Em-erald Interiors Logo"
        className={`${currentSizeClass} object-contain mix-blend-multiply`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        key={urlToRender}
        referrerPolicy="no-referrer"
      />
    </div>
  );
}

