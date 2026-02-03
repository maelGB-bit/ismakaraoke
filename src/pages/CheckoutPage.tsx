import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, CreditCard, Tag, Clock, CheckCircle2, ArrowLeft } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  description: string | null;
  price_amount: number;
  price_currency: string;
  duration_hours: number;
  stripe_price_id: string | null;
  is_recurring: boolean;
  recurring_interval: string | null;
  is_active: boolean;
  is_free: boolean;
}

const formatDuration = (hours: number) => {
  if (hours < 24) return `${hours} hora${hours > 1 ? 's' : ''}`;
  if (hours < 168) return `${Math.floor(hours / 24)} dia${hours >= 48 ? 's' : ''}`;
  if (hours < 720) return `${Math.floor(hours / 168)} semana${hours >= 336 ? 's' : ''}`;
  if (hours < 8760) return `${Math.floor(hours / 720)} ${hours >= 1440 ? 'meses' : 'mês'}`;
  return `${Math.floor(hours / 8760)} ano${hours >= 17520 ? 's' : ''}`;
};

export default function CheckoutPage() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    instanceName: '',
    couponCode: '',
  });
  
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState<{ type: string; value: number } | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  useEffect(() => {
    const fetchPlan = async () => {
      if (!planId) {
        navigate('/planos');
        return;
      }

      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', planId)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        toast.error('Plano não encontrado');
        navigate('/planos');
        return;
      }

      if (data.is_free) {
        navigate('/app/cadastro');
        return;
      }

      setPlan(data);
      setLoading(false);
    };

    fetchPlan();
  }, [planId, navigate]);

  const validateCoupon = async () => {
    if (!formData.couponCode.trim()) {
      toast.error('Digite um código de cupom');
      return;
    }

    setValidatingCoupon(true);

    const { data: coupon, error } = await supabase
      .from('discount_coupons')
      .select('*')
      .eq('code', formData.couponCode.toUpperCase())
      .eq('is_active', true)
      .single();

    if (error || !coupon) {
      toast.error('Cupom inválido ou expirado');
      setValidatingCoupon(false);
      return;
    }

    const now = new Date();
    if (coupon.valid_from && new Date(coupon.valid_from) > now) {
      toast.error('Este cupom ainda não está válido');
      setValidatingCoupon(false);
      return;
    }
    if (coupon.valid_until && new Date(coupon.valid_until) < now) {
      toast.error('Este cupom expirou');
      setValidatingCoupon(false);
      return;
    }
    if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
      toast.error('Este cupom atingiu o limite de usos');
      setValidatingCoupon(false);
      return;
    }

    setCouponApplied(true);
    setCouponDiscount({
      type: coupon.discount_type,
      value: Number(coupon.discount_value),
    });
    toast.success('Cupom aplicado com sucesso!');
    setValidatingCoupon(false);
  };

  const removeCoupon = () => {
    setCouponApplied(false);
    setCouponDiscount(null);
    setFormData({ ...formData, couponCode: '' });
  };

  const calculateFinalPrice = () => {
    if (!plan) return 0;
    if (!couponDiscount) return plan.price_amount;

    if (couponDiscount.type === 'percentage') {
      return Math.round(plan.price_amount * (1 - couponDiscount.value / 100));
    }
    return Math.max(0, plan.price_amount - couponDiscount.value);
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount / 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.instanceName) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (!plan) return;

    setProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          planId: plan.id,
          couponCode: couponApplied ? formData.couponCode.toUpperCase() : null,
          customerEmail: formData.email,
          customerName: formData.name,
          customerPhone: formData.phone,
          instanceName: formData.instanceName,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('URL de checkout não recebida');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Erro ao processar pagamento. Tente novamente.');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-landing-light flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-landing-orange" />
      </div>
    );
  }

  if (!plan) return null;

  const finalPrice = calculateFinalPrice();
  const hasDiscount = couponDiscount && finalPrice < plan.price_amount;

  return (
    <div className="min-h-screen bg-landing-light">
      <LandingHeader />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <Button
            variant="ghost"
            onClick={() => navigate('/planos')}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar aos planos
          </Button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid md:grid-cols-2 gap-8"
          >
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Resumo do Pedido
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <h3 className="font-bold text-xl text-gray-900">{plan.name}</h3>
                  <p className="text-sm text-gray-600">{plan.description}</p>
                  <div className="flex items-center gap-2 mt-2 text-sm text-gray-700">
                    <Clock className="w-4 h-4" />
                    Acesso por {formatDuration(plan.duration_hours)}
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Valor original</span>
                    <span className={hasDiscount ? 'line-through text-muted-foreground' : ''}>
                      {formatPrice(plan.price_amount)}
                    </span>
                  </div>
                  
                  {hasDiscount && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Desconto ({couponDiscount.type === 'percentage' ? `${couponDiscount.value}%` : formatPrice(couponDiscount.value)})</span>
                      <span>-{formatPrice(plan.price_amount - finalPrice)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>Total</span>
                    <span className="text-landing-orange">{formatPrice(finalPrice)}</span>
                  </div>
                  
                  {plan.is_recurring && (
                    <p className="text-xs text-muted-foreground">
                      * Cobrança {plan.recurring_interval === 'month' ? 'mensal' : 'anual'} recorrente
                    </p>
                  )}
                </div>

                {/* Coupon Section */}
                <div className="border-t pt-4">
                  <Label className="flex items-center gap-2 mb-2">
                    <Tag className="w-4 h-4" />
                    Cupom de Desconto
                  </Label>
                  {couponApplied ? (
                    <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span className="font-mono font-medium">{formData.couponCode.toUpperCase()}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={removeCoupon}
                        className="ml-auto text-red-600 hover:text-red-700"
                      >
                        Remover
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        value={formData.couponCode}
                        onChange={(e) => setFormData({ ...formData, couponCode: e.target.value.toUpperCase() })}
                        placeholder="Digite o código"
                        className="font-mono"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={validateCoupon}
                        disabled={validatingCoupon}
                      >
                        {validatingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Aplicar'}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Customer Form */}
            <Card>
              <CardHeader>
                <CardTitle>Seus Dados</CardTitle>
                <CardDescription>
                  Preencha seus dados para continuar com o pagamento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome completo *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Seu nome"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">E-mail *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="seu@email.com"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Telefone (opcional)</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(11) 99999-9999"
                    />
                  </div>

                  <div>
                    <Label htmlFor="instanceName">Nome do seu Karaokê *</Label>
                    <Input
                      id="instanceName"
                      value={formData.instanceName}
                      onChange={(e) => setFormData({ ...formData, instanceName: e.target.value })}
                      placeholder="Ex: Karaokê do João"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Este nome aparecerá para os participantes
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-landing-orange hover:bg-landing-orange/90"
                    size="lg"
                    disabled={processing}
                  >
                    {processing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 mr-2" />
                        Pagar {formatPrice(finalPrice)}
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    Pagamento processado de forma segura pelo Stripe
                  </p>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
