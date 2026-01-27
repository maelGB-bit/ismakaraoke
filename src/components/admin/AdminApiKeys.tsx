import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Key, Plus, Pencil, Trash2, Loader2, Check, X, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

    if (!editingId && !apiKey.trim()) {
      toast({ title: 'Digite a chave de API', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const body = editingId 
        ? { id: editingId, name, provider }
        : { name, provider, key: apiKey };

      const response = await supabase.functions.invoke('api-keys', {
        method: editingId ? 'PATCH' : 'POST',
        body,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) throw response.error;

      toast({ title: editingId ? 'Chave atualizada!' : 'Chave criada!' });
      resetForm();
      fetchKeys();
    } catch (error) {
      console.error('Error saving API key:', error);
      toast({ title: 'Erro ao salvar chave', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      await supabase.functions.invoke('api-keys', {
        method: 'PATCH',
        body: { id, is_active: !isActive },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
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
        method: 'DELETE',
        body: { id },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
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
    setIsDialogOpen(false);
  };

  const openEditDialog = (key: ApiKey) => {
    setName(key.name);
    setProvider(key.provider);
    setEditingId(key.id);
    setIsDialogOpen(true);
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
              Gerencie as chaves de API usadas no projeto
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsDialogOpen(open); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Chave
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? 'Editar Chave' : 'Nova Chave de API'}</DialogTitle>
                <DialogDescription>
                  {editingId 
                    ? 'Edite o nome ou provedor da chave. A chave em si não pode ser alterada.'
                    : 'Adicione uma nova chave de API ao sistema.'}
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
                {!editingId && (
                  <div className="space-y-2">
                    <Label htmlFor="key">Chave de API</Label>
                    <div className="relative">
                      <Input
                        id="key"
                        type={showKey ? 'text' : 'password'}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Cole a chave aqui"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      A chave será criptografada e nunca mais será exibida por completo.
                    </p>
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
