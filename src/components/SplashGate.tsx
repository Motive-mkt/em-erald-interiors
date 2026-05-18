import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { Logo } from './Logo';
import img1 from '../assets/images/serene_bedroom_1779090868311.png';
import img2 from '../assets/images/sage_dining_room_1779090886447.png';
import img3 from '../assets/images/modern_home_office_1779090902647.png';
import img4 from '../assets/images/kitchen_styling_1779090940250.png';

const SLIDES = [
  {
    url: img1,
    title: 'Linen Bedroom',
  },
  {
    url: img2,
    title: 'Sage Dining Room',
  },
  {
    url: img3,
    title: 'Modern Home Office',
  },
  {
    url: img4,
    title: 'Open Kitchen',
  },
];

export function SplashGate() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % SLIDES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

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
          <AnimatePresence>
            <motion.div
              key={index}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
              className="absolute inset-0 w-full h-full"
            >
              <img
                src={SLIDES[index].url}
                alt=""
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                loading="eager"
              />
            </motion.div>
          </AnimatePresence>
          
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
