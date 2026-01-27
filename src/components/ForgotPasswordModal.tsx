import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ForgotPasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ForgotPasswordModal({ open, onOpenChange }: ForgotPasswordModalProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({ title: 'Digite seu email', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/`,
      });

      if (error) throw error;

      setEmailSent(true);
      toast({ title: 'Email enviado com sucesso!' });
    } catch (error: unknown) {
      console.error('Error sending reset email:', error);
      const message = error instanceof Error ? error.message : 'Erro ao enviar email';
      toast({ title: message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setEmailSent(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Esqueci minha senha
          </DialogTitle>
          <DialogDescription>
            {emailSent 
              ? 'Verifique sua caixa de entrada para redefinir sua senha.'
              : 'Digite seu email para receber um link de redefinição de senha.'
            }
          </DialogDescription>
        </DialogHeader>

        {emailSent ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <CheckCircle className="h-16 w-16 text-green-500" />
            <p className="text-center text-muted-foreground">
              Enviamos um email para <strong>{email}</strong> com instruções para redefinir sua senha.
            </p>
            <Button onClick={handleClose} className="w-full">
              Fechar
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email</Label>
              <Input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Enviar link de redefinição'
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
