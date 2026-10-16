import { fetchApi, toQuery } from './client';
import type { SandboxOutcome } from './merchant';
import type {
  ApiKey,
  ApiResponse,
  IntegrationMode,
  PaginatedResponse,
  PaymentStatus,
  Project,
  SandboxOrder,
  Webhook,
  WebhookDelivery,
} from '@/types';

type Msg = ApiResponse<unknown>;

export type MypgProvider = 'DANA' | 'SHOPEEPAY' | 'GOPAY';
export const MYPG_PROVIDER_LABEL: Record<MypgProvider, string> = { DANA: 'DANA Bisnis', SHOPEEPAY: 'ShopeePay', GOPAY: 'GoPay' };

export interface MypgQris {
  id: number;
  name: string;
  provider: MypgProvider;
  qrisString: string;
  isActive: boolean;
  createdAt: string;
}

export interface MypgDevice {
  id: number;
  name: string;
  token: string;
  isActive: boolean;
  isOnline: boolean;
  lastSeenAt: string | null;
  appVersionName?: string | null;
  appVersionCode?: number | null;
  createdAt: string;
}

export interface MypgOrder {
  id: number;
  invoiceCode: string;
  externalId: string | null;
  productName: string;
  customerName: string | null;
  amount: number;
  uniqueCode: number;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  paymentUrl: string | null;
  paidVia: string | null;
  expiredAt: string | null;
  paidAt: string | null;
  createdAt: string;
}

export type MypgNotificationStatus = 'MATCHED' | 'IGNORED' | 'NO_MATCH' | 'AMBIGUOUS';
export interface MypgNotification {
  id: number;
  deviceId: number | null;
  app: string | null;
  text: string;
  provider: MypgProvider | null;
  amount: number | null;
  status: MypgNotificationStatus;
  message: string | null;
  createdAt: string;
  store?: { id: number; name: string };
}

export interface MypgSettings {
  expiryMinutes: number;
  maxUniqueCode: number;
  manualPaidWebhook: boolean;
  expiredWebhook: boolean;
  displayName: string | null;
  returnUrl: string | null;
  telegramEnabled: boolean;
  telegramChatId: string | null;
  /** Token bot sendiri tidak pernah dikirim balik, hanya penanda sudah diisi. */
  hasTelegramBotToken: boolean;
  tgNotifyPaid: boolean;
  tgNotifyUnmatched: boolean;
  tgNotifyExpired: boolean;
}

export type MypgSettingsUpdate = Partial<Omit<MypgSettings, 'hasTelegramBotToken'>> & { telegramBotToken?: string | null };

export interface MypgBilling {
  active: boolean;
  activeUntil: string | null;
  daysLeft: number;
  history: { id: number; code: string; durationDays: number; redeemedAt: string; activeFrom: string; activeUntil: string }[];
}

export interface MypgSummary {
  paidCount: number;
  paidVolume: number;
  todayCount: number;
  todayVolume: number;
  pendingCount: number;
  pendingAmount: number;
  activeQris: { id: number; name: string; provider: MypgProvider } | null;
  licenseActive: boolean;
  activeUntil: string | null;
  devices: Pick<MypgDevice, 'id' | 'name' | 'isActive' | 'isOnline' | 'lastSeenAt'>[];
  chartData: { date: string; paidCount: number; totalAmount: number }[];
}

const json = (method: string, body?: unknown): RequestInit => ({
  method,
  body: body === undefined ? undefined : JSON.stringify(body),
});

const P = '/mypg/panel';

export const mypgApi = {
  getSummary: () => fetchApi<ApiResponse<MypgSummary>>(`${P}/summary`),

  getBilling: () => fetchApi<ApiResponse<MypgBilling>>(`${P}/billing`),
  redeemLicense: (code: string) =>
    fetchApi<ApiResponse<{ code: string; durationDays: number; activeUntil: string }>>(`${P}/billing/redeem`, json('POST', { code })),

  getOrders: (params: { page?: number; limit?: number; search?: string; status?: string; startDate?: string; endDate?: string }) =>
    fetchApi<PaginatedResponse<MypgOrder>>(`${P}/orders${toQuery({ ...params })}`),
  createOrder: (body: { productName: string; amount: number; customerName?: string }) =>
    fetchApi<ApiResponse<MypgOrder>>(`${P}/orders`, json('POST', body)),
  cancelOrder: (invoiceCode: string) => fetchApi<Msg>(`${P}/orders/${invoiceCode}/cancel`, json('POST')),
  markOrderPaid: (invoiceCode: string) => fetchApi<Msg>(`${P}/orders/${invoiceCode}/mark-paid`, json('POST')),

  getSettings: () => fetchApi<ApiResponse<MypgSettings>>(`${P}/settings`),
  updateSettings: (body: MypgSettingsUpdate) => fetchApi<ApiResponse<MypgSettings>>(`${P}/settings`, json('PATCH', body)),
  getTelegramBot: () => fetchApi<ApiResponse<{ username: string | null }>>(`${P}/settings/telegram/bot`),
  testTelegram: () => fetchApi<Msg>(`${P}/settings/telegram/test`, json('POST')),

  getQris: () => fetchApi<ApiResponse<MypgQris[]>>(`${P}/qris`),
  createQris: (body: { name: string; provider: MypgProvider; qrisString: string }) =>
    fetchApi<ApiResponse<MypgQris>>(`${P}/qris`, json('POST', body)),
  activateQris: (id: number) => fetchApi<Msg>(`${P}/qris/${id}/activate`, json('PATCH')),
  deleteQris: (id: number) => fetchApi<Msg>(`${P}/qris/${id}`, json('DELETE')),

  getAppInfo: () =>
    fetchApi<ApiResponse<{ latestVersionName: string | null; latestVersionCode: number; downloadUrl: string | null }>>(`${P}/app-info`),
  getDevices: () => fetchApi<ApiResponse<MypgDevice[]>>(`${P}/devices`),
  createDevice: (body: { name: string }) => fetchApi<ApiResponse<MypgDevice>>(`${P}/devices`, json('POST', body)),
  updateDevice: (id: number, body: { name?: string; isActive?: boolean }) =>
    fetchApi<ApiResponse<MypgDevice>>(`${P}/devices/${id}`, json('PATCH', body)),
  regenerateDeviceToken: (id: number) => fetchApi<ApiResponse<MypgDevice>>(`${P}/devices/${id}/regenerate-token`, json('POST')),
  deleteDevice: (id: number) => fetchApi<Msg>(`${P}/devices/${id}`, json('DELETE')),
  getNotifications: (params: { page?: number; status?: string }) =>
    fetchApi<PaginatedResponse<MypgNotification>>(`${P}/notifications${toQuery({ ...params })}`),

  // Proyek, API key, webhook (bentuk sama dengan merchantApi)
  getProjects: () => fetchApi<ApiResponse<Project[]>>(`${P}/projects`),
  createProject: (body: { name: string }) => fetchApi<ApiResponse<Project>>(`${P}/projects`, json('POST', body)),
  deleteProject: (id: number) => fetchApi<Msg>(`${P}/projects/${id}`, json('DELETE')),
  getApiKeys: () => fetchApi<ApiResponse<ApiKey[]>>(`${P}/api-keys`),
  createApiKey: (body: { name: string; projectId?: number; mode?: IntegrationMode }) =>
    fetchApi<ApiResponse<ApiKey>>(`${P}/api-keys`, json('POST', body)),
  deleteApiKey: (id: number) => fetchApi<Msg>(`${P}/api-keys/${id}`, json('DELETE')),
  getWebhooks: () => fetchApi<ApiResponse<Webhook[]>>(`${P}/webhooks`),
  createWebhook: (body: { name: string; url: string; projectId?: number; mode?: IntegrationMode }) =>
    fetchApi<ApiResponse<Webhook>>(`${P}/webhooks`, json('POST', body)),
  updateWebhook: (id: number, body: { isActive?: boolean }) =>
    fetchApi<ApiResponse<Webhook>>(`${P}/webhooks/${id}`, json('PATCH', body)),
  deleteWebhook: (id: number) => fetchApi<Msg>(`${P}/webhooks/${id}`, json('DELETE')),
  regenerateWebhookSecret: (id: number) => fetchApi<ApiResponse<Webhook>>(`${P}/webhooks/${id}/regenerate-secret`, json('POST')),
  testWebhook: (id: number) => fetchApi<Msg>(`${P}/webhooks/${id}/test`, json('POST')),
  getWebhookDeliveries: (params: { page?: number }) =>
    fetchApi<PaginatedResponse<WebhookDelivery>>(`${P}/webhook-deliveries${toQuery({ ...params })}`),

  // Sandbox
  getSandboxInvoices: (params: { page?: number; status?: string }) =>
    fetchApi<PaginatedResponse<SandboxOrder>>(`${P}/sandbox/invoices${toQuery({ ...params })}`),
  createSandboxInvoice: (body: { productName: string; amount: number; customerName?: string }) =>
    fetchApi<ApiResponse<SandboxOrder>>(`${P}/sandbox/invoices`, json('POST', body)),
  simulateSandboxInvoice: (invoiceCode: string, status: SandboxOutcome) =>
    fetchApi<Msg>(`${P}/sandbox/invoices/${invoiceCode}/simulate`, json('POST', { status })),
  getSandboxDeliveries: (params: { page?: number }) =>
    fetchApi<PaginatedResponse<WebhookDelivery>>(`${P}/sandbox/webhook-deliveries${toQuery({ ...params })}`),
  resendSandboxDelivery: (id: number) => fetchApi<Msg>(`${P}/sandbox/webhook-deliveries/${id}/resend`, json('POST')),
};
