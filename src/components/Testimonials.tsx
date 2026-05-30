import React from 'react';
import { motion } from 'motion/react';
import { Star } from 'lucide-react';
import { SiteConfigDocument } from '../lib/firebase';

const TESTIMONIALS = [
  {
    text: "I loved the professionalism! I left everything to them and now my space feels like heaven! I'd recommend Em-erald interiors anyday!",
    author: "Liz Njerry",
    scope: "Refurbishment",
    time: "3 years ago",
    positive: ["Professionalism"],
    initials: "LN"
  },
  {
    text: "Have a variety of selections to choose from and almost all fit perfectly.. You would not go wrong with any selection",
    author: "Elvis Njama",
    scope: "Interior decorating",
    time: "3 years ago",
    positive: ["Quality", "Professionalism", "Value"],
    initials: "EN"
  },
  {
    text: "Very professional, and the service delivery was really good to my expectations.",
    author: "Akware Elnah",
    scope: "Interior architectural design, Interior decorating, Interior painting, Office space design",
    time: "3 years ago",
    positive: ["Responsiveness", "Punctuality", "Quality", "Professionalism", "Value"],
    initials: "AE"
  }
];

export function Testimonials({ config }: { config: SiteConfigDocument | null }) {
  return (
    <section id="reviews" className="py-20 md:py-32 px-4 md:px-12 lg:px-24 bg-cream">
      <div className="max-w-7xl mx-auto">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           className="mb-16 md:mb-20 text-center"
        >
          <span className="text-emerald/40 font-medium tracking-[0.2em] text-[8px] md:text-[10px] uppercase block mb-6">
            {config?.testimonialsSubtitle || "Kind Words"}
          </span>
          <h2 className="text-4xl sm:text-6xl md:text-7xl font-serif text-emerald mb-8 leading-tight">
            {config?.testimonialsTitleLine1 || "Loved by the people"} <br />
            {config?.testimonialsTitleLine2 || "we design for."}
          </h2>
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-1 text-terracotta">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="fill-current" size={18} />
              ))}
            </div>
            <p className="text-emerald/60 text-xs sm:text-sm font-semibold tracking-wide uppercase select-none">
              4.9 <span className="opacity-50 font-normal">Based on Google Reviews</span>
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-8 md:p-10 rounded-[2rem] md:rounded-[2.5rem] text-left border border-emerald/5 flex flex-col justify-between hover:shadow-xl hover:shadow-emerald/5 hover:-translate-y-1 transition-all duration-300"
              id={`testimonial-${i}`}
            >
              <div>
                {/* Author Info header with Avatars */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-emerald text-cream flex items-center justify-center font-bold text-sm tracking-widest select-none">
                    {t.initials}
                  </div>
                  <div>
                    <h4 className="font-bold text-emerald text-sm sm:text-base leading-tight">
                      {t.author}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex text-terracotta">
                        {[...Array(5)].map((_, idx) => (
                          <Star key={idx} className="fill-current" size={10} />
                        ))}
                      </div>
                      <span className="text-[10px] text-emerald/40 font-medium">{t.time}</span>
                    </div>
                  </div>
                </div>

                <div className="text-terracotta text-xl md:text-2xl font-serif mb-4 opacity-30 mt-[-5px] select-none">
                  “
                </div>
                <p className="text-emerald/70 text-sm md:text-base leading-relaxed mb-8">
                  {t.text}
                </p>
              </div>

              {/* Review Highlights & Tags */}
              <div className="pt-6 border-t border-emerald/5 space-y-4">
                {t.positive && t.positive.length > 0 && (
                  <div>
                    <span className="text-[8px] font-bold text-emerald/40 tracking-widest uppercase block mb-1.5 select-none">Positive Traits</span>
                    <div className="flex flex-wrap gap-1.5">
                      {t.positive.map((p) => (
                        <span key={p} className="text-[9px] font-bold px-2 py-0.5 bg-terracotta/5 text-terracotta rounded-full">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <span className="text-[8px] font-bold text-emerald/40 tracking-widest uppercase block mb-1.5 select-none">Services Rendered</span>
                  <span className="text-[11px] font-bold text-emerald/60 capitalize leading-tight block">
                    {t.scope}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

