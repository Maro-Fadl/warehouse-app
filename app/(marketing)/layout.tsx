import type { Metadata } from 'next';
import { Inter, Cairo } from 'next/font/google';
import { ThemeProvider } from '@/components/providers/theme-provider';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const cairo = Cairo({ subsets: ['arabic'], variable: '--font-arabic' });

export const metadata: Metadata = {
  title: 'WareHouse Pro — Multi-Tenant Inventory & POS Platform',
  description: 'Enterprise-grade inventory management, POS, and business analytics for modern businesses.',
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <div className={`${inter.variable} ${cairo.variable} font-sans`}>
        {children}
      </div>
    </ThemeProvider>
  );
}
