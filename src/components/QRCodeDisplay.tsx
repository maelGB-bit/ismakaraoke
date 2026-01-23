import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';

export function QRCodeDisplay() {
  const baseUrl = window.location.origin;
  const voteUrl = `${baseUrl}/vote`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4 text-center"
    >
      <p className="text-muted-foreground text-xs uppercase tracking-widest mb-2">
        Escaneie para votar
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
        <p className="text-xs text-muted-foreground break-all max-w-[200px] mx-auto">
          {voteUrl}
        </p>
      </div>
    </motion.div>
  );
}
