'use client';

import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Operations Director',
    company: 'TechParts Global',
    content: 'WareHouse Pro transformed our inventory management. The AI assistant alone saved us 20 hours per week in stock analysis.',
    rating: 5,
    avatar: 'SC',
  },
  {
    name: 'Ahmed Al-Rashid',
    role: 'CEO',
    company: 'Gulf Trading Co',
    content: 'The Arabic RTL support is flawless. Finally a platform that works perfectly for our Middle East operations.',
    rating: 5,
    avatar: 'AR',
  },
  {
    name: 'Michael Torres',
    role: 'Store Manager',
    company: 'RetailMax',
    content: 'The POS integration with barcode scanning made checkout 3x faster. Our customers love the speed.',
    rating: 5,
    avatar: 'MT',
  },
  {
    name: 'Elena Popova',
    role: 'Warehouse Supervisor',
    company: 'EuroLogistics',
    content: 'Multi-warehouse transfers are seamless. We manage 12 locations from a single dashboard effortlessly.',
    rating: 5,
    avatar: 'EP',
  },
];

export function Testimonials() {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Trusted by
            <span className="gradient-text"> Industry Leaders</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See what our customers say about transforming their operations.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {testimonials.map((testimonial, i) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative p-6 rounded-2xl border border-border/50 bg-card"
            >
              <Quote className="absolute top-4 right-4 h-8 w-8 text-primary/10" />
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                ))}
              </div>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                &ldquo;{testimonial.content}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="font-semibold text-sm">{testimonial.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {testimonial.role}, {testimonial.company}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
