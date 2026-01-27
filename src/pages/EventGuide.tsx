import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Mic2, 
  Users, 
  Vote, 
  Trophy, 
  Music, 
  Shield, 
  Smartphone,
  QrCode,
  ArrowLeft,
  Download,
  Printer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import { HostAuth } from '@/components/HostAuth';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

function EventGuideContent() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const baseUrl = window.location.origin;

  const handlePrintQRCodes = () => {
    window.print();
  };

  return (
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <header className="p-4 flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('guide.back')}
        </Button>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={handlePrintQRCodes}
            className="gap-2 print:hidden"
          >
            <Printer className="w-4 h-4" />
            {t('guide.printQR')}
          </Button>
          <LanguageSwitcher />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-black font-display neon-text-pink mb-4">
            {t('guide.title')}
          </h1>
          <p className="text-xl text-muted-foreground">
            {t('guide.subtitle')}
          </p>
        </motion.div>

        {/* Host Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-primary/20 rounded-full">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-primary">{t('guide.hostSection')}</h2>
              <p className="text-sm text-muted-foreground">{t('guide.hostExclusive')}</p>
            </div>
          </div>
          
          <div className="space-y-4 text-muted-foreground">
            <p>{t('guide.hostDesc1')}</p>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start gap-2">
                <Mic2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span>{t('guide.hostFeature1')}</span>
              </li>
              <li className="flex items-start gap-2">
                <Users className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span>{t('guide.hostFeature2')}</span>
              </li>
              <li className="flex items-start gap-2">
                <Trophy className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span>{t('guide.hostFeature3')}</span>
              </li>
            </ul>
            <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
              <p className="text-primary font-semibold flex items-center gap-2">
                <Shield className="w-4 h-4" />
                {t('guide.hostWarning')}
              </p>
            </div>
          </div>
        </motion.section>

        {/* Participant Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6 mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-accent/20 rounded-full">
              <Users className="w-8 h-8 text-accent" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-accent">{t('guide.participantSection')}</h2>
              <p className="text-sm text-muted-foreground">{t('guide.participantOpen')}</p>
            </div>
          </div>
          
          <div className="space-y-4 text-muted-foreground">
            <p>{t('guide.participantDesc1')}</p>
            
            {/* Voting */}
            <div className="bg-secondary/50 p-4 rounded-lg">
              <h3 className="font-bold flex items-center gap-2 text-foreground mb-2">
                <Vote className="w-5 h-5 text-accent" />
                {t('guide.votingTitle')}
              </h3>
              <ul className="space-y-1 text-sm">
                <li>• {t('guide.votingStep1')}</li>
                <li>• {t('guide.votingStep2')}</li>
                <li>• {t('guide.votingStep3')}</li>
                <li>• {t('guide.votingStep4')}</li>
              </ul>
            </div>
            
            {/* Song Selection */}
            <div className="bg-secondary/50 p-4 rounded-lg">
              <h3 className="font-bold flex items-center gap-2 text-foreground mb-2">
                <Music className="w-5 h-5 text-accent" />
                {t('guide.songTitle')}
              </h3>
              <ul className="space-y-1 text-sm">
                <li>• {t('guide.songStep1')}</li>
                <li>• {t('guide.songStep2')}</li>
                <li>• {t('guide.songStep3')}</li>
                <li>• {t('guide.songStep4')}</li>
              </ul>
            </div>
            
            {/* Ranking */}
            <div className="bg-secondary/50 p-4 rounded-lg">
              <h3 className="font-bold flex items-center gap-2 text-foreground mb-2">
                <Trophy className="w-5 h-5 text-accent" />
                {t('guide.rankingTitle')}
              </h3>
              <ul className="space-y-1 text-sm">
                <li>• {t('guide.rankingStep1')}</li>
                <li>• {t('guide.rankingStep2')}</li>
              </ul>
            </div>
          </div>
        </motion.section>

        {/* QR Codes Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6 mb-8 print:break-before-page"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-secondary rounded-full">
              <QrCode className="w-8 h-8 text-foreground" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{t('guide.qrSection')}</h2>
              <p className="text-sm text-muted-foreground">{t('guide.qrDesc')}</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Vote QR Code */}
            <div className="text-center">
              <div className="bg-white p-6 rounded-2xl inline-block mb-4 neon-glow-pink">
                <QRCodeSVG
                  value={`${baseUrl}/vote`}
                  size={180}
                  level="H"
                  includeMargin={false}
                />
              </div>
              <h3 className="text-xl font-bold text-primary mb-2">
                <Vote className="w-5 h-5 inline mr-2" />
                {t('guide.qrVote')}
              </h3>
              <p className="text-sm text-muted-foreground mb-2">{t('guide.qrVoteDesc')}</p>
              <code className="text-xs bg-secondary px-2 py-1 rounded break-all">
                {baseUrl}/vote
              </code>
            </div>
            
            {/* Sign Up QR Code */}
            <div className="text-center">
              <div className="bg-white p-6 rounded-2xl inline-block mb-4 neon-glow-cyan">
                <QRCodeSVG
                  value={`${baseUrl}/inscricao`}
                  size={180}
                  level="H"
                  includeMargin={false}
                />
              </div>
              <h3 className="text-xl font-bold text-accent mb-2">
                <Music className="w-5 h-5 inline mr-2" />
                {t('guide.qrSignup')}
              </h3>
              <p className="text-sm text-muted-foreground mb-2">{t('guide.qrSignupDesc')}</p>
              <code className="text-xs bg-secondary px-2 py-1 rounded break-all">
                {baseUrl}/inscricao
              </code>
            </div>
          </div>
          
          <div className="mt-8 bg-accent/10 p-4 rounded-lg border border-accent/20 print:hidden">
            <p className="text-accent font-semibold flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              {t('guide.qrTip')}
            </p>
          </div>
        </motion.section>

        {/* Print-only QR Cards */}
        <div className="hidden print:block">
          <div className="page-break-before grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={`vote-${i}`} className="border-2 border-dashed border-gray-300 p-4 text-center">
                <QRCodeSVG value={`${baseUrl}/vote`} size={120} level="H" />
                <p className="mt-2 font-bold text-lg">{t('guide.qrVote')}</p>
                <p className="text-sm text-gray-600">{t('guide.scanToVote')}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            {[...Array(4)].map((_, i) => (
              <div key={`signup-${i}`} className="border-2 border-dashed border-gray-300 p-4 text-center">
                <QRCodeSVG value={`${baseUrl}/inscricao`} size={120} level="H" />
                <p className="mt-2 font-bold text-lg">{t('guide.qrSignup')}</p>
                <p className="text-sm text-gray-600">{t('guide.scanToSing')}</p>
              </div>
            ))}
          </div>
        </div>

        {/* How it Works Summary */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6 print:hidden"
        >
          <h2 className="text-2xl font-bold mb-6 text-center">{t('guide.howItWorks')}</h2>
          
          <div className="grid md:grid-cols-4 gap-4">
            <div className="text-center p-4">
              <div className="bg-primary/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h3 className="font-bold mb-1">{t('guide.step1Title')}</h3>
              <p className="text-sm text-muted-foreground">{t('guide.step1Desc')}</p>
            </div>
            
            <div className="text-center p-4">
              <div className="bg-accent/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold text-accent">2</span>
              </div>
              <h3 className="font-bold mb-1">{t('guide.step2Title')}</h3>
              <p className="text-sm text-muted-foreground">{t('guide.step2Desc')}</p>
            </div>
            
            <div className="text-center p-4">
              <div className="bg-primary/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <h3 className="font-bold mb-1">{t('guide.step3Title')}</h3>
              <p className="text-sm text-muted-foreground">{t('guide.step3Desc')}</p>
            </div>
            
            <div className="text-center p-4">
              <div className="bg-accent/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold text-accent">4</span>
              </div>
              <h3 className="font-bold mb-1">{t('guide.step4Title')}</h3>
              <p className="text-sm text-muted-foreground">{t('guide.step4Desc')}</p>
            </div>
          </div>
        </motion.section>

        {/* Go to Host Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-8 print:hidden"
        >
          <Button 
            size="lg" 
            onClick={() => navigate('/host')}
            className="font-bold bg-primary hover:bg-primary/90 neon-glow-pink"
          >
            <Mic2 className="mr-2 h-5 w-5" />
            {t('guide.goToHost')}
          </Button>
        </motion.div>
      </main>
    </div>
  );
}

export default function EventGuide() {
  return (
    <HostAuth>
      <EventGuideContent />
    </HostAuth>
  );
}
