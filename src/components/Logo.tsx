import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

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

  const imgSizes = {
    sm: 'h-12 md:h-14',
    md: 'h-18 md:h-22',
    lg: 'h-28 md:h-32',
    xl: 'h-40 md:h-48'
  };

  const textSizes = {
    sm: 'text-sm md:text-base tracking-[0.15em]',
    md: 'text-lg md:text-xl tracking-[0.2em]',
    lg: 'text-2xl md:text-3xl tracking-[0.25em]',
    xl: 'text-3xl md:text-4xl tracking-[0.3em]'
  };

  if (logoUrl) {
    return (
      <div className={`flex flex-col items-center select-none ${className}`}>
        <motion.img 
          src={logoUrl} 
          alt="Em-erald Interiors Logo"
          className={`${imgSizes[size]} object-contain`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          key={logoUrl}
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  // Fallback to elegant typographic branding since the pre-loaded image is removed
  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      <motion.div 
        className={`${textSizes[size]} font-serif text-emerald uppercase font-bold flex items-center gap-1`}
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <span>Em</span>
        <span className="text-terracotta italic font-normal lowercase">-erald</span>
      </motion.div>
    </div>
  );
}


