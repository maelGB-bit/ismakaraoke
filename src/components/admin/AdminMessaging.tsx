import { useState, useEffect } from 'react';
import { MessageCircle, Mail, Phone, Send, Loader2, Users, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface EventArchive {
  id: string;
  instance_code: string;
  instance_name: string;
  event_date: string;
  karaoke_instance_id: string | null;
  rankings: any;
}

interface Participant {
  id: string;
  name: string;
  email: string;
  phone: string;
  instance_name: string;
  instance_code: string;
}

const DEFAULT_MESSAGES = {
  thanks: {
    subject: 'Obrigado por participar do Mamute Karaoke!',
    body: `Olá {nome}!

Obrigado por participar do evento de karaoke no {local}! Foi uma noite incrível e esperamos vê-lo(a) novamente em breve.

Fique de olho em nossas redes sociais para os próximos eventos!

Abraços,
Equipe Mamute Karaoke`
  },
  nextEvent: {
    subject: 'Próximo evento Mamute Karaoke!',
    body: `Olá {nome}!

Temos novidades! Em breve teremos mais um evento de karaoke e queremos você lá!

Não perca a oportunidade de mostrar seu talento novamente.

Abraços,
Equipe Mamute Karaoke`
  },
  custom: {
    subject: '',
    body: ''
  }
};

export function AdminMessaging() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [events, setEvents] = useState<EventArchive[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messageType, setMessageType] = useState<'thanks' | 'nextEvent' | 'custom'>('thanks');
  const [sendMethod, setSendMethod] = useState<'email' | 'whatsapp'>('email');
  const [customSubject, setCustomSubject] = useState('');
  const [customBody, setCustomBody] = useState('');
  const [sendProgress, setSendProgress] = useState({ sent: 0, total: 0, errors: 0 });
  const [showProgress, setShowProgress] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEvents.length > 0) {
      fetchParticipants();
    } else {
      setParticipants([]);
    }
  }, [selectedEvents]);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('event_archives')
        .select('*')
        .order('event_date', { ascending: false })
        .limit(50);

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({ title: 'Erro ao carregar eventos', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchParticipants = async () => {
    try {
      // Get instance IDs from selected events
      const selectedEventData = events.filter(e => selectedEvents.includes(e.id));
      const instanceIds = selectedEventData
        .map(e => e.karaoke_instance_id)
        .filter(Boolean);

      if (instanceIds.length === 0) {
        // If no instance IDs, try to get participants by instance code
        const instanceCodes = selectedEventData.map(e => e.instance_code);
        
        const { data, error } = await supabase
          .from('compiled_participants')
          .select('*')
          .in('instance_code', instanceCodes);

        if (error) throw error;
        
        const uniqueParticipants = removeDuplicates(data || []);
        setParticipants(uniqueParticipants);
      } else {
        const { data, error } = await supabase
          .from('compiled_participants')
          .select('*')
          .in('karaoke_instance_id', instanceIds);

        if (error) throw error;
        
        const uniqueParticipants = removeDuplicates(data || []);
        setParticipants(uniqueParticipants);
      }
    } catch (error) {
      console.error('Error fetching participants:', error);
      toast({ title: 'Erro ao carregar participantes', variant: 'destructive' });
    }
  };

  const removeDuplicates = (data: any[]): Participant[] => {
    const seen = new Map<string, Participant>();
    
    data.forEach(p => {
      const key = sendMethod === 'email' ? p.email?.toLowerCase() : p.phone?.replace(/\D/g, '');
      if (key && !seen.has(key)) {
        seen.set(key, {
          id: p.id,
          name: p.name,
          email: p.email,
          phone: p.phone,
          instance_name: p.instance_name,
          instance_code: p.instance_code
        });
      }
    });
    
    return Array.from(seen.values());
  };

  const toggleEventSelection = (eventId: string) => {
    setSelectedEvents(prev => 
      prev.includes(eventId)
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId]
    );
  };

  const selectAllEvents = () => {
    if (selectedEvents.length === events.length) {
      setSelectedEvents([]);
    } else {
      setSelectedEvents(events.map(e => e.id));
    }
  };

  const getMessage = () => {
    if (messageType === 'custom') {
      return { subject: customSubject, body: customBody };
    }
    return DEFAULT_MESSAGES[messageType];
  };

  const personalizeMessage = (template: string, participant: Participant) => {
    return template
      .replace(/{nome}/g, participant.name || 'Participante')
      .replace(/{local}/g, participant.instance_name || 'nosso evento');
  };

  const generateWhatsAppLink = (phone: string, message: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
  };

  const handleSendMessages = async () => {
    if (participants.length === 0) {
      toast({ title: 'Nenhum participante selecionado', variant: 'destructive' });
      return;
    }

    const message = getMessage();
    
    if (sendMethod === 'email' && (!message.subject || !message.body)) {
      toast({ title: 'Preencha o assunto e a mensagem', variant: 'destructive' });
      return;
    }

    if (sendMethod === 'whatsapp' && !message.body) {
      toast({ title: 'Preencha a mensagem', variant: 'destructive' });
      return;
    }

    setSending(true);
    setShowProgress(true);
    setSendProgress({ sent: 0, total: participants.length, errors: 0 });

    if (sendMethod === 'email') {
      await sendEmails(message);
    } else {
      await openWhatsAppLinks(message);
    }

    setSending(false);
  };

  const sendEmails = async (message: { subject: string; body: string }) => {
    const validParticipants = participants.filter(p => p.email);
    setSendProgress(prev => ({ ...prev, total: validParticipants.length }));

    for (let i = 0; i < validParticipants.length; i++) {
      const participant = validParticipants[i];
      
      try {
        const { error } = await supabase.functions.invoke('send-bulk-message', {
          body: {
            to: participant.email,
            subject: personalizeMessage(message.subject, participant),
            body: personalizeMessage(message.body, participant),
            type: 'email'
          }
        });

        if (error) throw error;
        
        setSendProgress(prev => ({ ...prev, sent: prev.sent + 1 }));
      } catch (error) {
        console.error(`Error sending to ${participant.email}:`, error);
        setSendProgress(prev => ({ ...prev, errors: prev.errors + 1, sent: prev.sent + 1 }));
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    toast({
      title: 'Envio concluído!',
      description: `${sendProgress.sent - sendProgress.errors} emails enviados com sucesso.`
    });
  };

  const openWhatsAppLinks = async (message: { body: string }) => {
    const validParticipants = participants.filter(p => p.phone);
    setSendProgress(prev => ({ ...prev, total: validParticipants.length }));

    // Generate all WhatsApp links
    const links = validParticipants.map(participant => ({
      name: participant.name,
      phone: participant.phone,
      link: generateWhatsAppLink(
        participant.phone,
        personalizeMessage(message.body, participant)
      )
    }));

    // Open links in batches (to avoid browser blocking)
    const batchSize = 5;
    for (let i = 0; i < links.length; i += batchSize) {
      const batch = links.slice(i, i + batchSize);
      
      batch.forEach(({ link }) => {
        window.open(link, '_blank');
      });

      setSendProgress(prev => ({ ...prev, sent: Math.min(prev.sent + batchSize, validParticipants.length) }));
      
      if (i + batchSize < links.length) {
        // Wait for user to send messages before opening more
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    toast({
      title: 'Links do WhatsApp abertos!',
      description: `${validParticipants.length} conversas abertas. Envie as mensagens manualmente.`
    });
  };

  const filteredParticipants = sendMethod === 'email' 
    ? participants.filter(p => p.email)
    : participants.filter(p => p.phone);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Envio de Mensagens em Massa
          </CardTitle>
          <CardDescription>
            Envie mensagens para todos os participantes de eventos selecionados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Event Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Selecione os Eventos</Label>
              <Button variant="outline" size="sm" onClick={selectAllEvents}>
                {selectedEvents.length === events.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
              </Button>
            </div>
            <ScrollArea className="h-48 border rounded-md p-3">
              {events.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Nenhum evento arquivado encontrado
                </p>
              ) : (
                <div className="space-y-2">
                  {events.map(event => (
                    <div
                      key={event.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedEvents.includes(event.id) 
                          ? 'bg-primary/10 border-primary' 
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => toggleEventSelection(event.id)}
                    >
                      <Checkbox 
                        checked={selectedEvents.includes(event.id)}
                        onCheckedChange={() => toggleEventSelection(event.id)}
                      />
                      <div className="flex-1">
                        <p className="font-medium">{event.instance_name}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(event.event_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </p>
                      </div>
                      <Badge variant="secondary">{event.instance_code}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Participants Count */}
          {selectedEvents.length > 0 && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <Users className="h-5 w-5 text-primary" />
              <span className="font-medium">
                {filteredParticipants.length} participantes com {sendMethod === 'email' ? 'email' : 'telefone'} cadastrado
              </span>
            </div>
          )}

          {/* Send Method */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Método de Envio</Label>
            <RadioGroup value={sendMethod} onValueChange={(v) => setSendMethod(v as 'email' | 'whatsapp')}>
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="email" id="email" />
                  <Label htmlFor="email" className="flex items-center gap-2 cursor-pointer">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="whatsapp" id="whatsapp" />
                  <Label htmlFor="whatsapp" className="flex items-center gap-2 cursor-pointer">
                    <Phone className="h-4 w-4" />
                    WhatsApp
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Message Type */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Tipo de Mensagem</Label>
            <Select value={messageType} onValueChange={(v) => setMessageType(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="thanks">Agradecimento pela participação</SelectItem>
                <SelectItem value="nextEvent">Convite para próximo evento</SelectItem>
                <SelectItem value="custom">Mensagem personalizada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Message Preview/Editor */}
          <div className="space-y-3">
            {sendMethod === 'email' && (
              <div className="space-y-2">
                <Label>Assunto do Email</Label>
                {messageType === 'custom' ? (
                  <input
                    type="text"
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    placeholder="Digite o assunto..."
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                ) : (
                  <div className="p-3 bg-muted rounded-md text-sm">
                    {DEFAULT_MESSAGES[messageType].subject}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label>Mensagem</Label>
              <p className="text-xs text-muted-foreground">
                Use {'{nome}'} para o nome do participante e {'{local}'} para o nome do evento
              </p>
              {messageType === 'custom' ? (
                <Textarea
                  value={customBody}
                  onChange={(e) => setCustomBody(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  rows={6}
                />
              ) : (
                <div className="p-3 bg-muted rounded-md text-sm whitespace-pre-line">
                  {DEFAULT_MESSAGES[messageType].body}
                </div>
              )}
            </div>
          </div>

          {/* Progress */}
          {showProgress && (
            <div className="p-4 border rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">Progresso do Envio</span>
                <span className="text-sm text-muted-foreground">
                  {sendProgress.sent} / {sendProgress.total}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${sendProgress.total > 0 ? (sendProgress.sent / sendProgress.total) * 100 : 0}%` }}
                />
              </div>
              {sendProgress.errors > 0 && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {sendProgress.errors} erros no envio
                </p>
              )}
              {sendProgress.sent === sendProgress.total && sendProgress.total > 0 && (
                <p className="text-sm text-primary flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  Envio concluído!
                </p>
              )}
            </div>
          )}

          {/* Send Button */}
          <Button 
            onClick={handleSendMessages}
            disabled={sending || selectedEvents.length === 0 || filteredParticipants.length === 0}
            className="w-full"
            size="lg"
          >
            {sending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            {sendMethod === 'email' 
              ? `Enviar Email para ${filteredParticipants.length} participantes`
              : `Abrir WhatsApp para ${filteredParticipants.length} participantes`
            }
          </Button>

          {sendMethod === 'whatsapp' && (
            <p className="text-sm text-muted-foreground text-center">
              Os links do WhatsApp serão abertos em novas abas. Você precisará enviar cada mensagem manualmente.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
