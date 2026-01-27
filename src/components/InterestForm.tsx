import { useState } from 'react';
import { Loader2, Send, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { SubscriptionInterest } from '@/types/admin';
import { INTEREST_LABELS } from '@/types/admin';

export function InterestForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [interest, setInterest] = useState<SubscriptionInterest>('single_event');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !phone.trim()) {
      toast({ title: 'Preencha todos os campos', variant: 'destructive' });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast({ title: 'Email inválido', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('coordinator_requests')
        .insert({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          interest,
          status: 'pending',
        });

      if (error) {
        if (error.code === '23505') {
          toast({ title: 'Este email já possui uma solicitação', variant: 'destructive' });
        } else {
          throw error;
        }
        return;
      }

      setSubmitted(true);
      toast({ title: 'Solicitação enviada com sucesso!' });
    } catch (error) {
      console.error('Error submitting interest:', error);
      toast({ title: 'Erro ao enviar solicitação', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="glass-card p-6 rounded-xl text-center">
        <CheckCircle className="w-16 h-16 text-neon-green mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2">Solicitação Enviada!</h3>
        <p className="text-muted-foreground">
          Recebemos sua solicitação e entraremos em contato em breve. 
          Aguarde a aprovação do administrador.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 rounded-xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome completo</Label>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome"
            disabled={isSubmitting}
            maxLength={100}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="interest-email">Email</Label>
          <Input
            id="interest-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            disabled={isSubmitting}
            maxLength={255}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Celular</Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(11) 99999-9999"
            disabled={isSubmitting}
            maxLength={20}
          />
        </div>

        <div className="space-y-3">
          <Label>Qual seu interesse?</Label>
          <RadioGroup
            value={interest}
            onValueChange={(value) => setInterest(value as SubscriptionInterest)}
            className="grid grid-cols-2 gap-2"
          >
            {(Object.entries(INTEREST_LABELS) as [SubscriptionInterest, string][]).map(([value, label]) => (
              <div key={value} className="flex items-center space-x-2 glass-card p-3 rounded-lg">
                <RadioGroupItem value={value} id={value} />
                <Label htmlFor={value} className="cursor-pointer text-sm">{label}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Enviar Solicitação
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
