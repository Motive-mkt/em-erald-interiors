import { motion } from 'motion/react';
import { Home, Briefcase, Paintbrush, Ruler, Sparkles, Layout } from 'lucide-react';

const SERVICES = [
  {
    title: 'Residential Design',
    desc: 'Homes that hold your story — from first sketch to last styled shelf.',
    icon: Home,
  },
  {
    title: 'Office & Commercial',
    desc: 'Workspaces that look beautiful and work harder for your team.',
    icon: Briefcase,
  },
  {
    title: 'Decoration & Styling',
    desc: 'The finishing layer — fabrics, art, objects, light. The soul of a room.',
    icon: Paintbrush,
  },
  {
    title: 'Interior Painting',
    desc: 'Considered colour, flawless finish. Walls that set the whole mood.',
    icon: Sparkles,
  },
  {
    title: 'Space Planning',
    desc: 'Layouts that flow naturally and use every metre with intention.',
    icon: Layout,
  },
  {
    title: 'Full-Service Solutions',
    desc: 'Hand it all to us. We design, source, manage and deliver — end to end.',
    icon: Ruler,
  },
];

export function Services() {
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
            Everything your space needs, <br />
            <span className="italic text-terracotta">under one roof.</span>
          </h2>
          <p className="text-emerald/60 max-w-xl text-base md:text-lg leading-relaxed">
            From a single room refresh to a full property transformation — we handle the design, the trades, and every styled detail in between.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {SERVICES.map((service, i) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white/40 p-8 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border border-emerald/5 hover:bg-white transition-all duration-500 group"
              id={`service-card-${i}`}
            >
              <div className="w-12 h-12 bg-emerald/5 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-emerald/10 transition-colors">
                <service.icon className="text-emerald/60" size={20} />
              </div>
              <h3 className="text-2xl font-bold text-emerald mb-4 tracking-tight">
                {service.title}
              </h3>
              <p className="text-emerald/50 leading-relaxed text-sm">
                {service.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
