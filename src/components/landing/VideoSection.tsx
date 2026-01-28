import { motion } from 'framer-motion';

export function VideoSection() {
  return (
    <section className="py-20 bg-landing-dark relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-landing-dark via-landing-dark/95 to-landing-dark" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-landing-orange/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
            Veja como funciona <span className="text-landing-orange">na prática</span>
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto">
            Assista ao vídeo e entenda como o karaokê pode ser simples, organizado e divertido.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          {/* Video placeholder */}
          <div className="aspect-video bg-black/40 rounded-2xl border-2 border-dashed border-white/10 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/40" />
            <div className="relative z-10 text-center px-6">
              <p className="text-white/80 text-lg font-semibold">Aguardando vídeo</p>
              <p className="text-white/50 text-sm mt-2">
                Espaço reservado para o player do YouTube. Envie o link para carregar o vídeo.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
