import { motion } from 'motion/react';
import { Star } from 'lucide-react';

const TESTIMONIALS = [
  {
    text: "Very professional — I trusted them with everything and my space turned out amazing.",
    author: "Verified Client",
    scope: "RESIDENTIAL PROJECT",
  },
  {
    text: "They offer a wide variety of options, and the results fit perfectly.",
    author: "Verified Client",
    scope: "HOME RENOVATION",
  },
  {
    text: "Excellent service delivery with strong professionalism, responsiveness, and quality.",
    author: "Verified Client",
    scope: "COMMERCIAL PROJECT",
  },
];

export function Testimonials() {
  return (
    <section id="reviews" className="py-20 md:py-32 px-4 md:px-12 lg:px-24 bg-cream">
      <div className="max-w-7xl mx-auto text-center">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           className="mb-16 md:mb-20"
        >
          <span className="text-emerald/40 font-medium tracking-[0.2em] text-[8px] md:text-[10px] uppercase block mb-6">
            Kind Words
          </span>
          <h2 className="text-4xl sm:text-6xl md:text-7xl font-serif text-emerald mb-8 leading-tight">
            Loved by the people <br />
            we design for.
          </h2>
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-1 text-terracotta">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="fill-current" size={18} />
              ))}
            </div>
            <p className="text-emerald/60 text-xs sm:text-sm font-semibold tracking-wide">
              4.9 <span className="opacity-50 font-normal">BASED ON 9 GOOGLE REVIEWS</span>
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-8 md:p-10 rounded-[2rem] md:rounded-[2.5rem] text-left border border-emerald/5 flex flex-col justify-between"
              id={`testimonial-${i}`}
            >
              <div>
                <div className="text-terracotta text-xl md:text-2xl font-serif mb-6 opacity-30 mt-[-5px]">
                  “
                </div>
                <p className="text-emerald/70 text-base md:text-lg leading-relaxed mb-10 md:mb-12">
                  {t.text}
                </p>
              </div>
              <div className="pt-8 border-t border-emerald/5">
                <span className="font-bold text-emerald block mb-1 text-xs md:text-sm">{t.author}</span>
                <span className="text-[10px] tracking-[0.2em] font-medium text-emerald/40 uppercase">
                  {t.scope}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
