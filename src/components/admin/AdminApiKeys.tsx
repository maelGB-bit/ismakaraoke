import { useState, useEffect } from 'react';
import { Key, Plus, Pencil, Trash2, Loader2, Eye, EyeOff, CheckCircle, XCircle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { ApiKey } from '@/types/admin';

const PROVIDERS = [
  { value: 'youtube', label: 'YouTube' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'stripe', label: 'Stripe' },
  { value: 'other', label: 'Outro' },
];

export function AdminApiKeys() {
  const { toast } = useToast();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testingKeyId, setTestingKeyId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { valid: boolean; message: string }>>({});
  const [testResult, setTestResult] = useState<{ valid: boolean; message: string } | null>(null);
  const [loadingKey, setLoadingKey] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [provider, setProvider] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchKeys = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await supabase.functions.invoke('api-keys', {
        body: { action: 'list' },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) throw response.error;
      setKeys(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching API keys:', error);
      toast({ title: 'Erro ao carregar chaves', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleSubmit = async () => {
    if (!name.trim() || !provider) {
      toast({ title: 'Preencha todos os campos', variant: 'destructive' });
      return;
    }

    if (!apiKey.trim()) {
      toast({ title: 'Digite a chave de API', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Check if key contains multiple keys separated by comma
      const keysToCreate = apiKey.split(',').map(k => k.trim()).filter(k => k.length > 0);
      
      if (editingId) {
        // Update existing key
        const response = await supabase.functions.invoke('api-keys', {
          body: { action: 'update', id: editingId, name, provider, key: keysToCreate[0] },
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (response.error) throw response.error;
        toast({ title: 'Chave atualizada!' });
      } else {
        // Create new keys - if multiple, create one for each
        for (let i = 0; i < keysToCreate.length; i++) {
          const keyName = keysToCreate.length > 1 ? `${name} ${i + 1}` : name;
          const response = await supabase.functions.invoke('api-keys', {
            body: { action: 'create', name: keyName, provider, key: keysToCreate[i] },
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
          if (response.error) throw response.error;
        }
        toast({ 
          title: keysToCreate.length > 1 
            ? `${keysToCreate.length} chaves criadas!` 
            : 'Chave criada!' 
        });
      }

      resetForm();
      fetchKeys();
    } catch (error) {
      console.error('Error saving API key:', error);
      toast({ title: 'Erro ao salvar chave', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestKey = async () => {
    if (!apiKey.trim()) {
      toast({ title: 'Digite uma chave para testar', variant: 'destructive' });
      return;
    }

    // Test only the first key if multiple
    const keyToTest = apiKey.split(',')[0].trim();

    setIsTesting(true);
    setTestResult(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('api-keys', {
        body: { action: 'test_key', key: keyToTest },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.error) throw response.error;
      setTestResult(response.data);
    } catch (error) {
      console.error('Error testing API key:', error);
      setTestResult({ valid: false, message: 'Erro ao testar chave' });
    } finally {
      setIsTesting(false);
    }
  };

  // Test a key from the list view
  const handleTestKeyFromList = async (keyId: string) => {
    setTestingKeyId(keyId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // First get the full key
      const getKeyResponse = await supabase.functions.invoke('api-keys', {
        body: { action: 'get_key', id: keyId },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (getKeyResponse.error) throw getKeyResponse.error;
      const fullKey = getKeyResponse.data?.data?.key;
      
      if (!fullKey) {
        setTestResults(prev => ({ ...prev, [keyId]: { valid: false, message: 'Não foi possível obter a chave' } }));
        return;
      }

      // Now test the key
      const response = await supabase.functions.invoke('api-keys', {
        body: { action: 'test_key', key: fullKey },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.error) throw response.error;
      setTestResults(prev => ({ ...prev, [keyId]: response.data }));
      
      toast({
        title: response.data.valid ? 'Chave válida!' : 'Chave inválida',
        description: response.data.message,
        variant: response.data.valid ? 'default' : 'destructive',
      });
    } catch (error) {
      console.error('Error testing API key:', error);
      setTestResults(prev => ({ ...prev, [keyId]: { valid: false, message: 'Erro ao testar chave' } }));
    } finally {
      setTestingKeyId(null);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      await supabase.functions.invoke('api-keys', {
        body: { action: 'update', id, is_active: !isActive },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      setKeys(keys.map(k => k.id === id ? { ...k, is_active: !isActive } : k));
      toast({ title: !isActive ? 'Chave ativada' : 'Chave desativada' });
    } catch (error) {
      console.error('Error toggling API key:', error);
      toast({ title: 'Erro ao alterar status', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta chave?')) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      await supabase.functions.invoke('api-keys', {
        body: { action: 'delete', id },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      setKeys(keys.filter(k => k.id !== id));
      toast({ title: 'Chave excluída' });
    } catch (error) {
      console.error('Error deleting API key:', error);
      toast({ title: 'Erro ao excluir chave', variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setName('');
    setProvider('');
    setApiKey('');
    setShowKey(false);
    setEditingId(null);
    setTestResult(null);
    setIsDialogOpen(false);
  };

  const openEditDialog = async (key: ApiKey) => {
    setName(key.name);
    setProvider(key.provider);
    setEditingId(key.id);
    setApiKey('');
    setTestResult(null);
    setLoadingKey(true);
    setIsDialogOpen(true);

    // Fetch the full key for editing
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('api-keys', {
        body: { action: 'get_key', id: key.id },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.error) throw response.error;
      if (response.data?.data?.key) {
        setApiKey(response.data.data.key);
      }
    } catch (error) {
      console.error('Error fetching key:', error);
      toast({ title: 'Erro ao carregar chave', variant: 'destructive' });
    } finally {
      setLoadingKey(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Chaves de API
            </CardTitle>
            <CardDescription>
              Gerencie as chaves de API usadas no projeto. Cole múltiplas chaves separadas por vírgula para criar várias de uma vez.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {keys.filter(k => k.provider === 'youtube').length > 0 && (
              <Button
                variant="outline"
                onClick={async () => {
                  const youtubeKeys = keys.filter(k => k.provider === 'youtube');
                  for (const key of youtubeKeys) {
                    await handleTestKeyFromList(key.id);
                  }
                }}
                disabled={testingKeyId !== null}
              >
                <Zap className="mr-2 h-4 w-4" />
                Testar Todas
              </Button>
            )}
            <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsDialogOpen(open); }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Chave
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingId ? 'Editar Chave' : 'Nova Chave de API'}</DialogTitle>
                <DialogDescription>
                  {editingId 
                    ? 'Edite a chave de API. A chave será recriptografada ao salvar.'
                    : 'Adicione uma nova chave de API. Cole múltiplas chaves separadas por vírgula para criar várias de uma vez.'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: YouTube API Principal"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="provider">Provedor</Label>
                  <Select value={provider} onValueChange={setProvider}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o provedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROVIDERS.map(p => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="key">Chave(s) de API</Label>
                  {loadingKey ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <>
                      <div className="relative">
                        <Textarea
                          id="key"
                          value={showKey ? apiKey : apiKey.replace(/./g, '•')}
                          onChange={(e) => setApiKey(showKey ? e.target.value : apiKey)}
                          onFocus={() => setShowKey(true)}
                          placeholder="Cole a chave aqui (ou múltiplas separadas por vírgula)"
                          className="min-h-[100px] font-mono text-sm pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowKey(!showKey)}
                          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                        >
                          {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {apiKey.includes(',') 
                          ? `${apiKey.split(',').filter(k => k.trim()).length} chaves detectadas`
                          : 'Cole múltiplas chaves separadas por vírgula para criar várias de uma vez'}
                      </p>
                    </>
                  )}
                </div>
                
                {/* Test button for YouTube keys */}
                {provider === 'youtube' && apiKey.trim() && (
                  <div className="space-y-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleTestKey}
                      disabled={isTesting}
                      className="w-full"
                    >
                      {isTesting ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Zap className="h-4 w-4 mr-2" />
                      )}
                      Testar Chave
                    </Button>
                    {testResult && (
                      <div className={`flex items-center gap-2 p-3 rounded-md text-sm ${
                        testResult.valid 
                          ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                          : 'bg-destructive/10 text-destructive border border-destructive/20'
                      }`}>
                        {testResult.valid ? (
                          <CheckCircle className="h-4 w-4 flex-shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 flex-shrink-0" />
                        )}
                        <span>{testResult.message}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={resetForm}>Cancelar</Button>
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (editingId ? 'Salvar' : 'Criar')}
                </Button>
              </DialogFooter>
            </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : keys.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma chave de API cadastrada</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Provedor</TableHead>
                <TableHead>Chave</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Quota</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.map((key) => (
                <TableRow key={key.id}>
                  <TableCell className="font-medium">{key.name}</TableCell>
                  <TableCell className="capitalize">{key.provider}</TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">{key.key_preview}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={key.is_active}
                        onCheckedChange={() => handleToggleActive(key.id, key.is_active)}
                      />
                      <span className={key.is_active ? 'text-green-500' : 'text-muted-foreground'}>
                        {key.is_active ? 'Ativa' : 'Inativa'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {key.provider === 'youtube' && (
                      <div className="flex items-center gap-2">
                        {testingKeyId === key.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        ) : testResults[key.id] ? (
                          <div className="flex items-center gap-1">
                            {testResults[key.id].valid ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-destructive" />
                            )}
                            <span className={`text-xs ${testResults[key.id].valid ? 'text-green-500' : 'text-destructive'}`}>
                              {testResults[key.id].valid ? 'OK' : 'Sem quota'}
                            </span>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTestKeyFromList(key.id)}
                            className="h-7 text-xs"
                          >
                            <Zap className="h-3 w-3 mr-1" />
                            Testar
                          </Button>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(key)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(key.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
