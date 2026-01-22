import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';

interface QRCodeDisplayProps {
  performanceId: string;
}

export function QRCodeDisplay({ performanceId }: QRCodeDisplayProps) {
  const baseUrl = window.location.origin;
  const voteUrl = `${baseUrl}/vote?rodada=${performanceId}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 text-center"
    >
      <p className="text-muted-foreground text-sm uppercase tracking-widest mb-4">
        Escaneie para votar
      </p>
      
      <div className="bg-white p-4 rounded-xl inline-block neon-glow-pink">
        <QRCodeSVG
          value={voteUrl}
          size={180}
          level="H"
          includeMargin={false}
        />
      </div>

      <div className="mt-4">
        <p className="text-xs text-muted-foreground break-all max-w-[250px] mx-auto">
          {voteUrl}
        </p>
      </div>
    </motion.div>
  );
}
