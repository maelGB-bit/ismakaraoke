import { useState, useEffect } from 'react';
import { Settings, Key, Eye, EyeOff, Save, Loader2, CreditCard, AlertCircle, CheckCircle, RefreshCw, Edit2, Mail, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SecretField {
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  placeholder: string;
  category: 'stripe_test' | 'stripe_live' | 'email';
}

interface SecretStatus {
  exists: boolean;
  updatedAt: string | null;
  isTestKey: boolean | null;
}

const SECRET_FIELDS: SecretField[] = [
  // Test Mode Keys
  {
    key: 'STRIPE_SECRET_KEY_TEST',
    label: 'Stripe Secret Key (Teste)',
    description: 'Chave secreta do Stripe para modo de teste (sk_test_...)',
    icon: <CreditCard className="h-4 w-4" />,
    placeholder: 'sk_test_...',
    category: 'stripe_test',
  },
  {
    key: 'STRIPE_WEBHOOK_SECRET_TEST',
    label: 'Stripe Webhook Secret (Teste)',
    description: 'Secret para verificar webhooks do Stripe em modo de teste.',
    icon: <CreditCard className="h-4 w-4" />,
    placeholder: 'whsec_...',
    category: 'stripe_test',
  },
  // Live Mode Keys
  {
    key: 'STRIPE_SECRET_KEY_LIVE',
    label: 'Stripe Secret Key (Produção)',
    description: 'Chave secreta do Stripe para modo de produção (sk_live_...)',
    icon: <CreditCard className="h-4 w-4" />,
    placeholder: 'sk_live_...',
    category: 'stripe_live',
  },
  {
    key: 'STRIPE_WEBHOOK_SECRET_LIVE',
    label: 'Stripe Webhook Secret (Produção)',
    description: 'Secret para verificar webhooks do Stripe em modo de produção.',
    icon: <CreditCard className="h-4 w-4" />,
    placeholder: 'whsec_...',
    category: 'stripe_live',
  },
  // Email
  {
    key: 'RESEND_API_KEY',
    label: 'Resend API Key',
    description: 'Chave da API do Resend para envio de e-mails de credenciais.',
    icon: <Mail className="h-4 w-4" />,
    placeholder: 're_...',
    category: 'email',
  },
];

export function AdminSecrets() {
  const { toast } = useToast();
  const [secrets, setSecrets] = useState<Record<string, string>>({});
  const [secretsStatus, setSecretsStatus] = useState<Record<string, SecretStatus>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, { valid: boolean; message: string }>>({});
  const [editMode, setEditMode] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [stripeMode, setStripeMode] = useState<'test' | 'live'>('test');
  const [switchingMode, setSwitchingMode] = useState(false);

  const fetchSecretsStatus = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await supabase.functions.invoke('get-secrets-status', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.error) throw response.error;

      if (response.data?.secrets) {
        setSecretsStatus(response.data.secrets);
      }
      if (response.data?.stripeMode) {
        setStripeMode(response.data.stripeMode);
      }
    } catch (error) {
      console.error('Error fetching secrets status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecretsStatus();
  }, []);

  const handleSecretChange = (key: string, value: string) => {
    setSecrets(prev => ({ ...prev, [key]: value }));
    setTestResults(prev => {
      const newResults = { ...prev };
      delete newResults[key];
      return newResults;
    });
  };

  const toggleShowSecret = (key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleEditMode = (key: string) => {
    setEditMode(prev => ({ ...prev, [key]: !prev[key] }));
    if (!editMode[key]) {
      setSecrets(prev => ({ ...prev, [key]: '' }));
    }
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

      setSecrets(prev => ({ ...prev, [key]: '' }));
      setShowSecrets(prev => ({ ...prev, [key]: false }));
      setEditMode(prev => ({ ...prev, [key]: false }));
      
      // Refresh status
      await fetchSecretsStatus();
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

  const handleSwitchMode = async (newMode: 'test' | 'live') => {
    // Check if we have keys configured for the new mode
    const secretKeyForMode = newMode === 'live' ? 'STRIPE_SECRET_KEY_LIVE' : 'STRIPE_SECRET_KEY_TEST';
    const webhookKeyForMode = newMode === 'live' ? 'STRIPE_WEBHOOK_SECRET_LIVE' : 'STRIPE_WEBHOOK_SECRET_TEST';
    
    const hasSecretKey = secretsStatus[secretKeyForMode]?.exists;
    const hasWebhookKey = secretsStatus[webhookKeyForMode]?.exists;

    if (!hasSecretKey || !hasWebhookKey) {
      toast({
        title: 'Chaves não configuradas',
        description: `Configure as chaves de ${newMode === 'live' ? 'produção' : 'teste'} antes de trocar o modo.`,
        variant: 'destructive',
      });
      return;
    }

    setSwitchingMode(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      const response = await supabase.functions.invoke('update-secret', {
        body: { key: 'STRIPE_MODE', value: newMode },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.error) throw response.error;

      setStripeMode(newMode);
      toast({
        title: 'Modo alterado!',
        description: `Stripe agora está em modo ${newMode === 'live' ? 'PRODUÇÃO' : 'TESTE'}.`,
      });

      await fetchSecretsStatus();
    } catch (error) {
      console.error('Error switching mode:', error);
      toast({
        title: 'Erro ao trocar modo',
        description: 'Não foi possível alterar o modo do Stripe.',
        variant: 'destructive',
      });
    } finally {
      setSwitchingMode(false);
    }
  };

  const renderSecretField = (field: SecretField) => {
    const value = secrets[field.key] || '';
    const isShowing = showSecrets[field.key];
    const isSaving = saving[field.key];
    const isTesting = testing[field.key];
    const testResult = testResults[field.key];
    const status = secretsStatus[field.key];
    const isEditing = editMode[field.key];

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
          <div className="flex items-center gap-2">
            {status?.exists && (
              <Badge variant="default">
                Configurada
              </Badge>
            )}
            {!status?.exists && (
              <Badge variant="outline" className="text-amber-600 border-amber-600">
                Não configurada
              </Badge>
            )}
          </div>
        </div>

        {/* Current status */}
        {status?.exists && !isEditing && (
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-muted-foreground">
                Configurada em {status.updatedAt ? format(new Date(status.updatedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'N/A'}
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => toggleEditMode(field.key)}
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Alterar
            </Button>
          </div>
        )}

        {/* Edit/Create form */}
        {(!status?.exists || isEditing) && (
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
              {(field.key === 'STRIPE_SECRET_KEY_TEST' || field.key === 'STRIPE_SECRET_KEY_LIVE') && (
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
              {isEditing && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleEditMode(field.key)}
                >
                  Cancelar
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configurações do Stripe
            </CardTitle>
            <CardDescription>
              Gerencie as chaves do Stripe para processamento de pagamentos. Configure chaves de Teste e Produção separadamente.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSecretsStatus}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mode Switcher */}
        <div className="p-4 border rounded-lg bg-gradient-to-r from-muted/50 to-muted">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                {stripeMode === 'live' ? (
                  <ToggleRight className="h-5 w-5 text-green-500" />
                ) : (
                  <ToggleLeft className="h-5 w-5 text-amber-500" />
                )}
                Modo Atual: {stripeMode === 'live' ? 'PRODUÇÃO' : 'TESTE'}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {stripeMode === 'live' 
                  ? 'Pagamentos REAIS estão sendo processados. Use com cuidado!'
                  : 'Modo de teste ativo. Nenhum pagamento real será processado.'
                }
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={stripeMode === 'test' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleSwitchMode('test')}
                disabled={switchingMode || stripeMode === 'test'}
              >
                {switchingMode && stripeMode !== 'test' ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Teste
              </Button>
              <Button
                variant={stripeMode === 'live' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleSwitchMode('live')}
                disabled={switchingMode || stripeMode === 'live'}
                className={stripeMode === 'live' ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                {switchingMode && stripeMode !== 'live' ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Produção
              </Button>
            </div>
          </div>
          {stripeMode === 'live' && (
            <div className="mt-3 p-2 bg-green-500/10 border border-green-500/20 rounded-md">
              <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                <AlertCircle className="h-4 w-4" />
                <strong>Atenção:</strong> Pagamentos reais estão ativos! Ao mudar de modo, os Price IDs dos planos serão alternados automaticamente.
              </div>
            </div>
          )}
        </div>

        {/* Stripe Test Keys Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="h-5 w-5 text-amber-500" />
            <h3 className="font-semibold text-lg">Stripe - Modo Teste</h3>
            {stripeMode === 'test' && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                Ativo
              </Badge>
            )}
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              {SECRET_FIELDS.filter(f => f.category === 'stripe_test').map(renderSecretField)}
            </div>
          )}
        </div>

        {/* Stripe Live Keys Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="h-5 w-5 text-green-500" />
            <h3 className="font-semibold text-lg">Stripe - Modo Produção</h3>
            {stripeMode === 'live' && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Ativo
              </Badge>
            )}
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              {SECRET_FIELDS.filter(f => f.category === 'stripe_live').map(renderSecretField)}
            </div>
          )}
        </div>

        {/* Email Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Mail className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">E-mail (Resend)</h3>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              {SECRET_FIELDS.filter(f => f.category === 'email').map(renderSecretField)}
            </div>
          )}
          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-start gap-2">
              <Mail className="h-4 w-4 text-blue-500 mt-0.5" />
              <div className="text-sm text-blue-700 dark:text-blue-400">
                <strong>Importante:</strong> Esta chave é necessária para enviar e-mails com credenciais 
                de acesso para novos coordenadores após o pagamento.
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
