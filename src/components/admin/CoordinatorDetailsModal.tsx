import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Mail, Phone, User, Building, Tag } from 'lucide-react';
import type { CoordinatorRequest } from '@/types/admin';
import { INTEREST_LABELS, STATUS_LABELS } from '@/types/admin';

interface CoordinatorDetailsModalProps {
  request: CoordinatorRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export function CoordinatorDetailsModal({ request, open, onOpenChange }: CoordinatorDetailsModalProps) {
  if (!request) return null;

  const isExpired = request.expires_at && new Date(request.expires_at) < new Date();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
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
                    <p className="font-medium">{formatDateTime(request.approved_at)}</p>
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
