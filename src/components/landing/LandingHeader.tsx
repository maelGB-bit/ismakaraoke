import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useLanguage } from '@/i18n/LanguageContext';
const mamuteLogo = '/img/mamute-logo.png';

export function LandingHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { t } = useLanguage();

  const navItems = [
    { label: t('landing.nav.howItWorks'), href: '/como-funciona' },
    { label: t('landing.nav.testimonials'), href: '/depoimentos' },
    { label: t('landing.nav.manual'), href: '/manual' },
    { label: t('landing.nav.tryIt'), href: '/testar' },
    { label: t('landing.nav.plans'), href: '/planos' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-landing-dark/95 backdrop-blur-md border-b border-landing-brown/20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img src={mamuteLogo} alt="Mamute Karaokê" className="w-10 h-10 md:w-12 md:h-12" />
            <span className="font-display font-bold text-xl md:text-2xl text-white">
              Mamute <span className="text-landing-orange">Karaokê</span>
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
            <LanguageSwitcher className="text-white/80 hover:text-landing-orange" />
            <Link to="/app/login">
              <Button className="bg-landing-orange hover:bg-landing-orange/90 text-white font-semibold">
                {t('landing.nav.enterSystem')}
              </Button>
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 lg:hidden">
            <LanguageSwitcher className="text-white/80 hover:text-landing-orange" />
            <button
              className="p-2 text-white"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
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
                {t('landing.nav.enterSystem')}
              </Button>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
