import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Loader2, VolumeX, Volume2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ConsentTermsModalProps {
  open: boolean;
  onAccept: (allowVoting: boolean) => void;
  isSubmitting?: boolean;
}

export function ConsentTermsModal({ open, onAccept, isSubmitting = false }: ConsentTermsModalProps) {
  const [votingPreference, setVotingPreference] = useState<'allow' | 'deny'>('allow');
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleSubmit = () => {
    if (!termsAccepted) return;
    onAccept(votingPreference === 'allow');
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-lg max-h-[90vh]" 
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-5 w-5 text-primary" />
            Consentimento e Votação
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Terms Text */}
            <div className="p-4 rounded-lg bg-muted/50 border border-border text-sm leading-relaxed">
              <p className="mb-3">
                Ao me inscrever para cantar no <strong>Mamute Karaoke</strong>, autorizo a exibição do nome ou apelido informado e, caso eu permita, da nota média da minha apresentação no site e na tela principal do evento, exclusivamente para fins de entretenimento.
              </p>
              <p className="text-muted-foreground">
                Entendo que as notas fazem parte de uma brincadeira e não representam avaliação técnica ou profissional.
              </p>
            </div>

            {/* Voting Preference */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Preferência de votação:</Label>
              <RadioGroup
                value={votingPreference}
                onValueChange={(value) => setVotingPreference(value as 'allow' | 'deny')}
                className="space-y-3"
              >
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-accent/20 transition-colors">
                  <RadioGroupItem value="allow" id="allow-voting" />
                  <Label htmlFor="allow-voting" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Volume2 className="h-4 w-4 text-green-500" />
                    <span>Quero ser votado</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-accent/20 transition-colors">
                  <RadioGroupItem value="deny" id="deny-voting" />
                  <Label htmlFor="deny-voting" className="flex items-center gap-2 cursor-pointer flex-1">
                    <VolumeX className="h-4 w-4 text-orange-500" />
                    <span>Não quero ser votado</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Info about choice */}
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-3 rounded-lg bg-accent/20 border border-accent/30 text-sm"
            >
              {votingPreference === 'allow' ? (
                <p className="text-muted-foreground">
                  ✨ Sua apresentação receberá votos e sua nota será exibida em tempo real para todos os participantes.
                </p>
              ) : (
                <p className="text-muted-foreground">
                  🎤 Sua apresentação será exibida com a mensagem "Apresentação sem votação". Nenhuma nota será registrada.
                </p>
              )}
            </motion.div>

            {/* Terms Acceptance */}
            <div className="flex items-start space-x-3 p-4 rounded-lg border-2 border-primary/30 bg-primary/5">
              <Checkbox
                id="accept-terms"
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                className="mt-0.5"
              />
              <Label 
                htmlFor="accept-terms" 
                className="cursor-pointer text-sm leading-relaxed"
              >
                Aceito os termos e quero cantar
              </Label>
            </div>

            {/* Rules Link */}
            <a 
              href="/app/regras" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              <span>⚙️ Regras de funcionamento do sistema</span>
            </a>
          </div>
        </ScrollArea>

        <div className="pt-4 border-t">
          <Button 
            onClick={handleSubmit} 
            className="w-full" 
            disabled={!termsAccepted || isSubmitting}
            size="lg"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Continuar para seleção de música
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
