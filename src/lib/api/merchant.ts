import { fetchApi, toQuery } from './client';
import type {
  ApiKey,
  ApiResponse,
  BankAccount,
  FeeType,
  Order,
  PaginatedResponse,
  Project,
  SystemSetting,
  Webhook,
  Withdrawal,
} from '@/types';

type Msg = ApiResponse<unknown>;

export interface DashboardData {
  availableBalance: number;
  pendingBalance: number;
  totalBalance: number;
  balanceHoldHours: number;
  wdFeeType: FeeType;
  wdFeeValue: number;
  wdFeeThreshold: number | null;
  wdExtraFeeType: FeeType | null;
  wdExtraFeeValue: number | null;
  wdMaxAmount: number | null;
  totalOrders: number;
  paidOrders: number;
  todayStats: {
    salesAmount: number;
    salesCount: number;
    pendingAmount: number;
    pendingCount: number;
  };
  chartData: { date: string; paidCount: number; totalAmount: number }[];
  donutChartData: { labels: string[]; data: number[] };
}

export interface CreateOrderPayload {
  productName: string;
  amount: number;
  customerName?: string;
  customerContact?: string;
}

const json = (method: string, body?: unknown): RequestInit => ({
  method,
  body: body === undefined ? undefined : JSON.stringify(body),
});

export const merchantApi = {
  getDashboard: () => fetchApi<ApiResponse<DashboardData>>('/merchant/dashboard'),
  getBanner: () => fetchApi<ApiResponse<SystemSetting | null>>('/merchant/banner'),

  // Transaksi
  getOrders: (params: { page?: number; limit?: number; search?: string; status?: string; startDate?: string; endDate?: string }) =>
    fetchApi<PaginatedResponse<Order>>(`/merchant/orders${toQuery({ ...params })}`),
  createOrder: (body: CreateOrderPayload) =>
    fetchApi<ApiResponse<Order>>('/merchant/orders', json('POST', { ...body, method: 'qris' })),
  syncOrder: (invoiceCode: string) =>
    fetchApi<ApiResponse<Order>>(`/merchant/orders/${invoiceCode}/sync`, json('POST')),

  // Profil
  updateProfile: (body: { name: string; email: string }) => fetchApi<Msg>('/merchant/profile', json('PATCH', body)),
  updatePassword: (body: { currentPassword: string; newPassword: string }) =>
    fetchApi<Msg>('/merchant/password', json('PATCH', body)),

  // Proyek, API key, webhook
  getProjects: () => fetchApi<ApiResponse<Project[]>>('/merchant/projects'),
  createProject: (name: string) => fetchApi<Msg>('/merchant/projects', json('POST', { name })),
  deleteProject: (id: number) => fetchApi<Msg>(`/merchant/projects/${id}`, json('DELETE')),

  getApiKeys: () => fetchApi<ApiResponse<ApiKey[]>>('/merchant/api-keys'),
  createApiKey: (body: { name: string; projectId?: number }) =>
    fetchApi<ApiResponse<ApiKey>>('/merchant/api-keys', json('POST', body)),

  getWebhooks: () => fetchApi<ApiResponse<Webhook[]>>('/merchant/webhooks'),
  createWebhook: (body: { name: string; url: string; projectId?: number }) =>
    fetchApi<ApiResponse<Webhook>>('/merchant/webhooks', json('POST', body)),
  updateWebhook: (id: number, body: { isActive?: boolean }) =>
    fetchApi<ApiResponse<Webhook>>(`/merchant/webhooks/${id}`, json('PATCH', body)),
  deleteWebhook: (id: number) => fetchApi<Msg>(`/merchant/webhooks/${id}`, json('DELETE')),
  regenerateWebhookSecret: (id: number) =>
    fetchApi<ApiResponse<Webhook>>(`/merchant/webhooks/${id}/regenerate-secret`, json('POST')),
  testWebhook: (id: number) => fetchApi<Msg>(`/merchant/webhooks/${id}/test`, json('POST')),

  // Rekening bank
  getBankAccounts: () => fetchApi<ApiResponse<BankAccount[]>>('/merchant/bank-accounts'),
  createBankAccount: (body: { bankName: string; accountNumber: string; accountHolder: string }) =>
    fetchApi<Msg>('/merchant/bank-accounts', json('POST', body)),
  deleteBankAccount: (id: number) => fetchApi<Msg>(`/merchant/bank-accounts/${id}`, json('DELETE')),

  // Penarikan
  getWithdrawals: (params: { page?: number; search?: string }) =>
    fetchApi<PaginatedResponse<Withdrawal>>(`/merchant/withdrawals${toQuery({ ...params })}`),
  createWithdrawal: (body: { amount: number; bankAccountId: number; note?: string }) =>
    fetchApi<Msg>('/merchant/withdrawals', json('POST', body)),
  cancelWithdrawal: (id: number) => fetchApi<Msg>(`/merchant/withdrawals/${id}`, json('DELETE')),
};
