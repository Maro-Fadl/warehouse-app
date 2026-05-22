'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Save, Globe, Moon, Sun, Monitor, Palette } from 'lucide-react';
import { useTheme } from 'next-themes';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useState({
    workspaceName: 'Acme Logistics',
    currency: 'USD',
    timezone: 'America/New_York',
    language: 'en',
    taxRate: 10,
    lowStockThreshold: 10,
  });

  const handleSave = () => {
    // TODO: Save to API
    console.log('Settings saved:', settings);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your workspace settings.</p>
        </div>
        <Button onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle>General</CardTitle>
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
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="SAR">SAR - Saudi Riyal</option>
                <option value="AED">AED - UAE Dirham</option>
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
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-3 block">Theme</label>
              <div className="grid grid-cols-3 gap-3">
                <Button
                  variant={theme === 'light' ? 'default' : 'outline'}
                  onClick={() => setTheme('light')}
                  className="flex-col h-auto py-3"
                >
                  <Sun className="h-5 w-5 mb-1" />
                  <span className="text-xs">Light</span>
                </Button>
                <Button
                  variant={theme === 'dark' ? 'default' : 'outline'}
                  onClick={() => setTheme('dark')}
                  className="flex-col h-auto py-3"
                >
                  <Moon className="h-5 w-5 mb-1" />
                  <span className="text-xs">Dark</span>
                </Button>
                <Button
                  variant={theme === 'system' ? 'default' : 'outline'}
                  onClick={() => setTheme('system')}
                  className="flex-col h-auto py-3"
                >
                  <Monitor className="h-5 w-5 mb-1" />
                  <span className="text-xs">System</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Default Tax Rate (%)</label>
              <Input
                type="number"
                value={settings.taxRate}
                onChange={(e) => setSettings({ ...settings, taxRate: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Low Stock Threshold</label>
              <Input
                type="number"
                value={settings.lowStockThreshold}
                onChange={(e) => setSettings({ ...settings, lowStockThreshold: parseInt(e.target.value) || 0 })}
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
