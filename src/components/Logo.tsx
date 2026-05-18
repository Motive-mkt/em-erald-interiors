import { motion } from 'motion/react';

interface LogoProps {
  className?: string;
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Logo({ className = '', variant = 'dark', size = 'md' }: LogoProps) {
  const isDark = variant === 'dark';
  const color = isDark ? 'text-emerald' : 'text-cream';
  
  const sizes = {
    sm: { main: 'text-sm', sub: 'text-[7px]' },
    md: { main: 'text-xl', sub: 'text-[9px]' },
    lg: { main: 'text-4xl', sub: 'text-xs' },
    xl: { main: 'text-6xl', sub: 'text-base' }
  };

  const s = sizes[size];

  return (
    <div className={`flex flex-col items-center select-none text-center ${className}`}>
      <span className={`font-serif font-bold tracking-[0.1em] uppercase ${color} leading-none ${s.main}`}>
        Em–erald
      </span>
      <div className={`w-full h-px opacity-20 my-1 md:my-2 ${isDark ? 'bg-emerald' : 'bg-cream'}`} />
      <span className={`tracking-[0.4em] uppercase opacity-70 font-medium ${color} ${s.sub}`}>
        Interiors
      </span>
    </div>
  );
}
