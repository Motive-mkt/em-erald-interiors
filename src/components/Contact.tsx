import { motion } from 'motion/react';
import { Phone, Instagram, Clock, Send } from 'lucide-react';
import { Logo } from './Logo';

export function Contact() {
  return (
    <section id="contact" className="py-20 md:py-32 px-4 md:px-12 lg:px-24 bg-cream">
      <div className="max-w-7xl mx-auto">
        {/* Emerald Banner CTA */}
        <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           whileInView={{ opacity: 1, scale: 1 }}
           viewport={{ once: true }}
           className="bg-emerald rounded-[2.5rem] md:rounded-[3rem] p-8 md:p-16 lg:p-20 overflow-hidden shadow-2xl flex flex-col lg:flex-row gap-12 md:gap-16 relative"
           id="contact-banner"
        >
          {/* Subtle Glow Effect from screenshot */}
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/5 to-transparent pointer-events-none" />

          {/* Left Side Pitch */}
          <div className="lg:w-1/2 flex flex-col justify-center relative z-10">
            <span className="text-white/40 font-medium tracking-[0.2em] text-[8px] md:text-[10px] uppercase block mb-8">
              Ready when you are
            </span>
            <h2 className="text-4xl sm:text-6xl lg:text-7xl font-serif text-cream leading-tight mb-8">
              Let's design a space that <span className="italic text-white/60">finally feels like home.</span>
            </h2>
            <p className="text-cream/60 max-w-md text-base md:text-lg leading-relaxed mb-10 md:mb-12">
              Whether you're styling a single room or transforming a whole property — we'd love to hear about it.
            </p>
            
            <div className="space-y-6">
              <div className="flex items-center gap-4 text-cream/90 group cursor-pointer">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-white/20 transition-colors">
                  <Phone size={16} />
                </div>
                <span className="font-medium">0727 827033</span>
              </div>
              <div className="flex items-center gap-4 text-cream/90 group cursor-pointer">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-white/20 transition-colors">
                  <Instagram size={16} />
                </div>
                <span className="font-medium">@em_eraldinteriors</span>
              </div>
              <div className="flex items-center gap-4 text-cream/90">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                  <Clock size={16} />
                </div>
                <span className="font-medium tracking-tight">Open today • closes 5:30 PM</span>
              </div>
            </div>
          </div>

          {/* Right Side Intake Form */}
          <div className="lg:w-1/2 relative z-10">
            <div className="bg-white p-8 md:p-12 rounded-[2rem] md:rounded-[2.5rem] shadow-xl">
              <h3 className="text-2xl md:text-3xl font-serif text-emerald mb-4">Start your project</h3>
              <p className="text-xs md:text-sm text-emerald/50 mb-8 font-medium">We typically reply within one working day.</p>
              
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input 
                    type="text" 
                    placeholder="Full name" 
                    className="w-full bg-cream/50 border-none rounded-2xl px-5 py-4 focus:ring-1 focus:ring-terracotta outline-none transition-all placeholder:text-emerald/30 text-sm"
                  />
                  <input 
                    type="tel" 
                    placeholder="Phone" 
                    className="w-full bg-cream/50 border-none rounded-2xl px-5 py-4 focus:ring-1 focus:ring-terracotta outline-none transition-all placeholder:text-emerald/30 text-sm"
                  />
                </div>
                <input 
                  type="email" 
                  placeholder="Email address" 
                  className="w-full bg-cream/50 border-none rounded-2xl px-5 py-4 focus:ring-1 focus:ring-terracotta outline-none transition-all placeholder:text-emerald/30 text-sm"
                />
                <textarea 
                  rows={4} 
                  placeholder="Tell us about your space..." 
                  className="w-full bg-cream/50 border-none rounded-2xl px-5 py-4 focus:ring-1 focus:ring-terracotta outline-none transition-all placeholder:text-emerald/30 text-sm resize-none"
                ></textarea>
                <button 
                  type="submit" 
                  className="w-full bg-terracotta text-cream py-5 rounded-2xl font-bold tracking-widest flex items-center justify-center gap-2 hover:bg-terracotta-soft transition-colors shadow-xl shadow-terracotta/20 mt-4"
                >
                  Send Message →
                </button>
                <div className="flex justify-center items-center gap-2 mt-6">
                   <div className="w-4 h-4 bg-emerald/5 rounded-full flex items-center justify-center">
                     <div className="w-1.5 h-1.5 bg-emerald/40 rounded-full" />
                   </div>
                   <p className="text-[10px] text-emerald/40 italic">
                    We respect your privacy. No spam, ever.
                  </p>
                </div>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="bg-cream py-12 md:py-16 px-4 md:px-12 lg:px-24">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 md:gap-10">
        <Logo size="sm" />
        
        <p className="text-emerald/40 text-[9px] md:text-[10px] font-bold tracking-widest text-center md:text-left">
          © 2026 Em-erald Interiors. Crafted with care.
        </p>
        
        <div className="flex flex-wrap justify-center gap-6 md:gap-8 text-emerald/70 text-[9px] font-bold tracking-[0.2em] uppercase">
          <a href="tel:0727827033" className="flex items-center gap-2 hover:text-terracotta transition-colors">
            <Phone size={12} /> 0727 827033
          </a>
          <a href="#" className="flex items-center gap-2 hover:text-terracotta transition-colors">
            <Instagram size={12} /> @em_eraldinteriors
          </a>
        </div>
      </div>
    </footer>
  );
}
