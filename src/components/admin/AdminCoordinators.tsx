import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Trash2, Loader2, Mail, Mic2, Clock, CalendarClock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Coordinator, KaraokeInstance } from '@/types/admin';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CoordinatorWithInstance extends Coordinator {
  instance?: KaraokeInstance;
  name?: string;
  last_access_at?: string | null;
}

// Helper function to calculate time remaining
function getTimeRemaining(expiresAt: string | null): { text: string; color: string } {
  if (!expiresAt) return { text: '-', color: 'text-muted-foreground' };
  
  const now = new Date();
  const expires = new Date(expiresAt);
  const diff = expires.getTime() - now.getTime();
  
  if (diff <= 0) return { text: 'Expirado', color: 'text-destructive' };
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) {
    return { 
      text: `${days}d ${hours}h`, 
      color: days <= 1 ? 'text-yellow-500' : 'text-green-500' 
    };
  } else if (hours > 0) {
    return { 
      text: `${hours}h ${minutes}min`, 
      color: hours <= 3 ? 'text-yellow-500' : 'text-green-500' 
    };
  } else {
    return { text: `${minutes}min`, color: 'text-destructive' };
  }
}

export function AdminCoordinators() {
  const { toast } = useToast();
  const [coordinators, setCoordinators] = useState<CoordinatorWithInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const fetchCoordinators = async () => {
    try {
      // Fetch all users with coordinator role
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role, created_at')
        .eq('role', 'coordinator');

      if (rolesError) throw rolesError;

      // Fetch instances for all coordinators
      const { data: instancesData } = await supabase
        .from('karaoke_instances')
        .select('*');

      // Fetch coordinator requests to get names, emails and last access
      const { data: requestsData } = await supabase
        .from('coordinator_requests')
        .select('user_id, name, email, status, last_access_at')
        .eq('status', 'approved');

      const instancesMap = new Map<string, KaraokeInstance>();
      instancesData?.forEach(inst => {
        instancesMap.set(inst.coordinator_id, inst as KaraokeInstance);
      });

      const requestsMap = new Map<string, { name: string; email: string; last_access_at: string | null }>();
      requestsData?.forEach(req => {
        if (req.user_id) {
          requestsMap.set(req.user_id, { name: req.name, email: req.email, last_access_at: req.last_access_at });
        }
      });

      // Build coordinators list with names, emails and last access
      const coords: CoordinatorWithInstance[] = (rolesData || []).map(role => {
        const requestInfo = requestsMap.get(role.user_id);
        return {
          id: role.user_id,
          email: requestInfo?.email || role.user_id.slice(0, 8) + '...',
          name: requestInfo?.name,
          role: role.role as 'coordinator',
          created_at: role.created_at,
          instance: instancesMap.get(role.user_id),
          last_access_at: requestInfo?.last_access_at,
        };
      });

      setCoordinators(coords);
    } catch (error) {
      console.error('Error fetching coordinators:', error);
      toast({ title: 'Erro ao carregar coordenadores', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoordinators();
  }, []);

  const handleCreateCoordinator = async () => {
    if (!email.trim() || !password.trim()) {
      toast({ title: 'Preencha todos os campos', variant: 'destructive' });
      return;
    }

    if (password.length < 8) {
      toast({ title: 'A senha deve ter pelo menos 8 caracteres', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      // Create user via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/host`,
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Erro ao criar usuário');

      // Add coordinator role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: authData.user.id, role: 'coordinator' });

      if (roleError) throw roleError;

      toast({ title: 'Coordenador criado!', description: `Email: ${email}` });
      resetForm();
      fetchCoordinators();
    } catch (error: unknown) {
      console.error('Error creating coordinator:', error);
      const message = error instanceof Error ? error.message : 'Erro ao criar coordenador';
      
      if (message.includes('already registered')) {
        toast({ title: 'Email já cadastrado', variant: 'destructive' });
      } else {
        toast({ title: message, variant: 'destructive' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCoordinator = async (id: string, email: string) => {
    if (!confirm('Tem certeza que deseja remover este coordenador? A instância associada também será removida.')) return;

    try {
      // First, update the coordinator_request to deleted_by_admin status
      await supabase
        .from('coordinator_requests')
        .update({ status: 'deleted_by_admin' })
        .eq('user_id', id);

      // Delete role
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', id)
        .eq('role', 'coordinator');

      if (error) throw error;

      // Delete the instance
      await supabase
        .from('karaoke_instances')
        .delete()
        .eq('coordinator_id', id);

      setCoordinators(coordinators.filter(c => c.id !== id));
      toast({ title: 'Coordenador removido', description: 'A solicitação foi movida para "Deletados pelo Admin"' });
    } catch (error) {
      console.error('Error deleting coordinator:', error);
      toast({ title: 'Erro ao remover coordenador', variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setIsDialogOpen(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Coordenadores
            </CardTitle>
            <CardDescription>
              Gerencie os coordenadores de eventos de karaoke
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Coordenador
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Coordenador</DialogTitle>
                <DialogDescription>
                  Crie uma conta para um novo coordenador de eventos.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="coord-email">Email</Label>
                  <Input
                    id="coord-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="coordenador@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="coord-password">Senha</Label>
                  <Input
                    id="coord-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={resetForm}>Cancelar</Button>
                <Button onClick={handleCreateCoordinator} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Criar'}
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
        ) : coordinators.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum coordenador cadastrado</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Coordenador</TableHead>
                <TableHead>Instância</TableHead>
                <TableHead>Último Acesso</TableHead>
                <TableHead>Tempo Restante</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coordinators.map((coord) => {
                const timeRemaining = getTimeRemaining(coord.instance?.expires_at || null);
                return (
                  <TableRow key={coord.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{coord.name || 'Sem nome'}</span>
                        <span className="text-xs text-muted-foreground">{coord.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {coord.instance ? (
                        <div className="flex items-center gap-2">
                          <Mic2 className="h-4 w-4 text-primary" />
                          <span>{coord.instance.name}</span>
                          <Badge variant="outline" className="text-xs">{coord.instance.instance_code}</Badge>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Sem instância</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {coord.last_access_at ? (
                        <div className="flex items-center gap-1">
                          <CalendarClock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">
                            {format(new Date(coord.last_access_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Nunca acessou</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {coord.instance?.expires_at ? (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className={`text-sm font-medium ${timeRemaining.color}`}>
                            {timeRemaining.text}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {coord.instance ? (
                        <Badge variant={coord.instance.status === 'active' ? 'default' : 'secondary'}>
                          {coord.instance.status === 'active' ? 'Ativo' : coord.instance.status === 'paused' ? 'Pausado' : 'Fechado'}
                        </Badge>
                      ) : (
                        <Badge variant="outline">-</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteCoordinator(coord.id, coord.email)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
