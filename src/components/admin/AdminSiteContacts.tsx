import { useState, useEffect } from 'react';
import { MessageCircle, Instagram, Mail, HelpCircle, Save, Loader2, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useSiteContacts } from '@/hooks/useSiteContacts';

const iconMap: Record<string, React.ReactNode> = {
  'message-circle': <MessageCircle className="h-5 w-5" />,
  'instagram': <Instagram className="h-5 w-5" />,
  'mail': <Mail className="h-5 w-5" />,
  'help-circle': <HelpCircle className="h-5 w-5" />,
};

const placeholders: Record<string, string> = {
  'whatsapp': '5511999999999 (apenas números com DDI)',
  'instagram': 'nome_do_perfil (sem @)',
  'email': 'contato@seudominio.com',
  'support': '/suporte ou https://linkexterno.com',
};

const helpTexts: Record<string, string> = {
  'whatsapp': 'Número com código do país. Ex: 5511999999999',
  'instagram': 'Nome de usuário do Instagram sem @',
  'email': 'Endereço de e-mail para contato',
  'support': 'Link interno (/suporte) ou externo (https://...)',
};

export function AdminSiteContacts() {
  const { toast } = useToast();
  const { contacts, loading, updateContact } = useSiteContacts();
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (contacts.length > 0) {
      const values: Record<string, string> = {};
      contacts.forEach(c => {
        values[c.key] = c.value || '';
      });
      setFormValues(values);
    }
  }, [contacts]);

  const handleSave = async (key: string) => {
    setSaving(prev => ({ ...prev, [key]: true }));
    
    const success = await updateContact(key, formValues[key] || '');
    
    if (success) {
      toast({ title: 'Contato atualizado com sucesso!' });
    } else {
      toast({ title: 'Erro ao atualizar contato', variant: 'destructive' });
    }
    
    setSaving(prev => ({ ...prev, [key]: false }));
  };

  const getPreviewUrl = (key: string, value: string) => {
    if (!value) return null;
    
    switch (key) {
      case 'whatsapp':
        return `https://wa.me/${value.replace(/\D/g, '')}`;
      case 'instagram':
        return `https://instagram.com/${value.replace('@', '')}`;
      case 'email':
        return `mailto:${value}`;
      case 'support':
        return value.startsWith('http') ? value : value;
      default:
        return null;
    }
  };

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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Contatos do Site
        </CardTitle>
        <CardDescription>
          Configure os links de contato exibidos no rodapé do site
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {contacts.map(contact => (
          <div key={contact.key} className="space-y-2 p-4 border rounded-lg bg-card">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-md bg-primary/10 text-primary">
                {iconMap[contact.icon] || <HelpCircle className="h-5 w-5" />}
              </div>
              <div>
                <Label className="text-base font-semibold">{contact.label}</Label>
                <p className="text-xs text-muted-foreground">{helpTexts[contact.key]}</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Input
                value={formValues[contact.key] || ''}
                onChange={(e) => setFormValues(prev => ({ ...prev, [contact.key]: e.target.value }))}
                placeholder={placeholders[contact.key]}
                className="flex-1"
              />
              <Button
                onClick={() => handleSave(contact.key)}
                disabled={saving[contact.key]}
                size="sm"
              >
                {saving[contact.key] ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
              </Button>
              {formValues[contact.key] && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <a 
                    href={getPreviewUrl(contact.key, formValues[contact.key]) || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
