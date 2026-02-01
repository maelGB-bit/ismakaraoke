import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic2, Plus, Pencil, Trash2, Loader2, Clock, Radio, WifiOff, Video, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { InstanceDataExport } from './InstanceDataExport';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAllInstances } from '@/hooks/useKaraokeInstance';
import type { KaraokeInstance } from '@/types/admin';

interface InstanceLiveStatus {
  [instanceId: string]: boolean;
}

interface CoordinatorEmail {
  [coordinatorId: string]: string;
}

export function AdminInstances() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { instances, loading, refetch } = useAllInstances();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [instanceCode, setInstanceCode] = useState('');
  const [coordinatorId, setCoordinatorId] = useState('');
  const [status, setStatus] = useState<'active' | 'paused' | 'closed'>('active');
  const [videoInsertionsEnabled, setVideoInsertionsEnabled] = useState(true);
  const [videoInsertionsMandatory, setVideoInsertionsMandatory] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Available coordinators (without instance)
  const [availableCoordinators, setAvailableCoordinators] = useState<{ id: string }[]>([]);
  
  // Live status and coordinator emails
  const [liveStatus, setLiveStatus] = useState<InstanceLiveStatus>({});
  const [coordinatorEmails, setCoordinatorEmails] = useState<CoordinatorEmail>({});

  const fetchAvailableCoordinators = async () => {
    try {
      // Get all coordinators
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'coordinator');

      // Get coordinators with instances
      const { data: instancesData } = await supabase
        .from('karaoke_instances')
        .select('coordinator_id');

      const usedIds = new Set(instancesData?.map(i => i.coordinator_id) || []);
      const available = (rolesData || [])
        .filter(r => !usedIds.has(r.user_id))
        .map(r => ({ id: r.user_id }));

      setAvailableCoordinators(available);
    } catch (error) {
      console.error('Error fetching coordinators:', error);
    }
  };

  const fetchLiveStatus = async () => {
    if (instances.length === 0) return;
    
    const instanceIds = instances.map(i => i.id);
    
    // Check for waitlist entries
    const { data: waitlistData } = await supabase
      .from('waitlist')
      .select('karaoke_instance_id')
      .in('karaoke_instance_id', instanceIds)
      .eq('status', 'waiting');
    
    // Check for active performances
    const { data: performanceData } = await supabase
      .from('performances')
      .select('karaoke_instance_id')
      .in('karaoke_instance_id', instanceIds)
      .eq('status', 'ativa');
    
    const liveInstanceIds = new Set([
      ...(waitlistData || []).map(w => w.karaoke_instance_id),
      ...(performanceData || []).map(p => p.karaoke_instance_id)
    ]);
    
    const statusMap: InstanceLiveStatus = {};
    instanceIds.forEach(id => {
      statusMap[id] = liveInstanceIds.has(id);
    });
    
    setLiveStatus(statusMap);
  };

  const fetchCoordinatorEmails = async () => {
    if (instances.length === 0) return;
    
    const coordinatorIds = [...new Set(instances.map(i => i.coordinator_id))];
    
    const { data } = await supabase
      .from('coordinator_requests')
      .select('user_id, email')
      .in('user_id', coordinatorIds);
    
    const emailMap: CoordinatorEmail = {};
    (data || []).forEach(r => {
      if (r.user_id) emailMap[r.user_id] = r.email;
    });
    
    setCoordinatorEmails(emailMap);
  };

  useEffect(() => {
    fetchAvailableCoordinators();
    fetchLiveStatus();
    fetchCoordinatorEmails();
  }, [instances]);
  
  // Realtime subscription for live status
  useEffect(() => {
    const channel = supabase
      .channel('instance-live-status')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'waitlist' }, fetchLiveStatus)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'performances' }, fetchLiveStatus)
      .subscribe();
    
    return () => { supabase.removeChannel(channel); };
  }, [instances]);

  const generateInstanceCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setInstanceCode(code);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !instanceCode.trim()) {
      toast({ title: 'Preencha todos os campos', variant: 'destructive' });
      return;
    }

    if (!editingId && !coordinatorId) {
      toast({ title: 'Selecione um coordenador', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        const { error } = await supabase
          .from('karaoke_instances')
          .update({ 
            name, 
            instance_code: instanceCode, 
            status,
            video_insertions_enabled: videoInsertionsEnabled,
            video_insertions_mandatory: videoInsertionsMandatory
          })
          .eq('id', editingId);

        if (error) throw error;
        toast({ title: 'Instância atualizada!' });
      } else {
        const { error } = await supabase
          .from('karaoke_instances')
          .insert({ 
            name, 
            instance_code: instanceCode, 
            coordinator_id: coordinatorId,
            status,
            video_insertions_enabled: videoInsertionsEnabled,
            video_insertions_mandatory: videoInsertionsMandatory
          });

        if (error) throw error;
        toast({ title: 'Instância criada!' });
      }

      resetForm();
      refetch();
    } catch (error: unknown) {
      console.error('Error saving instance:', error);
      const message = error instanceof Error ? error.message : 'Erro ao salvar';
      
      if (message.includes('unique')) {
        toast({ title: 'Código já existe ou coordenador já tem instância', variant: 'destructive' });
      } else {
        toast({ title: message, variant: 'destructive' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza? Todos os dados da instância (performances, votos, fila) serão perdidos.')) return;

    try {
      const { error } = await supabase
        .from('karaoke_instances')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Instância excluída' });
      refetch();
    } catch (error) {
      console.error('Error deleting instance:', error);
      toast({ title: 'Erro ao excluir instância', variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setName('');
    setInstanceCode('');
    setCoordinatorId('');
    setStatus('active');
    setVideoInsertionsEnabled(true);
    setVideoInsertionsMandatory(true);
    setEditingId(null);
    setIsDialogOpen(false);
  };

  const openEditDialog = (instance: KaraokeInstance) => {
    setName(instance.name);
    setInstanceCode(instance.instance_code);
    setStatus(instance.status);
    setVideoInsertionsEnabled(instance.video_insertions_enabled ?? true);
    setVideoInsertionsMandatory(instance.video_insertions_mandatory ?? true);
    setEditingId(instance.id);
    setIsDialogOpen(true);
  };

  const getVoteUrl = (code: string) => {
    return `${window.location.origin}/app/vote/${code}`;
  };

  const getSignupUrl = (code: string) => {
    return `${window.location.origin}/app/inscricao/${code}`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mic2 className="h-5 w-5" />
              Instâncias de Karaoke
            </CardTitle>
            <CardDescription>
              Cada coordenador tem uma única instância isolada
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsDialogOpen(open); }}>
            <DialogTrigger asChild>
              <Button disabled={availableCoordinators.length === 0 && !editingId}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Instância
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? 'Editar Instância' : 'Nova Instância'}</DialogTitle>
                <DialogDescription>
                  {editingId 
                    ? 'Edite os dados da instância de karaoke.'
                    : 'Crie uma instância para um coordenador.'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {!editingId && (
                  <div className="space-y-2">
                    <Label>Coordenador</Label>
                    <Select value={coordinatorId} onValueChange={setCoordinatorId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um coordenador" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCoordinators.map(c => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.id.slice(0, 8)}...
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {availableCoordinators.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        Todos os coordenadores já têm instâncias ou não há coordenadores cadastrados.
                      </p>
                    )}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="inst-name">Nome da Instância</Label>
                  <Input
                    id="inst-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Karaoke do Bar X"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inst-code">Código da Instância</Label>
                  <div className="flex gap-2">
                    <Input
                      id="inst-code"
                      value={instanceCode}
                      onChange={(e) => setInstanceCode(e.target.value.toUpperCase())}
                      placeholder="Ex: BARX01"
                      className="font-mono uppercase"
                    />
                    <Button type="button" variant="outline" onClick={generateInstanceCode}>
                      Gerar
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Código único usado nas URLs de votação e inscrição
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="paused">Pausado</SelectItem>
                      <SelectItem value="closed">Fechado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Video className="h-4 w-4" />
                    Inserções de Vídeos Explicativos
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm">Habilitado</Label>
                      <p className="text-xs text-muted-foreground">
                        Permite exibir vídeos explicativos
                      </p>
                    </div>
                    <Switch
                      checked={videoInsertionsEnabled}
                      onCheckedChange={setVideoInsertionsEnabled}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        Obrigatório
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Coordenador não pode desativar
                      </p>
                    </div>
                    <Switch
                      checked={videoInsertionsMandatory}
                      onCheckedChange={setVideoInsertionsMandatory}
                    />
                  </div>
                </div>
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
        ) : instances.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Mic2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma instância criada</p>
            {availableCoordinators.length === 0 && (
              <p className="text-sm mt-2">Crie um coordenador primeiro.</p>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {(() => {
              const getTimeRemainingMs = (expiresAt: string | undefined) => {
                if (!expiresAt) return Infinity;
                return new Date(expiresAt).getTime() - new Date().getTime();
              };
              
              const activeInstances = instances
                .filter(i => i.status === 'active' && (!i.expires_at || new Date(i.expires_at) > new Date()))
                .sort((a, b) => getTimeRemainingMs(a.expires_at) - getTimeRemainingMs(b.expires_at));
              
              const inactiveInstances = instances
                .filter(i => i.status !== 'active' || (i.expires_at && new Date(i.expires_at) <= new Date()));
              
              const formatTimeRemaining = (expiresAt: string | undefined) => {
                if (!expiresAt) return '-';
                const diff = new Date(expiresAt).getTime() - new Date().getTime();
                if (diff <= 0) return 'Expirado';
                const hours = Math.floor(diff / (1000 * 60 * 60));
                const days = Math.floor(hours / 24);
                if (days > 0) return `${days}d ${hours % 24}h`;
                if (hours > 0) return `${hours}h`;
                return '<1h';
              };

              return (
                <>
                  {activeInstances.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-green-600">
                        <Mic2 className="h-5 w-5" />
                        Instâncias Ativas ({activeInstances.length})
                      </h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Código</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Vídeos</TableHead>
                            <TableHead>Tempo Restante</TableHead>
                            <TableHead>Email do Coordenador</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {activeInstances.map((instance) => (
                            <TableRow key={instance.id}>
                              <TableCell className="font-medium">{instance.name}</TableCell>
                              <TableCell>
                                <Badge 
                                  variant="outline" 
                                  className="font-mono cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                                  onClick={() => navigate(`/app/host/${instance.instance_code}`)}
                                  title="Clique para acessar o painel do coordenador"
                                >
                                  {instance.instance_code}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {liveStatus[instance.id] ? (
                                  <Badge className="bg-green-500 text-white flex items-center gap-1 w-fit">
                                    <Radio className="h-3 w-3 animate-pulse" />
                                    LIVE
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                                    <WifiOff className="h-3 w-3" />
                                    Offline
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  {instance.video_insertions_enabled ? (
                                    <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                                      <Video className="h-3 w-3" />
                                      {instance.video_insertions_mandatory && <Lock className="h-3 w-3" />}
                                    </Badge>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">-</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-sm font-medium text-green-600">
                                    {formatTimeRemaining(instance.expires_at)}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm">
                                {coordinatorEmails[instance.coordinator_id] || instance.coordinator_id.slice(0, 8) + '...'}
                              </TableCell>
                              <TableCell className="text-right space-x-1">
                                <InstanceDataExport instance={instance} />
                                <Button variant="ghost" size="icon" onClick={() => openEditDialog(instance)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(instance.id)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {inactiveInstances.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-muted-foreground">
                        <Mic2 className="h-5 w-5" />
                        Inativas / Expiradas ({inactiveInstances.length})
                      </h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Código</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Email do Coordenador</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {inactiveInstances.map((instance) => (
                            <TableRow key={instance.id} className="opacity-60">
                              <TableCell className="font-medium">{instance.name}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="font-mono">{instance.instance_code}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="destructive">
                                  {instance.expires_at && new Date(instance.expires_at) <= new Date() 
                                    ? 'Expirado' 
                                    : instance.status === 'paused' ? 'Pausado' : 'Fechado'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm">
                                {coordinatorEmails[instance.coordinator_id] || instance.coordinator_id.slice(0, 8) + '...'}
                              </TableCell>
                              <TableCell className="text-right space-x-1">
                                <InstanceDataExport instance={instance} />
                                <Button variant="ghost" size="icon" onClick={() => openEditDialog(instance)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(instance.id)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
