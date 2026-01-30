import { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useLanguage } from '@/i18n/LanguageContext';

interface QRCodePrintableProps {
  instanceCode: string;
}

const mamuteLogo = '/img/mamute-logo.png';

export function QRCodePrintable({ instanceCode }: QRCodePrintableProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const baseUrl = window.location.origin;
  const voteUrl = `${baseUrl}/app/vote/${instanceCode}`;

  const handlePrint = async () => {
    setIsPrinting(true);
    
    try {
      // Create a new window for printing
      const printWindow = window.open('', '_blank', 'width=300,height=400');
      if (!printWindow) {
        alert('Por favor, permita pop-ups para imprimir o QR Code');
        return;
      }

      // Wait for logo to load and create printable content
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>QR Code - ${instanceCode}</title>
          <style>
            @page {
              size: 50mm 50mm;
              margin: 0;
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              width: 50mm;
              height: 50mm;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              font-family: Arial, sans-serif;
              background: white;
            }
            .container {
              width: 48mm;
              height: 48mm;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 2mm;
            }
            .logo {
              width: 10mm;
              height: 10mm;
              margin-bottom: 1mm;
            }
            .qr-container {
              background: white;
              padding: 1mm;
              border: 0.5mm solid #333;
              border-radius: 1mm;
            }
            .code {
              font-size: 8pt;
              font-weight: bold;
              margin-top: 1mm;
              color: #333;
            }
            .label {
              font-size: 5pt;
              color: #666;
              margin-top: 0.5mm;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <img src="${mamuteLogo}" class="logo" alt="Mamute" />
            <div class="qr-container">
              ${printRef.current?.querySelector('svg')?.outerHTML || ''}
            </div>
            <div class="code">${instanceCode}</div>
            <div class="label">Escaneie para votar</div>
          </div>
        </body>
        </html>
      `);

      printWindow.document.close();
      
      // Wait for content to load
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    } finally {
      setIsPrinting(false);
    }
  };

  const handleDownloadImage = async () => {
    setIsPrinting(true);
    
    try {
      // Create canvas for 50mm x 50mm at 300 DPI = 591 x 591 pixels
      const canvas = document.createElement('canvas');
      const size = 591;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return;

      // White background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, size, size);

      // Load logo
      const logo = new Image();
      logo.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        logo.onload = resolve;
        logo.onerror = reject;
        logo.src = mamuteLogo;
      });

      // Draw logo (centered at top)
      const logoSize = 100;
      ctx.drawImage(logo, (size - logoSize) / 2, 20, logoSize, logoSize);

      // Get QR code as data URL
      const svgElement = printRef.current?.querySelector('svg');
      if (svgElement) {
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const svgUrl = URL.createObjectURL(svgBlob);
        
        const qrImage = new Image();
        await new Promise((resolve, reject) => {
          qrImage.onload = resolve;
          qrImage.onerror = reject;
          qrImage.src = svgUrl;
        });

        // Draw QR code (centered)
        const qrSize = 350;
        ctx.drawImage(qrImage, (size - qrSize) / 2, 130, qrSize, qrSize);
        URL.revokeObjectURL(svgUrl);
      }

      // Draw instance code
      ctx.fillStyle = '#333333';
      ctx.font = 'bold 36px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(instanceCode, size / 2, 520);

      // Draw label
      ctx.fillStyle = '#666666';
      ctx.font = '20px Arial';
      ctx.fillText('Escaneie para votar', size / 2, 555);

      // Download
      const link = document.createElement('a');
      link.download = `qrcode_${instanceCode}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Error generating image:', error);
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Printer className="h-4 w-4" />
          {t('qr.print')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Imprimir QR Code
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center py-6">
          {/* Preview */}
          <div 
            ref={printRef}
            className="w-48 h-48 bg-white rounded-lg shadow-lg flex flex-col items-center justify-center p-3"
          >
            <img src={mamuteLogo} alt="Mamute" className="w-10 h-10 mb-2" />
            <div className="bg-white p-2 border-2 border-gray-800 rounded">
              <QRCodeSVG
                value={voteUrl}
                size={100}
                level="H"
                includeMargin={false}
              />
            </div>
            <p className="text-gray-800 font-bold text-sm mt-2">{instanceCode}</p>
            <p className="text-gray-500 text-xs">Escaneie para votar</p>
          </div>

          <p className="text-sm text-muted-foreground mt-4 text-center">
            Formato: 50mm × 50mm
          </p>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={handlePrint} 
            className="flex-1"
            disabled={isPrinting}
          >
            {isPrinting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Printer className="h-4 w-4 mr-2" />
            )}
            Imprimir
          </Button>
          <Button 
            onClick={handleDownloadImage} 
            variant="outline"
            className="flex-1"
            disabled={isPrinting}
          >
            {isPrinting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Baixar PNG
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
