import { motion } from 'motion/react';
import { Sparkles, Layout, Search, Droplet, Lightbulb, Palette, HelpCircle } from 'lucide-react';
import { ServiceDocument } from '../lib/firebase';

const ICONS_MAP: Record<string, any> = {
  Sparkles,
  Layout,
  Search,
  Droplet,
  Lightbulb,
  Palette
};

interface ServicesProps {
  services: ServiceDocument[];
  onSelectService: (serviceTitle: string) => void;
}

export function Services({ services, onSelectService }: ServicesProps) {
  
  const handleServiceClick = (title: string) => {
    onSelectService(title);
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="services" className="py-20 md:py-32 px-4 md:px-12 lg:px-24 bg-cream">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 md:mb-20 text-left"
        >
          <span className="text-emerald/40 font-medium tracking-[0.2em] text-[8px] md:text-[10px] uppercase block mb-6">
            Our Services
          </span>
          <h2 className="text-4xl sm:text-6xl md:text-7xl font-serif text-emerald leading-tight mb-8">
            Timeless craft, <br />
            <span className="italic text-terracotta">tailored for you.</span>
          </h2>
          <p className="text-emerald/60 max-w-xl text-base md:text-lg leading-relaxed">
            Click on any service option to pre-arrange a custom inquiry loop inside our project intake desk below.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {services.map((service, i) => {
            const IconComponent = ICONS_MAP[service.icon] || HelpCircle;
            
            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                onClick={() => handleServiceClick(service.title)}
                className="bg-white/40 p-8 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border border-emerald/5 hover:bg-white transition-all duration-500 group cursor-pointer hover:shadow-xl hover:shadow-emerald/5"
                id={`service-card-${i}`}
              >
                <div className="w-12 h-12 bg-emerald/5 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-emerald/10 transition-colors">
                  <IconComponent className="text-emerald/60 text-emerald" size={20} />
                </div>
                <h3 className="text-2xl font-bold text-emerald mb-4 tracking-tight capitalize">
                  {service.title}
                </h3>
                <p className="text-emerald/50 leading-relaxed text-sm font-medium">
                  {service.desc}
                </p>
                
                <div className="mt-8 flex items-center gap-1.5 text-xs font-bold text-terracotta/75 group-hover:text-terracotta transition-colors">
                  <span>Enquire Service</span>
                  <span className="block transform translate-x-0 group-hover:translate-x-1.5 transition-transform">→</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
