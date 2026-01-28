import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import mammothLogo from '@/assets/mammoth-logo.png';

const navItems = [
  { label: 'Como Funciona', href: '/como-funciona' },
  { label: 'Depoimentos', href: '/depoimentos' },
  { label: 'Manual', href: '/manual' },
  { label: 'Testar', href: '/testar' },
  { label: 'Planos', href: '/planos' },
];

export function LandingHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-landing-dark/95 backdrop-blur-md border-b border-landing-brown/20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img src={mammothLogo} alt="Mamute Karaoke" className="w-10 h-10 md:w-12 md:h-12" />
            <span className="font-display font-bold text-xl md:text-2xl text-white">
              Mamute <span className="text-landing-orange">Karaoke</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`text-sm font-medium transition-colors hover:text-landing-orange ${
                  location.pathname === item.href ? 'text-landing-orange' : 'text-white/80'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link to="/app/login">
              <Button className="bg-landing-orange hover:bg-landing-orange/90 text-white font-semibold">
                Entrar no Sistema
              </Button>
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="lg:hidden bg-landing-dark border-t border-landing-brown/20">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`text-sm font-medium py-2 transition-colors ${
                  location.pathname === item.href ? 'text-landing-orange' : 'text-white/80'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link to="/app/login" onClick={() => setIsMenuOpen(false)}>
              <Button className="w-full bg-landing-orange hover:bg-landing-orange/90 text-white font-semibold mt-2">
                Entrar no Sistema
              </Button>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
