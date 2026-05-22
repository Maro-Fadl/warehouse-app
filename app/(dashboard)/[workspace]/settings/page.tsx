'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Save, Globe, Moon, Sun, Monitor, Palette, Check, Loader2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';

const colorPresets = [
  { name: 'Blue', value: 'blue', hsl: '221.2 83.2% 53.3%' },
  { name: 'Purple', value: 'purple', hsl: '262.1 83.3% 57.8%' },
  { name: 'Green', value: 'green', hsl: '142.1 76.2% 36.3%' },
  { name: 'Orange', value: 'orange', hsl: '24.6 95% 53.1%' },
  { name: 'Red', value: 'red', hsl: '0 84.2% 60.2%' },
  { name: 'Pink', value: 'pink', hsl: '330 81.2% 60.4%' },
  { name: 'Teal', value: 'teal', hsl: '170 76.6% 36.3%' },
  { name: 'Indigo', value: 'indigo', hsl: '243.7 75.4% 58.6%' },
];

const layoutOptions = [
  { name: 'Default', value: 'default', description: 'Standard sidebar layout' },
  { name: 'Compact', value: 'compact', description: 'Smaller sidebar, more content space' },
  { name: 'Expanded', value: 'expanded', description: 'Wider sidebar with more details' },
];

export default function SettingsPage() {
  const params = useParams();
  const workspaceSlug = params.workspace as string;
  const { theme, setTheme } = useTheme();

  const [settings, setSettings] = useState({
    workspaceName: 'Acme Logistics',
    currency: 'USD',
    timezone: 'America/New_York',
    language: 'en',
    taxRate: 10,
    lowStockThreshold: 10,
    accentColor: 'blue',
    sidebarLayout: 'default',
    compactMode: false,
    showAnimations: true,
    reducedMotion: false,
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Load saved settings
    const saved = localStorage.getItem('workspace-settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings(prev => ({ ...prev, ...parsed }));
        applyAccentColor(parsed.accentColor || 'blue');
      } catch (e) {
        console.error('Failed to load settings');
      }
    }
  }, []);

  const applyAccentColor = (color: string) => {
    const preset = colorPresets.find(c => c.value === color);
    if (preset) {
      document.documentElement.style.setProperty('--primary', preset.hsl);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);

    // Save to localStorage
    localStorage.setItem('workspace-settings', JSON.stringify(settings));

    // Apply accent color
    applyAccentColor(settings.accentColor);

    // Apply language
    const lang = settings.language === 'ar' ? 'ar' : 'en';
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    localStorage.setItem('NEXT_LOCALE', lang);
    document.cookie = `NEXT_LOCALE=${lang};path=/;max-age=31536000`;

    // Simulate save delay
    await new Promise(resolve => setTimeout(resolve, 500));

    setIsSaving(false);
    toast.success('Settings saved successfully');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Settings</h1>
          <p className="text-sm md:text-base text-muted-foreground">Manage your workspace settings and preferences.</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle>General</CardTitle>
            <CardDescription>Basic workspace configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Workspace Name</label>
              <Input
                value={settings.workspaceName}
                onChange={(e) => setSettings({ ...settings, workspaceName: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Currency</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={settings.currency}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
              >
                <option value="USD">USD - US Dollar ($)</option>
                <option value="EUR">EUR - Euro (&euro;)</option>
                <option value="GBP">GBP - British Pound (&pound;)</option>
                <option value="SAR">SAR - Saudi Riyal</option>
                <option value="AED">AED - UAE Dirham</option>
                <option value="EGP">EGP - Egyptian Pound</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Timezone</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={settings.timezone}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
              >
                <option value="America/New_York">Eastern Time (ET)</option>
                <option value="America/Chicago">Central Time (CT)</option>
                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                <option value="Europe/London">London (GMT)</option>
                <option value="Asia/Riyadh">Riyadh (AST)</option>
                <option value="Asia/Dubai">Dubai (GST)</option>
                <option value="Africa/Cairo">Cairo (EET)</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Language</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={settings.language}
                onChange={(e) => setSettings({ ...settings, language: e.target.value })}
              >
                <option value="en">English</option>
                <option value="ar">العربية (Arabic)</option>
              </select>
              {settings.language === 'ar' && (
                <p className="text-xs text-muted-foreground mt-1">
                  Layout will switch to Right-to-Left (RTL) mode
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Customize the look and feel</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="text-sm font-medium mb-3 block">Theme</label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={theme === 'light' ? 'default' : 'outline'}
                  onClick={() => setTheme('light')}
                  className="flex-col h-auto py-3"
                  size="sm"
                >
                  <Sun className="h-5 w-5 mb-1" />
                  <span className="text-xs">Light</span>
                </Button>
                <Button
                  variant={theme === 'dark' ? 'default' : 'outline'}
                  onClick={() => setTheme('dark')}
                  className="flex-col h-auto py-3"
                  size="sm"
                >
                  <Moon className="h-5 w-5 mb-1" />
                  <span className="text-xs">Dark</span>
                </Button>
                <Button
                  variant={theme === 'system' ? 'default' : 'outline'}
                  onClick={() => setTheme('system')}
                  className="flex-col h-auto py-3"
                  size="sm"
                >
                  <Monitor className="h-5 w-5 mb-1" />
                  <span className="text-xs">System</span>
                </Button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-3 block">
                <Palette className="inline h-4 w-4 mr-1" />
                Accent Color
              </label>
              <div className="grid grid-cols-4 gap-2">
                {colorPresets.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => {
                      setSettings({ ...settings, accentColor: color.value });
                      applyAccentColor(color.value);
                    }}
                    className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                      settings.accentColor === color.value
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: `hsl(${color.hsl})` }}
                    />
                    <span className="text-xs font-medium">{color.name}</span>
                    {settings.accentColor === color.value && (
                      <Check className="h-3 w-3 ml-auto" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-3 block">Sidebar Layout</label>
              <div className="space-y-2">
                {layoutOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSettings({ ...settings, sidebarLayout: option.value })}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                      settings.sidebarLayout === option.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="text-left">
                      <div className="text-sm font-medium">{option.name}</div>
                      <div className="text-xs text-muted-foreground">{option.description}</div>
                    </div>
                    {settings.sidebarLayout === option.value && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium block">Options</label>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm">Compact Mode</div>
                  <div className="text-xs text-muted-foreground">Reduce spacing and padding</div>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, compactMode: !settings.compactMode })}
                  className={`w-11 h-6 rounded-full transition-colors ${
                    settings.compactMode ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                      settings.compactMode ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm">Animations</div>
                  <div className="text-xs text-muted-foreground">Enable smooth transitions</div>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, showAnimations: !settings.showAnimations })}
                  className={`w-11 h-6 rounded-full transition-colors ${
                    settings.showAnimations ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                      settings.showAnimations ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory</CardTitle>
            <CardDescription>Configure inventory management defaults</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Default Tax Rate (%)</label>
              <Input
                type="number"
                value={settings.taxRate}
                onChange={(e) => setSettings({ ...settings, taxRate: parseFloat(e.target.value) || 0 })}
                min="0"
                max="100"
                step="0.1"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Low Stock Threshold</label>
              <Input
                type="number"
                value={settings.lowStockThreshold}
                onChange={(e) => setSettings({ ...settings, lowStockThreshold: parseInt(e.target.value) || 0 })}
                min="0"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Default minimum stock level for new products
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Plan Info */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
            <CardDescription>Your current plan and usage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <div className="text-sm text-muted-foreground">Current Plan</div>
                <div className="text-xl font-bold">Retail / POS</div>
              </div>
              <Badge variant="success">Active</Badge>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Warehouses</div>
                <div className="font-medium">3 / 5</div>
              </div>
              <div>
                <div className="text-muted-foreground">Users</div>
                <div className="font-medium">4 / 10</div>
              </div>
              <div>
                <div className="text-muted-foreground">Products</div>
                <div className="font-medium">2,847 / 5,000</div>
              </div>
              <div>
                <div className="text-muted-foreground">POS Terminals</div>
                <div className="font-medium">2 / 3</div>
              </div>
            </div>
            <Button variant="outline" className="w-full">
              Upgrade Plan
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
