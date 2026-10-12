import { fetchApi, toQuery } from './client';
import type {
  ApiKey,
  ApiResponse,
  BankAccount,
  FeeType,
  IntegrationMode,
  Order,
  PaginatedResponse,
  Project,
  ProjectRequest,
  SandboxOrder,
  SystemSetting,
  Webhook,
  WebhookDelivery,
  Withdrawal,
} from '@/types';

type Msg = ApiResponse<unknown>;

export type SandboxOutcome = 'paid' | 'failed' | 'expired';

export interface InvoicePreview {
  amount: number;
  platformFee: number;
  /** Kode unik gateway manual (perkiraan saat ini), 0 jika tidak ada. */
  uniqueCode?: number;
  totalAmount: number;
  netAmount: number;
}

export interface AutoWithdrawalInfo {
  enabled: boolean;
  hours: number;
  customHours: number | null;
  minHours: number;
  maxHours: number;
  bankAccountId: number | null;
  bankAccount: BankAccount | null;
  nextRunAt: string | null;
}

export type TierColor = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
export type TierBasis = 'COUNT' | 'VOLUME';

export interface MerchantTier {
  name: string;
  min: number;
  color: TierColor;
}

export interface MerchantStats {
  totalVolume: number;
  paidCount: number;
  tier: {
    basis: TierBasis;
    value: number;
    current: MerchantTier | null;
    next: MerchantTier | null;
    remaining: number;
  };
}

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
  autoWithdrawal: AutoWithdrawalInfo | null;
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
  getStats: () => fetchApi<ApiResponse<MerchantStats>>('/merchant/stats'),
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
  getProjectRequests: () => fetchApi<ApiResponse<ProjectRequest[]>>('/merchant/project-requests'),
  requestProject: (body: { name: string; purpose: string }) =>
    fetchApi<Msg>('/merchant/project-requests', json('POST', body)),
  deleteProject: (id: number) => fetchApi<Msg>(`/merchant/projects/${id}`, json('DELETE')),

  getApiKeys: () => fetchApi<ApiResponse<ApiKey[]>>('/merchant/api-keys'),
  createApiKey: (body: { name: string; projectId?: number; mode?: IntegrationMode }) =>
    fetchApi<ApiResponse<ApiKey>>('/merchant/api-keys', json('POST', body)),

  getWebhooks: () => fetchApi<ApiResponse<Webhook[]>>('/merchant/webhooks'),
  createWebhook: (body: { name: string; url: string; projectId?: number; mode?: IntegrationMode }) =>
    fetchApi<ApiResponse<Webhook>>('/merchant/webhooks', json('POST', body)),
  updateWebhook: (id: number, body: { isActive?: boolean }) =>
    fetchApi<ApiResponse<Webhook>>(`/merchant/webhooks/${id}`, json('PATCH', body)),
  deleteWebhook: (id: number) => fetchApi<Msg>(`/merchant/webhooks/${id}`, json('DELETE')),
  regenerateWebhookSecret: (id: number) =>
    fetchApi<ApiResponse<Webhook>>(`/merchant/webhooks/${id}/regenerate-secret`, json('POST')),
  testWebhook: (id: number) => fetchApi<Msg>(`/merchant/webhooks/${id}/test`, json('POST')),

  previewInvoice: (amount: number) =>
    fetchApi<ApiResponse<InvoicePreview>>(`/merchant/invoice-preview${toQuery({ amount })}`),
  getInvoiceLimits: () => fetchApi<ApiResponse<{ min: number; max: number; manualInvoiceEnabled: boolean }>>('/merchant/invoice-limits'),

  // Sandbox (uji coba, terpisah dari transaksi & saldo asli)
  getSandboxInvoices: (params: { page?: number; status?: string }) =>
    fetchApi<PaginatedResponse<SandboxOrder>>(`/merchant/sandbox/invoices${toQuery({ ...params })}`),
  createSandboxInvoice: (body: { productName: string; amount: number; customerName?: string }) =>
    fetchApi<ApiResponse<SandboxOrder>>('/merchant/sandbox/invoices', json('POST', body)),
  simulateSandboxInvoice: (invoiceCode: string, status: SandboxOutcome) =>
    fetchApi<Msg>(`/merchant/sandbox/invoices/${invoiceCode}/simulate`, json('POST', { status })),
  getSandboxDeliveries: (params: { page?: number }) =>
    fetchApi<PaginatedResponse<WebhookDelivery>>(`/merchant/sandbox/webhook-deliveries${toQuery({ ...params })}`),
  resendSandboxDelivery: (id: number) =>
    fetchApi<Msg>(`/merchant/sandbox/webhook-deliveries/${id}/resend`, json('POST')),

  // Rekening bank
  getBankAccounts: () => fetchApi<ApiResponse<BankAccount[]>>('/merchant/bank-accounts'),
  createBankAccount: (body: { bankName: string; accountNumber: string; accountHolder: string }) =>
    fetchApi<Msg>('/merchant/bank-accounts', json('POST', body)),
  deleteBankAccount: (id: number) => fetchApi<Msg>(`/merchant/bank-accounts/${id}`, json('DELETE')),

  // Penarikan
  getWithdrawals: (params: { page?: number; search?: string; status?: string }) =>
    fetchApi<PaginatedResponse<Withdrawal>>(`/merchant/withdrawals${toQuery({ ...params })}`),
  createWithdrawal: (body: { amount: number; bankAccountId: number; note?: string }) =>
    fetchApi<Msg>('/merchant/withdrawals', json('POST', body)),
  cancelWithdrawal: (id: number) => fetchApi<Msg>(`/merchant/withdrawals/${id}`, json('DELETE')),

  // Penarikan otomatis
  getAutoWithdrawal: () => fetchApi<ApiResponse<AutoWithdrawalInfo>>('/merchant/auto-withdrawal'),
  updateAutoWithdrawal: (body: { hours?: number; bankAccountId?: number | null }) =>
    fetchApi<ApiResponse<AutoWithdrawalInfo>>('/merchant/auto-withdrawal', json('PATCH', body)),
};
