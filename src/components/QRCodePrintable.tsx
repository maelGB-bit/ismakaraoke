import { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useLanguage } from '@/i18n/LanguageContext';

interface QRCodePrintableProps {
  instanceCode: string;
}

const mamuteLogo = '/img/mamute-logo-pb.png';

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
              background: white;
              font-family: Arial, sans-serif;
            }
            .container {
              width: 50mm;
              height: 50mm;
              display: flex;
              flex-direction: row;
              align-items: center;
              justify-content: center;
              position: relative;
            }
            .left-text {
              position: absolute;
              left: 1mm;
              top: 50%;
              transform: rotate(-90deg) translateX(-50%);
              transform-origin: left center;
              font-size: 6pt;
              font-weight: bold;
              text-transform: uppercase;
              white-space: nowrap;
              letter-spacing: 0.5px;
            }
            .right-text {
              position: absolute;
              right: 1mm;
              top: 50%;
              transform: rotate(90deg) translateX(50%);
              transform-origin: right center;
              font-size: 6pt;
              font-weight: bold;
              white-space: nowrap;
            }
            .center-content {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 1mm 6mm;
            }
            .logo {
              width: 26mm;
              height: auto;
              margin-bottom: 1mm;
            }
            .qr-container {
              background: white;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="left-text">Acesse para<br/>VOTAR E CANTAR</div>
            <div class="center-content">
              <img src="${mamuteLogo}" class="logo" alt="Mamute Karaoke" />
              <div class="qr-container">
                ${printRef.current?.querySelector('svg')?.outerHTML || ''}
              </div>
            </div>
            <div class="right-text">www.mamutekaraoke.com.br</div>
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

      // Draw left text (rotated)
      ctx.save();
      ctx.translate(30, size / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Acesse para', 0, -8);
      ctx.font = 'bold 28px Arial';
      ctx.fillText('VOTAR E CANTAR', 0, 20);
      ctx.restore();

      // Draw right text (rotated)
      ctx.save();
      ctx.translate(size - 30, size / 2);
      ctx.rotate(Math.PI / 2);
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('www.mamutekaraoke.com.br', 0, 0);
      ctx.restore();

      // Load logo
      const logo = new Image();
      logo.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        logo.onload = resolve;
        logo.onerror = reject;
        logo.src = mamuteLogo;
      });

      // Draw logo (centered at top) - same size as QR code
      const logoWidth = 280;
      const logoHeight = (logo.height / logo.width) * logoWidth;
      ctx.drawImage(logo, (size - logoWidth) / 2, 30, logoWidth, logoHeight);

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

        // Draw QR code (centered below logo) - same size as logo
        const qrSize = 280;
        const qrY = 30 + logoHeight + 10;
        ctx.drawImage(qrImage, (size - qrSize) / 2, qrY, qrSize, qrSize);
        URL.revokeObjectURL(svgUrl);
      }

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
          {/* Preview - matching the reference layout */}
          <div 
            ref={printRef}
            className="w-48 h-48 bg-white rounded-lg shadow-lg flex items-center justify-center relative p-2"
          >
            {/* Left vertical text */}
            <div 
              className="absolute left-1 top-1/2 -translate-y-1/2 text-black text-[8px] font-bold"
              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg) translateX(50%)' }}
            >
              <span className="block">Acesse para</span>
              <span className="block text-[10px]">VOTAR E CANTAR</span>
            </div>
            
            {/* Center content */}
            <div className="flex flex-col items-center">
              <img src={mamuteLogo} alt="Mamute" className="w-20 h-auto mb-1" />
              <QRCodeSVG
                value={voteUrl}
                size={80}
                level="H"
                includeMargin={false}
              />
            </div>
            
            {/* Right vertical text */}
            <div 
              className="absolute right-1 top-1/2 -translate-y-1/2 text-black text-[8px] font-bold"
              style={{ writingMode: 'vertical-rl' }}
            >
              www.mamutekaraoke.com.br
            </div>
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
