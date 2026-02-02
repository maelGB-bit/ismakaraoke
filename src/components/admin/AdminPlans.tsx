import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Clock, DollarSign } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  description: string | null;
  price_amount: number;
  price_currency: string;
  duration_hours: number;
  stripe_price_id: string | null;
  stripe_product_id: string | null;
  is_recurring: boolean;
  recurring_interval: string | null;
  is_active: boolean;
  is_free: boolean;
  sort_order: number;
}

export function AdminPlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price_amount: 0,
    duration_hours: 1,
    is_recurring: false,
    recurring_interval: '',
    is_active: true,
    is_free: false,
    sort_order: 0,
    stripe_price_id: '',
    stripe_product_id: '',
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('sort_order');

    if (error) {
      toast.error('Erro ao carregar planos');
      console.error(error);
    } else {
      setPlans(data || []);
    }
    setLoading(false);
  };

  const handleCreate = () => {
    setEditingPlan(null);
    setFormData({
      name: '',
      description: '',
      price_amount: 0,
      duration_hours: 24,
      is_recurring: false,
      recurring_interval: '',
      is_active: true,
      is_free: false,
      sort_order: plans.length,
      stripe_price_id: '',
      stripe_product_id: '',
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description || '',
      price_amount: plan.price_amount,
      duration_hours: plan.duration_hours,
      is_recurring: plan.is_recurring,
      recurring_interval: plan.recurring_interval || '',
      is_active: plan.is_active,
      is_free: plan.is_free,
      sort_order: plan.sort_order,
      stripe_price_id: plan.stripe_price_id || '',
      stripe_product_id: plan.stripe_product_id || '',
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast.error('Nome é obrigatório');
      return;
    }

    const planData = {
      name: formData.name,
      description: formData.description || null,
      price_amount: formData.is_free ? 0 : formData.price_amount,
      price_currency: 'brl',
      duration_hours: formData.duration_hours,
      is_recurring: formData.is_free ? false : formData.is_recurring,
      recurring_interval: formData.is_recurring ? formData.recurring_interval : null,
      is_active: formData.is_active,
      is_free: formData.is_free,
      sort_order: formData.sort_order,
      stripe_price_id: formData.is_free ? null : (formData.stripe_price_id || null),
      stripe_product_id: formData.is_free ? null : (formData.stripe_product_id || null),
    };

    if (editingPlan) {
      const { error } = await supabase
        .from('subscription_plans')
        .update(planData)
        .eq('id', editingPlan.id);

      if (error) {
        toast.error('Erro ao atualizar plano');
        console.error(error);
      } else {
        toast.success('Plano atualizado com sucesso');
        fetchPlans();
        setIsDialogOpen(false);
      }
    } else {
      const { error } = await supabase
        .from('subscription_plans')
        .insert(planData);

      if (error) {
        toast.error('Erro ao criar plano');
        console.error(error);
      } else {
        toast.success('Plano criado com sucesso');
        fetchPlans();
        setIsDialogOpen(false);
      }
    }
  };

  const handleDelete = async (plan: Plan) => {
    if (!confirm(`Tem certeza que deseja excluir o plano "${plan.name}"?`)) {
      return;
    }

    const { error } = await supabase
      .from('subscription_plans')
      .delete()
      .eq('id', plan.id);

    if (error) {
      toast.error('Erro ao excluir plano');
      console.error(error);
    } else {
      toast.success('Plano excluído com sucesso');
      fetchPlans();
    }
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount / 100);
  };

  const formatDuration = (hours: number) => {
    if (hours < 24) return `${hours} hora${hours > 1 ? 's' : ''}`;
    if (hours < 168) return `${Math.floor(hours / 24)} dia${hours >= 48 ? 's' : ''}`;
    if (hours < 720) return `${Math.floor(hours / 168)} semana${hours >= 336 ? 's' : ''}`;
    if (hours < 8760) return `${Math.floor(hours / 720)} mês${hours >= 1440 ? 'es' : ''}`;
    return `${Math.floor(hours / 8760)} ano${hours >= 17520 ? 's' : ''}`;
  };

  if (loading) {
    return <div className="text-center py-8">Carregando planos...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Gerenciar Planos
            </CardTitle>
            <CardDescription>
              Configure os planos de assinatura disponíveis para os usuários
            </CardDescription>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Plano
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ordem</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Duração</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.map((plan) => (
              <TableRow key={plan.id}>
                <TableCell>{plan.sort_order}</TableCell>
                <TableCell>
                  <div className="font-medium">{plan.name}</div>
                  {plan.description && (
                    <div className="text-sm text-muted-foreground truncate max-w-xs">
                      {plan.description}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {plan.is_free ? (
                    <span className="text-green-600 font-medium">Grátis</span>
                  ) : (
                    formatPrice(plan.price_amount)
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    {formatDuration(plan.duration_hours)}
                  </div>
                </TableCell>
                <TableCell>
                  {plan.is_recurring ? (
                    <span className="text-blue-600">
                      Recorrente ({plan.recurring_interval === 'month' ? 'mensal' : 'anual'})
                    </span>
                  ) : (
                    <span>Único</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className={plan.is_active ? 'text-green-600' : 'text-red-600'}>
                    {plan.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(plan)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    {!plan.is_free && (
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(plan)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingPlan ? 'Editar Plano' : 'Novo Plano'}
            </DialogTitle>
            <DialogDescription>
              {editingPlan?.is_free 
                ? 'Configure as opções do plano gratuito'
                : 'Configure as opções do plano'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome do Plano</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Silver, Gold, Platinum"
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ex: Acesso por 1 dia"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="duration_hours">Duração (horas)</Label>
                <Input
                  id="duration_hours"
                  type="number"
                  min="1"
                  value={formData.duration_hours}
                  onChange={(e) => setFormData({ ...formData, duration_hours: parseInt(e.target.value) || 1 })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  = {formatDuration(formData.duration_hours)}
                </p>
              </div>

              <div>
                <Label htmlFor="sort_order">Ordem de exibição</Label>
                <Input
                  id="sort_order"
                  type="number"
                  min="0"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            {!editingPlan?.is_free && (
              <>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_free"
                    checked={formData.is_free}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_free: checked })}
                  />
                  <Label htmlFor="is_free">Plano Gratuito</Label>
                </div>

                {!formData.is_free && (
                  <>
                    <div>
                      <Label htmlFor="price_amount">Preço (em centavos)</Label>
                      <Input
                        id="price_amount"
                        type="number"
                        min="0"
                        value={formData.price_amount}
                        onChange={(e) => setFormData({ ...formData, price_amount: parseInt(e.target.value) || 0 })}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        = {formatPrice(formData.price_amount)}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_recurring"
                        checked={formData.is_recurring}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_recurring: checked })}
                      />
                      <Label htmlFor="is_recurring">Pagamento Recorrente</Label>
                    </div>

                    {formData.is_recurring && (
                      <div>
                        <Label htmlFor="recurring_interval">Intervalo</Label>
                        <Select
                          value={formData.recurring_interval}
                          onValueChange={(value) => setFormData({ ...formData, recurring_interval: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o intervalo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="month">Mensal</SelectItem>
                            <SelectItem value="year">Anual</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div>
                      <Label htmlFor="stripe_price_id">Stripe Price ID</Label>
                      <Input
                        id="stripe_price_id"
                        value={formData.stripe_price_id}
                        onChange={(e) => setFormData({ ...formData, stripe_price_id: e.target.value })}
                        placeholder="price_..."
                      />
                    </div>

                    <div>
                      <Label htmlFor="stripe_product_id">Stripe Product ID</Label>
                      <Input
                        id="stripe_product_id"
                        value={formData.stripe_product_id}
                        onChange={(e) => setFormData({ ...formData, stripe_product_id: e.target.value })}
                        placeholder="prod_..."
                      />
                    </div>
                  </>
                )}
              </>
            )}

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Plano Ativo</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {editingPlan ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
