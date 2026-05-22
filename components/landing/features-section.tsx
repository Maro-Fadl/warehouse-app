'use client';

import { motion } from 'framer-motion';
import {
  Warehouse,
  ShoppingCart,
  BarChart3,
  Brain,
  Globe,
  Shield,
  Boxes,
  Scan,
  Bell,
  Users,
  Zap,
  Lock,
} from 'lucide-react';

const features = [
  {
    icon: Warehouse,
    title: 'Multi-Warehouse Management',
    description: 'Manage unlimited warehouses across locations with real-time inventory sync and transfer capabilities.',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    icon: ShoppingCart,
    title: 'Integrated POS System',
    description: 'Full point-of-sale with barcode scanning, receipt printing, and integrated financial tracking.',
    color: 'text-green-500',
    bg: 'bg-green-500/10',
  },
  {
    icon: Brain,
    title: 'AI-Powered Assistant',
    description: 'Natural language queries for inventory insights, demand forecasting, and business analytics.',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
  },
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    description: 'Real-time dashboards with revenue tracking, stock alerts, and predictive analytics.',
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
  },
  {
    icon: Users,
    title: 'Role-Based Access Control',
    description: 'Granular permissions for Owners, Managers, Storekeepers, and Cashiers with audit logging.',
    color: 'text-cyan-500',
    bg: 'bg-cyan-500/10',
  },
  {
    icon: Globe,
    title: 'Full Localization',
    description: 'Complete i18n support with RTL Arabic layout and multi-currency capabilities.',
    color: 'text-pink-500',
    bg: 'bg-pink-500/10',
  },
  {
    icon: Scan,
    title: 'Barcode Scanner',
    description: 'Built-in barcode scanning for rapid product lookup, inventory counts, and POS transactions.',
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10',
  },
  {
    icon: Bell,
    title: 'Smart Notifications',
    description: 'Real-time alerts for low stock, expiring items, and critical business events.',
    color: 'text-red-500',
    bg: 'bg-red-500/10',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Row-level security, encrypted data, SOC 2 compliance, and regular security audits.',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
];

export function FeaturesSection() {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm mb-4">
            <Zap className="h-4 w-4" />
            Powerful Features
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Everything You Need to
            <span className="gradient-text"> Scale</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From small retail shops to enterprise warehouses, our platform adapts to your business needs.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="group relative p-6 rounded-2xl border border-border/50 bg-card hover:border-primary/50 transition-all duration-300"
            >
              <div className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-4`}>
                <feature.icon className={`h-6 w-6 ${feature.color}`} />
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
