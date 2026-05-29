import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import img1 from '../assets/images/serene_bedroom_1779090868311.png';
import img2 from '../assets/images/sage_dining_room_1779090886447.png';
import img3 from '../assets/images/modern_home_office_1779090902647.png';
import img4 from '../assets/images/reading_nook_1779090922940.png';
import img5 from '../assets/images/kitchen_styling_1779090940250.png';
import { GalleryDocument } from '../lib/firebase';

// Translation map from bootstrapped names to direct compiled asset static bundle paths
export const LOCAL_IMAGES_MAP: Record<string, string> = {
  "serene_bedroom": img1,
  "sage_dining_room": img2,
  "modern_home_office": img3,
  "reading_nook": img4,
  "kitchen_styling": img5
};

interface GalleryProps {
  items: GalleryDocument[];
}

export function Gallery({ items }: GalleryProps) {
  const [expanded, setExpanded] = useState(false);

  // Default display is limited to 6 of high quality. If we have more, they are toggled!
  const displayedItems = expanded ? items : items.slice(0, 6);
  const hasMore = items.length > 6;

  const getImageUrl = (url: string) => {
    if (url.startsWith('http') || url.startsWith('data:')) {
      return url;
    }
    return LOCAL_IMAGES_MAP[url] || img1;
  };

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
          <p className="text-emerald/60 max-w-sm text-sm leading-relaxed mb-4 font-semibold">
            A glimpse of recent residential and commercial projects — designed to feel timeless, personal, and entirely yours.
          </p>
        </motion.div>

        {/* Animated grid container */}
        <motion.div 
          layout
          className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6"
        >
          {displayedItems.map((item, i) => {
            const resolvedUrl = getImageUrl(item.url);

            return (
              <motion.div
                key={item.id || i}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                whileHover={{ y: -8 }}
                className={`relative overflow-hidden rounded-[2rem] md:rounded-[2.5rem] group min-h-[300px] md:min-h-[350px] ${item.span || 'md:col-span-1'}`}
                id={`gallery-item-${item.id || i}`}
              >
                <img
                  src={resolvedUrl}
                  alt={item.title || "Interior Space"}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                
                {/* Minimal Overlay with project titles */}
                <div className="absolute inset-0 bg-gradient-to-t from-emerald/80 via-transparent to-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6 select-none pointer-events-none">
                  <span className="text-cream/50 text-[8px] font-bold tracking-widest uppercase mb-1">{item.tag || 'PORTFOLIO'}</span>
                  <p className="text-cream text-md font-bold">{item.title || 'Curated Space'}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Expand Trigger Button if list size exceeds 6 */}
        {hasMore && (
          <div className="flex justify-center mt-12">
            <button 
              onClick={() => setExpanded(!expanded)}
              className="px-8 py-3.5 rounded-full bg-emerald text-cream font-bold text-xs tracking-wider uppercase flex items-center gap-2.5 transition-all shadow-md hover:bg-emerald-soft hover:shadow-lg hover:shadow-emerald/10 cursor-pointer"
              id="gallery-see-more-btn"
            >
              <span>{expanded ? "Fold Portfolio" : "See More Works"}</span>
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
