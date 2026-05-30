import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Phone, Instagram, Clock, CheckCircle } from 'lucide-react';
import { Logo } from './Logo';
import { SiteConfigDocument, ServiceDocument, submitContactMessage } from '../lib/firebase';

interface ContactProps {
  config: SiteConfigDocument | null;
  services: ServiceDocument[];
  selectedService: string;
  setSelectedService: (service: string) => void;
}

export function Contact({ config, services, selectedService, setSelectedService }: ContactProps) {
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // Sync internal state to props selection
  const [localService, setLocalService] = useState(selectedService);

  useEffect(() => {
    setLocalService(selectedService);
  }, [selectedService]);

  const currentPhone = config?.contactPhone || "0727 827033";
  const currentInstagram = config?.contactInstagram || "@em_eraldinteriors";
  const currentHours = config?.contactOpeningHours || "Open today • closes 5:30 PM";
  const whatsappNumber = config?.whatsappNumber || "254727827033";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message || !localService) {
      alert("Please fill in all details before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      await submitContactMessage({
        ...formData,
        service: localService
      });
      setDone(true);

      const textMessage = `Hello Em-erald Interiors, my name is ${formData.name}. I would like to enquire about your "${localService}" service package. Here are my details: Email: ${formData.email}, Phone: ${formData.phone}. Space details: "${formData.message}"`;
      
      // Delay slightly for the success checkmark transition, then trigger WhatsApp
      setTimeout(() => {
        window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(textMessage)}`, '_blank');
      }, 1000);

      setFormData({ name: '', phone: '', email: '', message: '' });
    } catch (err) {
      console.error(err);
      alert("Unable to transmit message. Please review your network or try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-20 md:py-32 px-4 md:px-12 lg:px-24 bg-cream">
      <div className="max-w-7xl mx-auto">
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
          <div className="lg:w-1/2 flex flex-col justify-center relative z-10 select-none">
            <span className="text-white/40 font-medium tracking-[0.2em] text-[8px] md:text-[10px] uppercase block mb-8">
              {config?.contactSubtitle || "Ready when you are"}
            </span>
            <h2 className="text-4xl sm:text-6xl lg:text-7xl font-serif text-cream leading-tight mb-8">
              {config?.contactTitleLine1 || "Let's design a space that"} <span className="italic text-white/60">{config?.contactTitleItalic || "finally feels like home."}</span>
            </h2>
            <p className="text-cream/60 max-w-md text-base md:text-lg leading-relaxed mb-10 md:mb-12">
              {config?.contactParagraph || "Whether you're styling a single room or transforming a whole property — we'd love to hear about it."}
            </p>
            
            <div className="space-y-6">
              <a href={`tel:${currentPhone.replace(/\s+/g, '')}`} className="flex items-center gap-4 text-cream/90 group cursor-pointer block">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-white/20 transition-colors">
                  <Phone size={16} />
                </div>
                <span className="font-medium hover:underline">{currentPhone}</span>
              </a>
              <a href="#" className="flex items-center gap-4 text-cream/90 group cursor-pointer block">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-white/20 transition-colors">
                  <Instagram size={16} />
                </div>
                <span className="font-medium hover:underline">{currentInstagram}</span>
              </a>
              <div className="flex items-center gap-4 text-cream/90">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                  <Clock size={16} />
                </div>
                <span className="font-medium tracking-tight">{currentHours}</span>
              </div>
            </div>
          </div>

          {/* Right Side Intake Form */}
          <div className="lg:w-1/2 relative z-10" id="contact-intake">
            <div className="bg-white p-8 md:p-12 rounded-[2rem] md:rounded-[2.5rem] shadow-xl">
              {done ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-24 select-none"
                >
                  <div className="w-16 h-16 rounded-full bg-emerald/10 text-emerald flex items-center justify-center mx-auto mb-6">
                    <CheckCircle size={28} />
                  </div>
                  <h3 className="text-3xl font-serif text-emerald mb-2">Message Sent</h3>
                  <p className="text-xs text-emerald/50 max-w-xs mx-auto mb-8 font-medium">
                    Your inquiry details are successfully logged in our systems. Directing you to WhatsApp to start your real-time styling loop...
                  </p>
                  <button 
                    onClick={() => setDone(false)}
                    className="text-xs text-terracotta border-b border-terracotta/40 font-bold hover:text-terracotta-soft transition-colors cursor-pointer"
                  >
                    Submit another project request
                  </button>
                </motion.div>
              ) : (
                <>
                  <h3 className="text-2xl md:text-3xl font-serif text-emerald mb-4 select-none">Start your project</h3>
                  <p className="text-xs md:text-sm text-emerald/50 mb-8 font-medium select-none">We typically reply within one working day.</p>
                  
                  <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input 
                        type="text" 
                        required
                        placeholder="Full name" 
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-cream/50 border-none rounded-2xl px-5 py-4 focus:ring-1 focus:ring-terracotta outline-none transition-all placeholder:text-emerald/30 text-sm"
                      />
                      <input 
                        type="tel" 
                        required
                        placeholder="Phone" 
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full bg-cream/50 border-none rounded-2xl px-5 py-4 focus:ring-1 focus:ring-terracotta outline-none transition-all placeholder:text-emerald/30 text-sm"
                      />
                    </div>
                    <input 
                      type="email" 
                      required
                      placeholder="Email address" 
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-cream/50 border-none rounded-2xl px-5 py-4 focus:ring-1 focus:ring-terracotta outline-none transition-all placeholder:text-emerald/30 text-sm"
                    />
                    
                    {/* Dynamic service pre-fill and manual dropdown adjust option */}
                    <div>
                      <span className="text-[9px] font-bold text-emerald/40 tracking-wider block uppercase mb-1.5 select-none">Service requirements</span>
                      <select 
                        required
                        value={localService}
                        onChange={(e) => {
                          setLocalService(e.target.value);
                          setSelectedService(e.target.value);
                        }}
                        className="w-full bg-cream/50 border-none rounded-2xl px-5 py-4 focus:ring-1 focus:ring-terracotta outline-none transition-all text-emerald text-sm font-bold capitalize select-none"
                      >
                        <option value="">Select service requested...</option>
                        {services.map((item) => (
                          <option key={item.id} value={item.title}>
                            {item.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <textarea 
                      rows={4} 
                      required
                      placeholder="Tell us about your space..." 
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full bg-cream/50 border-none rounded-2xl px-5 py-3.5 focus:ring-1 focus:ring-terracotta outline-none transition-all placeholder:text-emerald/30 text-sm resize-none"
                    ></textarea>
                    
                    <button 
                      type="submit" 
                      disabled={submitting}
                      className="w-full bg-terracotta text-cream py-5 rounded-2xl font-bold tracking-widest flex items-center justify-center gap-2 hover:bg-terracotta-soft transition-colors shadow-xl shadow-terracotta/20 mt-4 cursor-pointer"
                    >
                      {submitting ? "Logging Message..." : "Send Message →"}
                    </button>
                    <div className="flex justify-center items-center gap-2 mt-6">
                       <div className="w-4 h-4 bg-emerald/5 rounded-full flex items-center justify-center">
                         <div className="w-1.5 h-1.5 bg-emerald/40 rounded-full" />
                       </div>
                       <p className="text-[10px] text-emerald/40 italic select-none">
                        We respect your privacy. No spam, ever.
                      </p>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="bg-cream py-12 md:py-16 px-4 md:px-12 lg:px-24 border-t border-emerald/5 select-none">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 md:gap-10">
        <Logo size="sm" />
        
        <p className="text-emerald/40 text-[9px] md:text-[10px] font-bold tracking-widest text-center md:text-left">
          © 2026 EM-ERALD INTERIORS. CRAFTED WITH CARE.
        </p>
        
        <div className="flex flex-wrap justify-center gap-6 md:gap-8 text-emerald/70 text-[9px] font-bold tracking-[0.2em] uppercase">
          <a href="#" className="flex items-center gap-2 hover:text-terracotta transition-colors">
            © OWNERS ONLY
          </a>
        </div>
      </div>
    </footer>
  );
}
