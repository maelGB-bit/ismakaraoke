import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Mail, Phone, User, Building, Tag, Key, Copy, RefreshCw, Loader2, Eye, EyeOff, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { CoordinatorRequest } from '@/types/admin';
import { INTEREST_LABELS, STATUS_LABELS } from '@/types/admin';

interface CoordinatorDetailsModalProps {
  request: CoordinatorRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPasswordReset?: () => void;
}

function getStatusBadgeVariant(status: CoordinatorRequest['status'], expiresAt?: string): 'default' | 'secondary' | 'destructive' | 'outline' {
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

function formatDateTime(dateString: string | null): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getTimeRemaining(expiresAt: string): string {
  const now = new Date();
  const expires = new Date(expiresAt);
  const diff = expires.getTime() - now.getTime();
  
  if (diff <= 0) return 'Expirado';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  
  if (days > 0) return `${days} dia(s) e ${remainingHours} hora(s)`;
  if (hours > 0) return `${hours} hora(s)`;
  return 'Menos de 1 hora';
}

export function CoordinatorDetailsModal({ request, open, onOpenChange, onPasswordReset }: CoordinatorDetailsModalProps) {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [currentPassword, setCurrentPassword] = useState<string | null>(null);

  if (!request) return null;

  const isExpired = request.expires_at && new Date(request.expires_at) < new Date();
  const displayPassword = currentPassword || request.current_password || request.temp_password;

  const copyPassword = () => {
    if (displayPassword) {
      navigator.clipboard.writeText(displayPassword);
      toast({ title: 'Senha copiada!' });
    }
  };

  const handleForceLogout = async () => {
    if (!request.user_id) {
      toast({ title: 'Usuário não encontrado', variant: 'destructive' });
      return;
    }

    setIsLoggingOut(true);
    try {
      const response = await supabase.functions.invoke('force-logout', {
        body: { userId: request.user_id },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Erro ao deslogar usuário');
      }

      const result = response.data;

      if (!result.success) {
        throw new Error(result.error || 'Erro ao deslogar usuário');
      }

      toast({ 
        title: 'Usuário deslogado!',
        description: 'O coordenador precisará fazer login novamente.',
      });
    } catch (error: unknown) {
      console.error('Error forcing logout:', error);
      const message = error instanceof Error ? error.message : 'Erro ao deslogar usuário';
      toast({ title: message, variant: 'destructive' });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleResetPassword = async () => {
    if (!request.user_id) {
      toast({ title: 'Usuário não encontrado', variant: 'destructive' });
      return;
    }

    setIsResetting(true);
    try {
      const response = await supabase.functions.invoke('reset-coordinator-password', {
        body: {
          userId: request.user_id,
          requestId: request.id,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Erro ao resetar senha');
      }

      const result = response.data;

      if (!result.success) {
        throw new Error(result.error || 'Erro ao resetar senha');
      }

      setCurrentPassword(result.tempPassword);
      toast({ 
        title: 'Senha resetada com sucesso!',
        description: `Nova senha: ${result.tempPassword}`,
      });
      
      if (onPasswordReset) {
        onPasswordReset();
      }
    } catch (error: unknown) {
      console.error('Error resetting password:', error);
      const message = error instanceof Error ? error.message : 'Erro ao resetar senha';
      toast({ title: message, variant: 'destructive' });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        setShowPassword(false);
        setCurrentPassword(null);
      }
      onOpenChange(isOpen);
    }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Detalhes do Coordenador
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status Badge */}
          <div className="flex justify-center">
            <Badge 
              variant={getStatusBadgeVariant(request.status, request.expires_at ?? undefined)} 
              className="text-sm px-4 py-1"
            >
              {isExpired && request.status === 'approved' ? 'Expirado' : STATUS_LABELS[request.status]}
            </Badge>
          </div>

          {/* Form Data Section */}
          <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Dados do Formulário
            </h3>
            
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Nome</p>
                  <p className="font-medium">{request.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium">{request.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Celular</p>
                  <p className="font-medium">{request.phone}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Tag className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Interesse</p>
                  <Badge variant="outline">{INTEREST_LABELS[request.interest]}</Badge>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Data da Solicitação</p>
                  <p className="font-medium">{formatDateTime(request.created_at)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Approval Data Section - Only show if approved */}
          {request.status === 'approved' && (
            <div className="space-y-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Dados da Aprovação
              </h3>
              
              <div className="space-y-2">
                {request.instance_name && (
                  <div className="flex items-center gap-3">
                    <Building className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Nome da Instância</p>
                      <p className="font-medium">{request.instance_name}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Data/Hora da Aprovação</p>
                    <p className="font-medium">{formatDateTime(request.approved_at ?? null)}</p>
                  </div>
                </div>

                {request.expires_at && (
                  <>
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Data/Hora de Expiração</p>
                        <p className="font-medium">{formatDateTime(request.expires_at)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Tempo Restante</p>
                        <Badge variant={isExpired ? 'destructive' : 'default'}>
                          {getTimeRemaining(request.expires_at)}
                        </Badge>
                      </div>
                    </div>
                  </>
                )}

                {/* Password Section */}
                <div className="flex items-center gap-3">
                  <Key className="h-4 w-4 text-primary" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">
                      {request.must_change_password ? 'Senha Temporária' : 'Senha Atual'}
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                        {displayPassword ? (showPassword ? displayPassword : '••••••••••') : 'Não disponível'}
                      </code>
                      {displayPassword && (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={copyPassword}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Reset Password Button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                  onClick={handleResetPassword}
                  disabled={isResetting}
                >
                  {isResetting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Resetar Senha
                </Button>

                {/* Force Logout Button */}
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full mt-2"
                  onClick={handleForceLogout}
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <LogOut className="h-4 w-4 mr-2" />
                  )}
                  Forçar Logout
                </Button>
              </div>
            </div>
          )}

          {/* Rejection info */}
          {request.status === 'rejected' && (
            <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
              <p className="text-sm text-destructive">
                Esta solicitação foi rejeitada.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
