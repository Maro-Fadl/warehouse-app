'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Scan, Camera, X, Keyboard } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const [mode, setMode] = useState<'camera' | 'manual'>('manual');
  const [manualCode, setManualCode] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mode === 'manual' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [mode]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onScan(manualCode.trim());
      setManualCode('');
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Scan Barcode</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex gap-2 mb-4">
          <Button
            variant={mode === 'camera' ? 'default' : 'outline'}
            onClick={() => setMode('camera')}
            className="flex-1"
          >
            <Camera className="mr-2 h-4 w-4" />
            Camera
          </Button>
          <Button
            variant={mode === 'manual' ? 'default' : 'outline'}
            onClick={() => setMode('manual')}
            className="flex-1"
          >
            <Keyboard className="mr-2 h-4 w-4" />
            Manual
          </Button>
        </div>

        {mode === 'camera' ? (
          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-4">
            <div className="text-center">
              <Scan className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Camera access required
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Grant camera permission to scan barcodes
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Enter Barcode</label>
              <Input
                ref={inputRef}
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="e.g., 1234567890123"
                className="font-mono"
              />
            </div>
            <Button type="submit" className="w-full" disabled={!manualCode.trim()}>
              <Scan className="mr-2 h-4 w-4" />
              Look Up Product
            </Button>
          </form>
        )}

        <div className="mt-4 text-center">
          <p className="text-xs text-muted-foreground">
            Supports EAN-13, UPC-A, Code 128, and QR codes
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
