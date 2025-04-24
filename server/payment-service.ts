import { Payment, PaymentStatus } from '@shared/schema';
import { storage } from './storage';

export interface PaymentService {
  // Criar um pagamento
  createPayment(
    data: {
      amount: number, 
      clinicId: number, 
      clientId: number, 
      createdBy: number,
      appointmentId?: number, 
      paymentMethod?: string, 
      notes?: string
    }
  ): Promise<Payment>;
  
  // Confirmar um pagamento
  confirmPayment(paymentId: number): Promise<Payment>;
  
  // Processar um reembolso parcial ou total
  createRefund(paymentId: number, amount?: number, reason?: string): Promise<Payment>;
  
  // Listar pagamentos por clínica
  listPaymentsByClinic(clinicId: number): Promise<Payment[]>;
  
  // Listar pagamentos por cliente
  listPaymentsByClient(clientId: number): Promise<Payment[]>;
  
  // Listar pagamentos por consulta
  listPaymentsByAppointment(appointmentId: number): Promise<Payment[]>;
  
  // Obter um pagamento específico
  getPayment(paymentId: number): Promise<Payment | undefined>;
}

// Implementação do serviço de pagamento local
export class LocalPaymentService implements PaymentService {
  async createPayment(
    data: {
      amount: number, 
      clinicId: number, 
      clientId: number, 
      createdBy: number,
      appointmentId?: number, 
      paymentMethod?: string, 
      notes?: string
    }
  ): Promise<Payment> {
    try {
      const { amount, clinicId, clientId, createdBy, appointmentId, notes } = data;
      const paymentMethod = data.paymentMethod || 'dinheiro';
      
      const payment = await storage.createPayment({
        clinicId,
        clientId,
        appointmentId,
        amount,
        status: PaymentStatus.PENDING,
        paymentMethod,
        notes,
        createdBy
      });
      
      return payment;
    } catch (error: any) {
      console.error('Erro ao criar pagamento:', error);
      throw new Error(`Erro ao criar pagamento: ${error.message}`);
    }
  }
  
  async confirmPayment(paymentId: number): Promise<Payment> {
    try {
      const payment = await storage.getPayment(paymentId);
      
      if (!payment) {
        throw new Error(`Pagamento com ID ${paymentId} não encontrado`);
      }
      
      if (payment.status === PaymentStatus.PAID) {
        return payment;
      }
      
      const updatedPayment = await storage.updatePayment(paymentId, {
        status: PaymentStatus.PAID,
        paymentDate: new Date()
      });
      
      if (!updatedPayment) {
        throw new Error(`Não foi possível atualizar o pagamento com ID ${paymentId}`);
      }
      
      // Se este pagamento estiver associado a um profissional e serviço
      // podemos calcular e criar a comissão aqui
      if (payment.appointmentId) {
        const appointment = await storage.getAppointment(payment.appointmentId);
        if (appointment) {
          const professional = await storage.getProfessional(appointment.professionalId);
          
          if (professional && professional.commission) {
            const commissionRate = professional.commission;
            const commissionAmount = Math.round(payment.amount * commissionRate);
            
            await storage.createCommission({
              clinicId: payment.clinicId,
              professionalId: appointment.professionalId,
              paymentId: payment.id,
              amount: commissionAmount,
              rate: commissionRate,
              status: 'pending'
            });
          }
        }
      }
      
      return updatedPayment;
    } catch (error: any) {
      console.error('Erro ao confirmar pagamento:', error);
      throw new Error(`Erro ao confirmar pagamento: ${error.message}`);
    }
  }
  
  async createRefund(paymentId: number, amount?: number, reason?: string): Promise<Payment> {
    try {
      const payment = await storage.getPayment(paymentId);
      
      if (!payment) {
        throw new Error(`Pagamento com ID ${paymentId} não encontrado`);
      }
      
      if (payment.status !== PaymentStatus.PAID) {
        throw new Error(`Apenas pagamentos com status PAID podem ser reembolsados`);
      }
      
      const refundAmount = amount || payment.amount;
      
      if (refundAmount > payment.amount) {
        throw new Error(`O valor do reembolso não pode ser maior que o valor do pagamento`);
      }
      
      const newStatus = refundAmount === payment.amount 
        ? PaymentStatus.REFUNDED 
        : PaymentStatus.PARTIAL;
      
      const updatedPayment = await storage.updatePayment(paymentId, {
        status: newStatus,
        refundAmount,
        refundReason: reason
      });
      
      if (!updatedPayment) {
        throw new Error(`Não foi possível atualizar o pagamento com ID ${paymentId}`);
      }
      
      return updatedPayment;
    } catch (error: any) {
      console.error('Erro ao processar reembolso:', error);
      throw new Error(`Erro ao processar reembolso: ${error.message}`);
    }
  }
  
  async listPaymentsByClinic(clinicId: number): Promise<Payment[]> {
    return storage.listPaymentsByClinic(clinicId);
  }
  
  async listPaymentsByClient(clientId: number): Promise<Payment[]> {
    return storage.listPaymentsByClient(clientId);
  }
  
  async listPaymentsByAppointment(appointmentId: number): Promise<Payment[]> {
    return storage.listPaymentsByAppointment(appointmentId);
  }
  
  async getPayment(paymentId: number): Promise<Payment | undefined> {
    return storage.getPayment(paymentId);
  }
}

// Instância singleton do serviço de pagamento
export const paymentService: PaymentService = new LocalPaymentService();