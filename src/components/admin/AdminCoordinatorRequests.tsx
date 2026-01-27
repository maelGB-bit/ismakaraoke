import { useState, useEffect } from 'react';
import { Clock, Check, X, Trash2, Loader2, RefreshCw, UserPlus, Link as LinkIcon, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { CoordinatorRequest, CoordinatorRequestStatus } from '@/types/admin';
import { INTEREST_LABELS, STATUS_LABELS, APPROVAL_DURATIONS } from '@/types/admin';

function generateInstanceCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function getTimeRemaining(expiresAt: string): string {
  const now = new Date();
  const expires = new Date(expiresAt);
  const diff = expires.getTime() - now.getTime();
  
  if (diff <= 0) return 'Expirado';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} dia(s)`;
  if (hours > 0) return `${hours} hora(s)`;
  return 'Menos de 1 hora';
}

function getStatusBadgeVariant(status: CoordinatorRequestStatus, expiresAt?: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'approved' && expiresAt && new Date(expiresAt) < new Date()) {
    return 'destructive';
  }
  switch (status) {
    case 'approved': return 'default';
    case 'pending': return 'secondary';
    case 'expired': return 'destructive';
    case 'rejected': return 'outline';
  }
}

export function AdminCoordinatorRequests() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<CoordinatorRequest[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Approval dialog state
  const [approvalDialog, setApprovalDialog] = useState<{ open: boolean; request: CoordinatorRequest | null }>({
    open: false,
    request: null,
  });
  const [instanceName, setInstanceName] = useState('');
  const [duration, setDuration] = useState('24h');
  const [isApproving, setIsApproving] = useState(false);

  const fetchRequests = async () => {
    try {
      // Ensure we have a valid session before querying
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) {
        console.error('No active session');
        toast({ title: 'Sessão expirada. Faça login novamente.', variant: 'destructive' });
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('coordinator_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      // Cast the data to our type
      const typedData = (data || []).map(item => ({
        ...item,
        interest: item.interest as CoordinatorRequest['interest'],
        status: item.status as CoordinatorRequest['status'],
      }));
      
      setRequests(typedData);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({ title: 'Erro ao carregar solicitações', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const openApprovalDialog = (request: CoordinatorRequest) => {
    setApprovalDialog({ open: true, request });
    setInstanceName(`Karaoke ${request.name.split(' ')[0]}`);
    setDuration('24h');
  };

  const handleApprove = async () => {
    if (!approvalDialog.request || !instanceName.trim()) {
      toast({ title: 'Digite o nome da instância', variant: 'destructive' });
      return;
    }

    setIsApproving(true);
    const request = approvalDialog.request;

    try {
      // Get duration in hours
      const durationConfig = APPROVAL_DURATIONS.find(d => d.value === duration);
      const durationHours = durationConfig?.hours || 24;

      // Call edge function to create coordinator (keeps admin session intact)
      const { data: session } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('create-coordinator', {
        body: {
          email: request.email,
          name: request.name,
          instanceName: instanceName.trim(),
          durationHours,
          requestId: request.id,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Erro ao criar coordenador');
      }

      const result = response.data;

      if (!result.success) {
        throw new Error(result.error || 'Erro ao criar coordenador');
      }

      toast({ 
        title: 'Coordenador aprovado!',
        description: `Instância ${result.instanceCode} criada. Senha temporária: ${result.tempPassword}`,
      });

      setApprovalDialog({ open: false, request: null });
      fetchRequests();
    } catch (error: unknown) {
      console.error('Error approving coordinator:', error);
      const message = error instanceof Error ? error.message : 'Erro ao aprovar';
      
      if (message.includes('already registered') || message.includes('already been registered')) {
        toast({ title: 'Este email já está cadastrado no sistema', variant: 'destructive' });
      } else {
        toast({ title: message, variant: 'destructive' });
      }
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm('Tem certeza que deseja rejeitar esta solicitação?')) return;

    try {
      const { error } = await supabase
        .from('coordinator_requests')
        .update({ status: 'rejected' })
        .eq('id', id);

      if (error) throw error;

      toast({ title: 'Solicitação rejeitada' });
      fetchRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast({ title: 'Erro ao rejeitar', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta solicitação?')) return;

    try {
      const { error } = await supabase
        .from('coordinator_requests')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({ title: 'Solicitação excluída' });
      setRequests(requests.filter(r => r.id !== id));
    } catch (error) {
      console.error('Error deleting request:', error);
      toast({ title: 'Erro ao excluir', variant: 'destructive' });
    }
  };

  const handleRenew = async (request: CoordinatorRequest) => {
    openApprovalDialog(request);
  };

  const copyInstanceLink = (request: CoordinatorRequest) => {
    if (request.instance_name) {
      // Find instance code from karaoke_instances
      supabase
        .from('karaoke_instances')
        .select('instance_code')
        .eq('coordinator_id', request.user_id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            const link = `${window.location.origin}/inscricao/${data.instance_code}`;
            navigator.clipboard.writeText(link);
            toast({ title: 'Link copiado!' });
          }
        });
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const approvedRequests = requests.filter(r => r.status === 'approved');
  const otherRequests = requests.filter(r => r.status === 'expired' || r.status === 'rejected');

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Solicitações de Coordenadores
              </CardTitle>
              <CardDescription>
                Gerencie as solicitações de novos coordenadores
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-lg px-3">
              {pendingRequests.length} pendente(s)
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma solicitação recebida</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Pending Requests */}
              {pendingRequests.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-yellow-500" />
                    Pendentes
                  </h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Celular</TableHead>
                        <TableHead>Interesse</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium">{request.name}</TableCell>
                          <TableCell>{request.email}</TableCell>
                          <TableCell>{request.phone}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{INTEREST_LABELS[request.interest]}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(request.created_at).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button size="sm" onClick={() => openApprovalDialog(request)}>
                              <Check className="h-4 w-4 mr-1" />
                              Aprovar
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleReject(request.id)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Approved Requests */}
              {approvedRequests.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    Aprovados
                  </h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Instância</TableHead>
                        <TableHead>Aprovado em</TableHead>
                        <TableHead>Tempo restante</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {approvedRequests.map((request) => {
                        const isExpired = request.expires_at && new Date(request.expires_at) < new Date();
                        return (
                          <TableRow key={request.id} className={isExpired ? 'opacity-60' : ''}>
                            <TableCell className="font-medium">{request.name}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <LinkIcon className="h-4 w-4 text-primary" />
                                {request.instance_name || '-'}
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6"
                                  onClick={() => copyInstanceLink(request)}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {request.approved_at 
                                ? new Date(request.approved_at).toLocaleDateString('pt-BR')
                                : '-'}
                            </TableCell>
                            <TableCell>
                              <Badge variant={isExpired ? 'destructive' : 'default'}>
                                {request.expires_at ? getTimeRemaining(request.expires_at) : '-'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                              <Button size="sm" variant="outline" onClick={() => handleRenew(request)}>
                                <RefreshCw className="h-4 w-4 mr-1" />
                                Renovar
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => handleDelete(request.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Expired/Rejected */}
              {otherRequests.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-muted-foreground">
                    Expirados / Rejeitados
                  </h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {otherRequests.map((request) => (
                        <TableRow key={request.id} className="opacity-60">
                          <TableCell>{request.name}</TableCell>
                          <TableCell>{request.email}</TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(request.status)}>
                              {STATUS_LABELS[request.status]}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button size="icon" variant="ghost" onClick={() => handleDelete(request.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approval Dialog */}
      <Dialog open={approvalDialog.open} onOpenChange={(open) => setApprovalDialog({ open, request: approvalDialog.request })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprovar Coordenador</DialogTitle>
            <DialogDescription>
              Configure a instância para {approvalDialog.request?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="instance-name">Nome da Instância</Label>
              <Input
                id="instance-name"
                value={instanceName}
                onChange={(e) => setInstanceName(e.target.value)}
                placeholder="Ex: Karaoke Bar Central"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duração da Aprovação</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {APPROVAL_DURATIONS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {approvalDialog.request && (
              <div className="p-3 bg-muted rounded-lg text-sm">
                <p><strong>Email:</strong> {approvalDialog.request.email}</p>
                <p><strong>Celular:</strong> {approvalDialog.request.phone}</p>
                <p><strong>Interesse:</strong> {INTEREST_LABELS[approvalDialog.request.interest]}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalDialog({ open: false, request: null })}>
              Cancelar
            </Button>
            <Button onClick={handleApprove} disabled={isApproving}>
              {isApproving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Aprovar e Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
