import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Phone, Mail, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/i18n/LanguageContext';
import { UserProfile } from '@/hooks/useUserProfile';

interface UserRegistrationModalProps {
  onComplete: (profile: UserProfile) => void;
}

export function UserRegistrationModal({ onComplete }: UserRegistrationModalProps) {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    onComplete({
      name: name.trim(),
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-6 max-w-md w-full space-y-6"
      >
        <div className="text-center space-y-2">
          <Mic className="h-12 w-12 text-primary mx-auto" />
          <h2 className="text-2xl font-display font-bold text-gradient">
            {t('registration.title')}
          </h2>
          <p className="text-muted-foreground text-sm">
            {t('registration.subtitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reg-name" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              {t('registration.name')} *
            </Label>
            <Input
              id="reg-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('registration.namePlaceholder')}
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reg-phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              {t('registration.phone')}
            </Label>
            <Input
              id="reg-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t('registration.phonePlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reg-email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              {t('registration.email')}
            </Label>
            <Input
              id="reg-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('registration.emailPlaceholder')}
            />
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={!name.trim()}>
            <Mic className="mr-2 h-5 w-5" />
            {t('registration.continue')}
          </Button>
        </form>

        <p className="text-xs text-muted-foreground text-center">
          {t('registration.privacyNote')}
        </p>
      </motion.div>
    </div>
  );
}
