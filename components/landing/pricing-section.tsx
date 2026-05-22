'use client';

import { motion } from 'framer-motion';
import { Check, X, Zap } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const plans = [
  {
    name: 'Personal',
    price: { monthly: 9, yearly: 90 },
    description: 'Perfect for small businesses and home inventory.',
    features: [
      { text: '1 Warehouse', included: true },
      { text: '1 User', included: true },
      { text: '100 Products', included: true },
      { text: 'POS Terminal', included: false },
      { text: 'AI Assistant (10/day)', included: true },
      { text: 'Basic Analytics', included: true },
      { text: 'Advanced Analytics', included: false },
      { text: 'API Access', included: false },
      { text: 'Priority Support', included: false },
    ],
    popular: false,
    cta: 'Start Free Trial',
  },
  {
    name: 'Retail / POS',
    price: { monthly: 29, yearly: 290 },
    description: 'Ideal for retail stores with POS needs.',
    features: [
      { text: '5 Warehouses', included: true },
      { text: '10 Users', included: true },
      { text: '5,000 Products', included: true },
      { text: '3 POS Terminals', included: true },
      { text: 'AI Assistant (100/day)', included: true },
      { text: 'Advanced Analytics', included: true },
      { text: 'Barcode Scanning', included: true },
      { text: 'API Access', included: false },
      { text: 'Priority Support', included: true },
    ],
    popular: true,
    cta: 'Start Free Trial',
  },
  {
    name: 'Enterprise',
    price: { monthly: 99, yearly: 990 },
    description: 'For large-scale operations and multi-location businesses.',
    features: [
      { text: 'Unlimited Warehouses', included: true },
      { text: 'Unlimited Users', included: true },
      { text: 'Unlimited Products', included: true },
      { text: 'Unlimited POS Terminals', included: true },
      { text: 'Unlimited AI Queries', included: true },
      { text: 'Advanced Analytics + Custom', included: true },
      { text: 'Barcode Scanning', included: true },
      { text: 'API Access', included: true },
      { text: 'Priority Support', included: true },
    ],
    popular: false,
    cta: 'Contact Sales',
  },
];

export function PricingSection() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm mb-4">
            <Zap className="h-4 w-4" />
            Simple Pricing
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Choose Your
            <span className="gradient-text"> Plan</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Start free, scale as you grow. All plans include 14-day trial.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className={`relative rounded-2xl border ${
                plan.popular
                  ? 'border-primary shadow-lg shadow-primary/20 scale-105'
                  : 'border-border/50'
              } bg-card p-8`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                  Most Popular
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                <p className="text-muted-foreground text-sm mt-1">{plan.description}</p>
              </div>
              <div className="mb-8">
                <span className="text-5xl font-bold">${plan.price.monthly}</span>
                <span className="text-muted-foreground">/month</span>
                <div className="text-sm text-muted-foreground mt-1">
                  ${plan.price.yearly}/year (save {Math.round((1 - plan.price.yearly / (plan.price.monthly * 12)) * 100)}%)
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature.text} className="flex items-center gap-3">
                    {feature.included ? (
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                    ) : (
                      <X className="h-5 w-5 text-muted-foreground/50 flex-shrink-0" />
                    )}
                    <span className={feature.included ? '' : 'text-muted-foreground/50'}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>
              <Link href="/signup">
                <Button
                  className="w-full"
                  variant={plan.popular ? 'default' : 'outline'}
                  size="lg"
                >
                  {plan.cta}
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
