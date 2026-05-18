import { motion } from 'motion/react';
import { Phone, Star, Clock } from 'lucide-react';
import { Logo } from './Logo';

export function Hero() {
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="main-hero" className="relative min-h-screen w-full flex flex-col px-4 md:px-12 lg:px-24 bg-cream overflow-hidden">
      {/* Navigation Header */}
      <header className="flex justify-between items-center py-8">
        <Logo size="md" />
        
        <nav className="hidden md:flex items-center gap-10 text-emerald/70 text-sm font-medium">
          <button onClick={() => scrollToSection('services')} className="hover:text-emerald transition-colors">Services</button>
          <button onClick={() => scrollToSection('gallery')} className="hover:text-emerald transition-colors">Portfolio</button>
          <button onClick={() => scrollToSection('reviews')} className="hover:text-emerald transition-colors">Reviews</button>
          <button onClick={() => scrollToSection('contact')} className="hover:text-emerald transition-colors">Contact</button>
        </nav>

        <a href="tel:0727827033" className="hidden lg:flex items-center gap-2 bg-emerald text-cream px-6 py-3 rounded-full text-sm font-bold shadow-lg shadow-emerald/20">
          <Phone size={16} /> 0727 827033
        </a>
      </header>

      {/* Hero Content Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-12 py-12 md:py-20 items-center">
        {/* Left Side: Copy */}
        <div className="lg:col-span-7">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-emerald/5 mb-8">
              <div className="w-2 h-2 bg-emerald-vibrant rounded-full animate-pulse" />
              <span className="text-[10px] font-bold tracking-[0.1em] text-emerald/60 uppercase">Interior Design Studio</span>
            </div>
            
            <h1 className="text-4xl sm:text-6xl md:text-8xl font-serif text-emerald leading-[0.9] mb-8">
              A home that <br />
              feels like <span className="text-terracotta italic">you.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-emerald/70 max-w-lg leading-relaxed mb-12">
              Em–erald Interiors creates warm, considered spaces for homes and businesses — from full-service design to styling, painting and space planning. Thoughtful design, rooted in what matters.
            </p>

            <div className="flex flex-wrap items-center gap-8 mb-16">
              <div className="flex flex-col gap-2">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="text-terracotta fill-terracotta" size={14} />
                  ))}
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald/60">
                  <span>4.9</span>
                  <span className="opacity-50">• 9 Google reviews</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-emerald/60">
                <Clock size={14} className="text-emerald/40" />
                <span>Open now • until 5:30 PM</span>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 pt-8 border-t border-emerald/10">
              <div>
                <div className="text-2xl sm:text-3xl font-serif text-emerald font-bold">10+</div>
                <div className="text-[9px] sm:text-[10px] font-bold tracking-widest text-emerald/40 uppercase">Years of Craft</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-serif text-emerald font-bold">100%</div>
                <div className="text-[9px] sm:text-[10px] font-bold tracking-widest text-emerald/40 uppercase">Bespoke to you</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-serif text-emerald font-bold">End-to-end</div>
                <div className="text-[9px] sm:text-[10px] font-bold tracking-widest text-emerald/40 uppercase">Full-Service</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Side: Form / Visual Card */}
        <div className="lg:col-span-5 relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-white/80 backdrop-blur-md p-6 sm:p-10 rounded-[2.5rem] md:rounded-[3rem] shadow-2xl border border-white relative z-10"
          >
            <h3 className="text-3xl font-serif text-emerald mb-4">
              Let's create something <br />
              <span className="text-terracotta italic">beautiful together</span>
            </h3>
            <p className="text-sm text-emerald/60 mb-8">
              Tell us about your project — we'll be in touch shortly.
            </p>

            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-2 gap-4">
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
                className="w-full bg-terracotta text-cream py-5 rounded-full font-bold tracking-widest flex items-center justify-center gap-2 hover:bg-terracotta-soft transition-colors shadow-xl shadow-terracotta/20 mt-4"
              >
                Send Message →
              </button>
              <p className="text-[10px] text-center text-emerald/40 mt-4 italic">
                We respect your privacy. No spam, ever.
              </p>
            </form>
          </motion.div>

          {/* Decorative Background for Image */}
          <div className="absolute -top-10 -right-10 w-[120%] h-[110%] -z-0 opacity-20 pointer-events-none">
             <img src="/src/assets/images/serene_bedroom_1779090868311.png" className="w-full h-full object-cover rounded-[4rem]" alt="" />
          </div>
        </div>
      </div>
    </section>
  );
}
