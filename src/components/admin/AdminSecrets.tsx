import { useState } from 'react';
import { Settings, Key, Eye, EyeOff, Save, Loader2, CreditCard, Youtube, Bot, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SecretField {
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  placeholder: string;
  category: 'stripe' | 'youtube' | 'ai';
}

const SECRET_FIELDS: SecretField[] = [
  {
    key: 'STRIPE_SECRET_KEY',
    label: 'Stripe Secret Key',
    description: 'Chave secreta do Stripe para processar pagamentos. Use sk_test_ para testes ou sk_live_ para produção.',
    icon: <CreditCard className="h-4 w-4" />,
    placeholder: 'sk_test_... ou sk_live_...',
    category: 'stripe',
  },
  {
    key: 'STRIPE_WEBHOOK_SECRET',
    label: 'Stripe Webhook Secret',
    description: 'Secret para verificar assinaturas de webhooks do Stripe.',
    icon: <CreditCard className="h-4 w-4" />,
    placeholder: 'whsec_...',
    category: 'stripe',
  },
  {
    key: 'YOUTUBE_API_KEY',
    label: 'YouTube API Key',
    description: 'Chave da API do YouTube para buscar vídeos de karaokê.',
    icon: <Youtube className="h-4 w-4" />,
    placeholder: 'AIza...',
    category: 'youtube',
  },
  {
    key: 'LOVABLE_API_KEY',
    label: 'Lovable AI API Key',
    description: 'Chave da API do Lovable AI (gerenciada automaticamente).',
    icon: <Bot className="h-4 w-4" />,
    placeholder: 'Gerenciada pelo sistema',
    category: 'ai',
  },
];

export function AdminSecrets() {
  const { toast } = useToast();
  const [secrets, setSecrets] = useState<Record<string, string>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, { valid: boolean; message: string }>>({});

  const handleSecretChange = (key: string, value: string) => {
    setSecrets(prev => ({ ...prev, [key]: value }));
    // Clear test result when value changes
    setTestResults(prev => {
      const newResults = { ...prev };
      delete newResults[key];
      return newResults;
    });
  };

  const toggleShowSecret = (key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async (key: string) => {
    const value = secrets[key];
    if (!value?.trim()) {
      toast({
        title: 'Valor vazio',
        description: 'Digite um valor para a chave antes de salvar.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(prev => ({ ...prev, [key]: true }));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      const response = await supabase.functions.invoke('update-secret', {
        body: { key, value: value.trim() },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.error) throw response.error;

      toast({
        title: 'Chave atualizada!',
        description: `${key} foi atualizada com sucesso.`,
      });

      // Clear the input after successful save
      setSecrets(prev => ({ ...prev, [key]: '' }));
      setShowSecrets(prev => ({ ...prev, [key]: false }));
    } catch (error) {
      console.error('Error saving secret:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível atualizar a chave. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setSaving(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleTestStripe = async (key: string) => {
    const value = secrets[key];
    if (!value?.trim()) {
      toast({
        title: 'Valor vazio',
        description: 'Digite uma chave para testar.',
        variant: 'destructive',
      });
      return;
    }

    setTesting(prev => ({ ...prev, [key]: true }));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      const response = await supabase.functions.invoke('test-stripe-key', {
        body: { key: value.trim() },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.error) throw response.error;

      setTestResults(prev => ({ ...prev, [key]: response.data }));
      
      toast({
        title: response.data.valid ? 'Chave válida!' : 'Chave inválida',
        description: response.data.message,
        variant: response.data.valid ? 'default' : 'destructive',
      });
    } catch (error) {
      console.error('Error testing key:', error);
      setTestResults(prev => ({ 
        ...prev, 
        [key]: { valid: false, message: 'Erro ao testar a chave' } 
      }));
    } finally {
      setTesting(prev => ({ ...prev, [key]: false }));
    }
  };

  const renderSecretField = (field: SecretField) => {
    const value = secrets[field.key] || '';
    const isShowing = showSecrets[field.key];
    const isSaving = saving[field.key];
    const isTesting = testing[field.key];
    const testResult = testResults[field.key];
    const isManaged = field.key === 'LOVABLE_API_KEY';

    return (
      <div key={field.key} className="space-y-3 p-4 border rounded-lg bg-card">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {field.icon}
            <div>
              <Label className="font-medium">{field.label}</Label>
              <p className="text-xs text-muted-foreground mt-0.5">{field.description}</p>
            </div>
          </div>
          {field.key.startsWith('STRIPE') && (
            <Badge variant={value.includes('live') ? 'default' : 'secondary'}>
              {value.includes('live') ? 'Produção' : 'Teste'}
            </Badge>
          )}
        </div>

        {isManaged ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle className="h-4 w-4 text-green-500" />
            Esta chave é gerenciada automaticamente pelo sistema.
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative">
              <Input
                type={isShowing ? 'text' : 'password'}
                value={value}
                onChange={(e) => handleSecretChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="pr-10 font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => toggleShowSecret(field.key)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {isShowing ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {testResult && (
              <div className={`flex items-center gap-2 p-2 rounded-md text-sm ${
                testResult.valid 
                  ? 'bg-green-500/10 text-green-600 border border-green-500/20' 
                  : 'bg-destructive/10 text-destructive border border-destructive/20'
              }`}>
                {testResult.valid ? (
                  <CheckCircle className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              {field.key === 'STRIPE_SECRET_KEY' && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleTestStripe(field.key)}
                  disabled={isTesting || !value.trim()}
                >
                  {isTesting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Key className="h-4 w-4 mr-2" />
                  )}
                  Testar
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                onClick={() => handleSave(field.key)}
                disabled={isSaving || !value.trim()}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Salvar
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const stripeFields = SECRET_FIELDS.filter(f => f.category === 'stripe');
  const youtubeFields = SECRET_FIELDS.filter(f => f.category === 'youtube');
  const aiFields = SECRET_FIELDS.filter(f => f.category === 'ai');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configurações de API
        </CardTitle>
        <CardDescription>
          Gerencie as chaves de API e secrets do sistema. As chaves são armazenadas de forma segura e criptografadas.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stripe Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">Stripe (Pagamentos)</h3>
          </div>
          <div className="space-y-4">
            {stripeFields.map(renderSecretField)}
          </div>
          <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
              <div className="text-sm text-amber-700 dark:text-amber-400">
                <strong>Dica:</strong> Para ativar pagamentos reais, substitua as chaves de teste (sk_test_) 
                pelas chaves de produção (sk_live_) do seu dashboard do Stripe.
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* YouTube Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Youtube className="h-5 w-5 text-red-500" />
            <h3 className="font-semibold text-lg">YouTube</h3>
          </div>
          <div className="space-y-4">
            {youtubeFields.map(renderSecretField)}
          </div>
        </div>

        <Separator />

        {/* AI Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Bot className="h-5 w-5 text-purple-500" />
            <h3 className="font-semibold text-lg">Inteligência Artificial</h3>
          </div>
          <div className="space-y-4">
            {aiFields.map(renderSecretField)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
