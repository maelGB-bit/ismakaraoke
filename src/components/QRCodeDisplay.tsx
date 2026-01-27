import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/i18n/LanguageContext';

interface QRCodeDisplayProps {
  compact?: boolean;
  instanceCode?: string;
}

export function QRCodeDisplay({ compact = false, instanceCode }: QRCodeDisplayProps) {
  const { t } = useLanguage();
  const baseUrl = window.location.origin;
  // If instanceCode is provided, link to instance-specific vote page
  const voteUrl = instanceCode 
    ? `${baseUrl}/vote/${instanceCode}` 
    : `${baseUrl}/vote`;

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-2 py-1 glass-card">
        <div className="bg-white p-1 rounded">
          <QRCodeSVG
            value={voteUrl}
            size={40}
            level="L"
            includeMargin={false}
          />
        </div>
        <div className="text-xs">
          <p className="text-muted-foreground">{t('qr.scanToVote')}</p>
          {instanceCode && (
            <p className="font-mono font-bold text-primary">{instanceCode}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4 text-center"
    >
      <p className="text-muted-foreground text-xs uppercase tracking-widest mb-2">
        {t('qr.scanToVote')}
      </p>
      
      <div className="bg-white p-3 rounded-xl inline-block neon-glow-pink">
        <QRCodeSVG
          value={voteUrl}
          size={120}
          level="H"
          includeMargin={false}
        />
      </div>

      <div className="mt-2">
        {instanceCode && (
          <p className="text-lg font-mono font-bold text-primary mb-1">
            Código: {instanceCode}
          </p>
        )}
        <p className="text-xs text-muted-foreground break-all max-w-[200px] mx-auto">
          {voteUrl}
        </p>
      </div>
    </motion.div>
  );
}
