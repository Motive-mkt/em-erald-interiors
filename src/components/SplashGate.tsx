import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { Logo } from './Logo';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface Slide {
  url: string;
  title: string;
}

export function SplashGate() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "site_config", "appearance"), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data && data.splash_images && data.splash_images.length > 0) {
          setSlides(data.splash_images.map((url: string, idx: number) => ({
            url,
            title: `Slide Asset ${idx + 1}`
          })));
        } else {
          setSlides([]);
        }
      } else {
        setSlides([]);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (index >= slides.length) {
      setIndex(0);
    }
  }, [slides.length, index]);

  useEffect(() => {
    if (slides.length === 0) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [slides.length]);

  const enterExperience = () => {
    document.getElementById('main-hero')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative h-screen w-full bg-cream flex flex-col items-center justify-between py-8 md:py-12 overflow-hidden snap-start">
      {/* 2. The Identity (Top Center) */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        className="z-10 px-4"
      >
        <Logo size="lg" />
      </motion.div>

      {/* 3. The Cinematic Visual Showcase (Center Stage) */}
      <div className="relative w-full max-w-6xl px-4 md:px-12 h-[50vh] sm:h-[60vh] md:h-[65vh]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full h-full overflow-hidden rounded-[2.5rem] md:rounded-[4rem] shadow-2xl bg-white/50"
        >
          {slides.length > 0 ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
                className="absolute inset-0 w-full h-full"
              >
                <img
                  src={slides[index]?.url}
                  alt={slides[index]?.title || ''}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  loading="eager"
                />
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-emerald/5 via-cream/80 to-emerald/10 p-8 text-center">
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
                className="max-w-md space-y-6"
              >
                <span className="text-[10px] tracking-[0.35em] uppercase font-bold text-emerald/60 block">Welcome to</span>
                <h3 className="text-3xl md:text-5xl font-serif font-light text-emerald tracking-wide">Emerald Studio</h3>
                <div className="h-[1px] w-12 bg-emerald/20 mx-auto" />
                <p className="text-xs text-emerald/60 leading-relaxed max-w-sm mx-auto font-sans font-light">
                  No showcase images have been uploaded yet. Open the <strong className="font-semibold text-emerald">Admin Panel &gt; Appearance Settings</strong> to curate and publish your studio designs instantly.
                </p>
              </motion.div>
            </div>
          )}
          
          {/* Subtle Frame Overlays */}
          <div className="absolute inset-0 pointer-events-none border-[1px] border-white/20 rounded-[2.5rem] md:rounded-[4rem]" />
        </motion.div>
      </div>

      {/* 4. The Invitation (Bottom Center) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="z-10"
      >
        <motion.button
          onClick={enterExperience}
          animate={{
            y: [0, -6, 0],
          }}
          transition={{
            y: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="group flex flex-col items-center gap-3 cursor-pointer"
        >
          <div className="bg-emerald text-cream px-10 py-4 rounded-full font-bold tracking-[0.2em] text-xs uppercase shadow-xl shadow-emerald/10 border border-emerald/20 transition-all group-hover:bg-emerald-vibrant">
            Explore the Studio
          </div>
          <motion.div
            animate={{ y: [0, 4, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <ChevronDown size={20} className="text-emerald/40" />
          </motion.div>
        </motion.button>
      </motion.div>
    </section>
  );
}
