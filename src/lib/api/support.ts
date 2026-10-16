import { fetchApi, toQuery } from './client';
import type { ApiResponse, PaginatedResponse, PublicInvoice, SupportTicket, TicketPriority, TicketStatus } from '@/types';

export interface ReplyPayload {
  message: string;
  attachmentUrl?: string;
}

const post = (body: unknown): RequestInit => ({ method: 'POST', body: JSON.stringify(body) });

export const adminSupportApi = {
  getTickets: (params: { page?: number; limit?: number; status?: string; search?: string }) =>
    fetchApi<PaginatedResponse<SupportTicket>>(`/support/admin/tickets${toQuery({ ...params })}`),
  getOpenCount: () => fetchApi<ApiResponse<{ count: number }>>('/support/admin/tickets/open-count'),
  getTicket: (id: number) => fetchApi<ApiResponse<SupportTicket>>(`/support/admin/tickets/${id}`),
  updateStatus: (id: number, status: TicketStatus) =>
    fetchApi<ApiResponse<SupportTicket>>(`/support/admin/tickets/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  reply: (id: number, body: ReplyPayload) =>
    fetchApi<ApiResponse<unknown>>(`/support/admin/tickets/${id}/messages`, post(body)),
};

export const merchantSupportApi = {
  getTickets: (params: { page?: number; limit?: number; status?: string }) =>
    fetchApi<PaginatedResponse<SupportTicket>>(`/support/tickets${toQuery({ ...params })}`),
  createTicket: (body: ReplyPayload & { subject: string; priority: TicketPriority }) =>
    fetchApi<ApiResponse<SupportTicket>>('/support/tickets', post(body)),
  getTicket: (id: number) => fetchApi<ApiResponse<SupportTicket>>(`/support/tickets/${id}`),
  reply: (id: number, body: ReplyPayload) =>
    fetchApi<ApiResponse<unknown>>(`/support/tickets/${id}/messages`, post(body)),
  close: (id: number) =>
    fetchApi<ApiResponse<unknown>>(`/support/tickets/${id}/close`, { method: 'PATCH' }),
};

export const paymentApi = {
  getInvoice: (invoiceCode: string) =>
    fetchApi<ApiResponse<PublicInvoice>>(`/payment/invoice/${encodeURIComponent(invoiceCode)}`),
  getSandboxInvoice: (invoiceCode: string) =>
    fetchApi<ApiResponse<PublicInvoice>>(`/payment/sandbox/${encodeURIComponent(invoiceCode)}`),
  simulateSandboxInvoice: (invoiceCode: string, status: 'paid' | 'failed' | 'expired') =>
    fetchApi<ApiResponse<{ paymentStatus: string }>>(`/payment/sandbox/${encodeURIComponent(invoiceCode)}/simulate`, post({ status })),

  // MyPG (QRIS milik merchant)
  getMypgInvoice: (invoiceCode: string) =>
    fetchApi<ApiResponse<PublicInvoice>>(`/mypg/pay/${encodeURIComponent(invoiceCode)}`),
  getMypgSandboxInvoice: (invoiceCode: string) =>
    fetchApi<ApiResponse<PublicInvoice>>(`/mypg/pay/sandbox/${encodeURIComponent(invoiceCode)}`),
  simulateMypgSandboxInvoice: (invoiceCode: string, status: 'paid' | 'failed' | 'expired') =>
    fetchApi<ApiResponse<{ paymentStatus: string }>>(`/mypg/pay/sandbox/${encodeURIComponent(invoiceCode)}/simulate`, post({ status })),
};
