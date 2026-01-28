import { Link } from 'react-router-dom';
import { Instagram, MessageCircle, Mail, HelpCircle } from 'lucide-react';
import mamuteLogo from '@/assets/mamute-logo.png';

export function LandingFooter() {
  return (
    <footer className="bg-landing-dark border-t border-landing-brown/20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <img src={mamuteLogo} alt="Mamute Karaokê" className="w-10 h-10" />
              <span className="font-display font-bold text-xl text-white">
                Mamute <span className="text-landing-orange">Karaokê</span>
              </span>
            </Link>
            <p className="text-sm text-white/60">
              Um karaokê organizado e divertido para qualquer evento, festa ou até para usar em casa.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Navegação</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/como-funciona" className="text-sm text-white/60 hover:text-landing-orange transition-colors">
                  Como Funciona
                </Link>
              </li>
              <li>
                <Link to="/planos" className="text-sm text-white/60 hover:text-landing-orange transition-colors">
                  Planos
                </Link>
              </li>
              <li>
                <Link to="/manual" className="text-sm text-white/60 hover:text-landing-orange transition-colors">
                  Manual
                </Link>
              </li>
              <li>
                <Link to="/testar" className="text-sm text-white/60 hover:text-landing-orange transition-colors">
                  Testar Grátis
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/termos" className="text-sm text-white/60 hover:text-landing-orange transition-colors">
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link to="/privacidade" className="text-sm text-white/60 hover:text-landing-orange transition-colors">
                  Política de Privacidade
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-white mb-4">Contato</h4>
            <ul className="space-y-3">
              <li>
                <a 
                  href="https://wa.me/5500000000000" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-white/60 hover:text-landing-orange transition-colors"
                >
                  <MessageCircle size={16} />
                  WhatsApp
                </a>
              </li>
              <li>
                <a 
                  href="https://instagram.com/mamutekaraoke" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-white/60 hover:text-landing-orange transition-colors"
                >
                  <Instagram size={16} />
                  Instagram
                </a>
              </li>
              <li>
                <a 
                  href="mailto:contato@mamutekaraoke.com"
                  className="flex items-center gap-2 text-sm text-white/60 hover:text-landing-orange transition-colors"
                >
                  <Mail size={16} />
                  Contato
                </a>
              </li>
              <li>
                <Link 
                  to="/suporte"
                  className="flex items-center gap-2 text-sm text-white/60 hover:text-landing-orange transition-colors"
                >
                  <HelpCircle size={16} />
                  Suporte
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-landing-brown/20 mt-8 pt-8 text-center">
          <p className="text-sm text-white/40">
            © 2026 Mamute Karaokê — Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
