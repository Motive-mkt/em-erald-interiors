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
  // Synchronously initialize the logo from the local cache to prevent delay/flicker
  const [logoUrl, setLogoUrl] = useState<string>(() => {
    try {
      return localStorage.getItem('cached_emerald_logo_url') || '';
    } catch {
      return '';
    }
  });

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "site_config", "appearance"), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data && data.logo_url !== logoUrl) {
          const freshLogo = data.logo_url || '';
          setLogoUrl(freshLogo);
          try {
            if (freshLogo) {
              localStorage.setItem('cached_emerald_logo_url', freshLogo);
            } else {
              localStorage.removeItem('cached_emerald_logo_url');
            }
          } catch (e) {
            console.error('Error writing logo to local storage:', e);
          }
        }
      } else {
        setLogoUrl('');
        try {
          localStorage.removeItem('cached_emerald_logo_url');
        } catch {}
      }
    });
    return () => unsub();
  }, [logoUrl]);

  const imgSizes = {
    sm: 'h-12 md:h-14',
    md: 'h-18 md:h-22',
    lg: 'h-28 md:h-32',
    xl: 'h-40 md:h-48'
  };

  if (!logoUrl) {
    return null;
  }

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      <motion.img 
        src={logoUrl} 
        alt="Logo"
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


