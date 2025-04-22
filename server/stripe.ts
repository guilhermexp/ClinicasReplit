import Stripe from 'stripe';
import { User, Payment, InsertPayment, PaymentStatus } from '@shared/schema';

// Verificar se a chave do Stripe está definida
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('AVISO: STRIPE_SECRET_KEY não está definida. As funcionalidades de pagamento podem não funcionar corretamente.');
}

// Inicializar o cliente do Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'dummy_key_for_dev', {
  apiVersion: '2025-03-31.basil',
});

export interface StripeService {
  // Criar uma intenção de pagamento para um pagamento único
  createPaymentIntent(amount: number, currency: string, metadata: Record<string, any>): Promise<Stripe.PaymentIntent>;
  
  // Confirmar um pagamento após processamento bem-sucedido
  confirmPayment(paymentIntentId: string): Promise<Stripe.PaymentIntent>;
  
  // Processar um reembolso parcial ou total
  createRefund(paymentIntentId: string, amount?: number, reason?: string): Promise<Stripe.Refund>;
  
  // Criar ou obter um cliente no Stripe
  getOrCreateCustomer(user: User): Promise<Stripe.Customer>;
  
  // Criar uma assinatura para um cliente
  createSubscription(customerId: string, priceId: string): Promise<Stripe.Subscription>;
  
  // Obter uma assinatura existente
  getSubscription(subscriptionId: string): Promise<Stripe.Subscription>;
  
  // Cancelar uma assinatura
  cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription>;
}

// Implementação do serviço Stripe
export class StripeServiceImpl implements StripeService {
  async createPaymentIntent(amount: number, currency: string = 'brl', metadata: Record<string, any> = {}): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Converte para centavos
        currency,
        metadata,
        automatic_payment_methods: { enabled: true },
      });
      
      return paymentIntent;
    } catch (error: any) {
      console.error('Erro ao criar intenção de pagamento:', error);
      throw new Error(`Erro ao criar intenção de pagamento: ${error.message}`);
    }
  }
  
  async confirmPayment(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status === 'succeeded') {
        return paymentIntent;
      }
      
      throw new Error(`Pagamento não foi confirmado. Status: ${paymentIntent.status}`);
    } catch (error: any) {
      console.error('Erro ao confirmar pagamento:', error);
      throw new Error(`Erro ao confirmar pagamento: ${error.message}`);
    }
  }
  
  async createRefund(paymentIntentId: string, amount?: number, reason?: string): Promise<Stripe.Refund> {
    try {
      const refundParams: Stripe.RefundCreateParams = {
        payment_intent: paymentIntentId,
        reason: (reason as Stripe.RefundCreateParams.Reason) || 'requested_by_customer',
      };
      
      if (amount) {
        refundParams.amount = Math.round(amount * 100); // Converte para centavos
      }
      
      const refund = await stripe.refunds.create(refundParams);
      return refund;
    } catch (error: any) {
      console.error('Erro ao processar reembolso:', error);
      throw new Error(`Erro ao processar reembolso: ${error.message}`);
    }
  }
  
  async getOrCreateCustomer(user: User): Promise<Stripe.Customer> {
    try {
      // Se o usuário já tem um ID de cliente no Stripe, apenas retorne-o
      if (user.stripeCustomerId) {
        const customer = await stripe.customers.retrieve(user.stripeCustomerId);
        
        if (!customer.deleted) {
          return customer as Stripe.Customer;
        }
        // Se o cliente foi excluído, vamos criar um novo
      }
      
      // Crie um novo cliente
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        // phone: user.phone || undefined, // Comentado até adicionarmos esta coluna ao banco de dados
        metadata: {
          userId: user.id.toString(),
        },
      });
      
      return customer;
    } catch (error: any) {
      console.error('Erro ao criar/obter cliente no Stripe:', error);
      throw new Error(`Erro ao criar/obter cliente no Stripe: ${error.message}`);
    }
  }
  
  async createSubscription(customerId: string, priceId: string): Promise<Stripe.Subscription> {
    try {
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });
      
      return subscription;
    } catch (error: any) {
      console.error('Erro ao criar assinatura:', error);
      throw new Error(`Erro ao criar assinatura: ${error.message}`);
    }
  }
  
  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      return subscription;
    } catch (error: any) {
      console.error('Erro ao obter assinatura:', error);
      throw new Error(`Erro ao obter assinatura: ${error.message}`);
    }
  }
  
  async cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      const subscription = await stripe.subscriptions.cancel(subscriptionId);
      return subscription;
    } catch (error: any) {
      console.error('Erro ao cancelar assinatura:', error);
      throw new Error(`Erro ao cancelar assinatura: ${error.message}`);
    }
  }
}

// Instância singleton do serviço Stripe
export const stripeService: StripeService = new StripeServiceImpl();