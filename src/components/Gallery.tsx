import { motion } from 'motion/react';

const ITEMS = [
  {
    url: '/src/assets/images/serene_bedroom_1779090868311.png',
    tag: 'RESIDENTIAL',
    title: 'Linen Bedroom',
    span: 'md:col-span-1 md:row-span-2',
  },
  {
    url: '/src/assets/images/sage_dining_room_1779090886447.png',
    tag: 'RESIDENTIAL',
    title: 'Sage Dining Room',
    span: 'md:col-span-1 md:row-span-1',
  },
  {
    url: '/src/assets/images/modern_home_office_1779090902647.png',
    tag: 'WORKSPACE',
    title: 'Warm Home Office',
    span: 'md:col-span-1 md:row-span-1',
  },
  {
    url: '/src/assets/images/reading_nook_1779090922940.png',
    tag: 'STYLING',
    title: 'Reading Nook',
    span: 'md:col-span-1 md:row-span-1',
  },
  {
    url: '/src/assets/images/kitchen_styling_1779090940250.png',
    tag: 'RESIDENTIAL',
    title: 'Open Kitchen',
    span: 'md:col-span-1 md:row-span-1',
  },
];

export function Gallery() {
  return (
    <section id="gallery" className="py-20 md:py-32 px-4 md:px-12 lg:px-24 bg-cream">
      <div className="max-w-7xl mx-auto">
        <motion.div
           initial={{ opacity: 0, y: 30 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 md:mb-20 gap-8"
        >
          <div>
            <span className="text-emerald/40 font-medium tracking-[0.2em] text-[8px] md:text-[10px] uppercase block mb-6">
              Selected Work
            </span>
            <h2 className="text-4xl sm:text-6xl md:text-7xl font-serif text-emerald leading-tight">
              Spaces with a <span className="italic text-terracotta">soul.</span>
            </h2>
          </div>
          <p className="text-emerald/60 max-w-sm text-sm leading-relaxed mb-4">
            A glimpse of recent residential and commercial projects — designed to feel timeless, personal, and entirely yours.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {ITEMS.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              whileHover={{ y: -10 }}
              className={`relative overflow-hidden rounded-[2rem] md:rounded-[2.5rem] group min-h-[300px] md:min-h-[350px] ${item.span}`}
              id={`gallery-item-${i}`}
            >
              <img
                src={item.url}
                alt=""
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
