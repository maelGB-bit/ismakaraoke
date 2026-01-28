import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Ana Paula Silva',
    role: 'Organizadora de Eventos',
    content: 'O Mamute Karaokê transformou completamente nossos eventos! Os participantes adoram e ficam muito mais engajados.',
    rating: 5,
  },
  {
    name: 'Carlos Eduardo',
    role: 'Dono de Bar',
    content: 'Antes era uma confusão com papelzinho. Agora está tudo organizado pelo celular. O público fica mais tempo no estabelecimento.',
    rating: 5,
  },
  {
    name: 'Maria Fernanda',
    role: 'Festa de Aniversário',
    content: 'Usei no aniversário da minha filha e foi sucesso total! As crianças e adultos se divertiram demais votando.',
    rating: 5,
  },
  {
    name: 'Roberto Santos',
    role: 'DJ Profissional',
    content: 'Ferramenta essencial para qualquer profissional de karaokê. Fácil de usar e os clientes amam a experiência interativa.',
    rating: 5,
  },
  {
    name: 'Juliana Costa',
    role: 'Coordenadora de Igreja',
    content: 'Usamos nos eventos da comunidade e todos participam. O ranking deixa tudo mais animado e divertido!',
    rating: 5,
  },
  {
    name: 'Pedro Henrique',
    role: 'Evento Corporativo',
    content: 'Perfeito para confraternizações! O sistema de votação engajou toda a equipe de forma descontraída.',
    rating: 5,
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-20 bg-landing-light">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold text-landing-dark mb-4">
            O que nossos <span className="text-landing-orange">clientes</span> dizem
          </h2>
          <p className="text-landing-dark/60 max-w-2xl mx-auto">
            Milhares de pessoas já transformaram seus eventos com o Mamute Karaokê.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-md border border-landing-brown/10 hover:shadow-lg transition-shadow"
            >
              <Quote className="w-8 h-8 text-landing-orange/30 mb-4" />
              <p className="text-landing-dark/70 mb-6 leading-relaxed">
                "{testimonial.content}"
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-landing-orange/10 rounded-full flex items-center justify-center">
                  <span className="text-landing-orange font-bold text-lg">
                    {testimonial.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-landing-dark">{testimonial.name}</p>
                  <p className="text-sm text-landing-dark/50">{testimonial.role}</p>
                </div>
              </div>
              <div className="flex gap-1 mt-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-landing-orange text-landing-orange" />
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
