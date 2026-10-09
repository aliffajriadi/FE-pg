import { fetchApi, fetchBlob, toQuery } from './client';
import type { MerchantTier, TierBasis } from './merchant';
import type {
  AdminLog,
  ApiResponse,
  BalanceLog,
  BankAccount,
  FeeType,
  IntegrationMode,
  ManualQris,
  Order,
  PaginatedResponse,
  Store,
  StoreStatus,
  SystemSetting,
  User,
  Withdrawal,
} from '@/types';

type Msg = ApiResponse<unknown>;

export interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  type?: string;
}

export interface DashboardStats {
  totalOrders: number;
  paidOrders: number;
  totalVolume: number;
  totalFee: number;
  totalWdFee: number;
}

export interface AdminDashboard {
  allTime: DashboardStats;
  range: DashboardStats;
  merchantBalance: { totalBalance: number };
}

export type AdminUser = User & { isActive: boolean; apiKeyLimit: number; webhookLimit: number; createdAt: string };
export type AdminStore = Store & { balance: number; user: User };
export type AdminOrder = Order & { store: Store | null };
export type AdminWithdrawal = Withdrawal & {
  store: Store & { user?: User; balance: number; totalBalance: number };
};
export type AdminBankAccount = BankAccount & { store: Store };

export interface IntegrationCount {
  total: number;
  active: number;
}

export interface AdminIntegrationRow {
  id: number;
  name: string;
  status: StoreStatus;
  user: { name: string; email: string };
  projectCount: number;
  apiKeys: { live: IntegrationCount; sandbox: IntegrationCount };
  webhooks: { live: IntegrationCount; sandbox: IntegrationCount };
  lastKeyUsedAt: string | null;
  hasLegacyWebhook: boolean;
}

export interface AdminIntegrationKey {
  id: number;
  name: string;
  key: string;
  isActive: boolean;
  isSandbox: boolean;
  lastUsedAt: string | null;
  projectId: number | null;
  createdAt: string;
}

export interface AdminIntegrationWebhook {
  id: number;
  name: string;
  url: string;
  secret: string;
  isActive: boolean;
  mode: IntegrationMode;
  projectId: number | null;
  createdAt: string;
}

export interface AdminIntegrationDelivery {
  id: number;
  event: string;
  url: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  responseStatus: number | null;
  lastError: string | null;
  isSandbox: boolean;
  createdAt: string;
}

export interface DeliveryStats {
  success: number;
  failed: number;
  pending: number;
}

export interface AdminIntegrationDetail {
  store: {
    id: number;
    name: string;
    slug: string;
    status: StoreStatus;
    createdAt: string;
    user: { name: string; email: string };
  };
  legacyWebhookUrl: string | null;
  legacyWebhookSecret: string | null;
  projects: { id: number; name: string; isActive: boolean; apiKeys: AdminIntegrationKey[]; webhooks: AdminIntegrationWebhook[] }[];
  global: { apiKeys: AdminIntegrationKey[]; webhooks: AdminIntegrationWebhook[] };
  deliveryStats: { live: DeliveryStats; sandbox: DeliveryStats };
  recentDeliveries: AdminIntegrationDelivery[];
}

export interface StoreBalance {
  availableBalance: number;
  pendingBalance: number;
  totalBalance: number;
  recentLogs: BalanceLog[];
}

export interface AdminSettings {
  banner: SystemSetting;
  qrisMaintenance: SystemSetting;
  notifMethod: SystemSetting;
  waNumber: SystemSetting;
  discordWebhook: SystemSetting;
  telegramChatId: SystemSetting;
  manualPaymentMethod: SystemSetting;
  defaultApiKeyLimit: SystemSetting;
  defaultWebhookLimit: SystemSetting;
  defaultPaymentGateway: SystemSetting;
  defaultManualQris: SystemSetting;
  minInvoiceAmount: SystemSetting;
  autoWdEnabled: SystemSetting;
  autoWdMaxHours: SystemSetting;
  merchantTiers: { basis: TierBasis; tiers: MerchantTier[] };
  manualQrisList: ManualQris[];
}

export interface FeePayload {
  feeType: FeeType;
  feeValue: number;
  feeThreshold: number | null;
  extraFeeType: FeeType | null;
  extraFeeValue: number | null;
}

export interface WdSettingsPayload {
  wdFeeType: FeeType;
  wdFeeValue: number;
  wdFeeThreshold: number | null;
  wdExtraFeeType: FeeType | null;
  wdExtraFeeValue: number | null;
  wdMaxAmount: number | null;
}

const json = (method: string, body?: unknown): RequestInit => ({
  method,
  body: body === undefined ? undefined : JSON.stringify(body),
});

export const adminApi = {
  // Dashboard
  getDashboard: (params: { startDate?: string; endDate?: string }) =>
    fetchApi<ApiResponse<AdminDashboard>>(`/admin/dashboard${toQuery({ ...params })}`),

  // Pengguna
  getUsers: (params: ListParams) =>
    fetchApi<PaginatedResponse<AdminUser>>(`/admin/users${toQuery({ ...params })}`),
  createUser: (body: { name: string; email: string; password: string }) =>
    fetchApi<Msg>('/admin/users', json('POST', body)),
  suspendUser: (id: number) => fetchApi<Msg>(`/admin/users/${id}/suspend`, json('PATCH', {})),
  activateUser: (id: number) => fetchApi<Msg>(`/admin/users/${id}/activate`, json('PATCH', {})),
  changeUserPassword: (id: number, password: string) =>
    fetchApi<Msg>(`/admin/users/${id}/change-password`, json('PATCH', { password })),
  updateApiKeyLimit: (id: number, apiKeyLimit: number) =>
    fetchApi<Msg>(`/admin/users/${id}/api-key-limit`, json('PATCH', { apiKeyLimit })),
  updateWebhookLimit: (id: number, webhookLimit: number) =>
    fetchApi<Msg>(`/admin/users/${id}/webhook-limit`, json('PATCH', { webhookLimit })),

  // Toko
  getStores: (params: ListParams) =>
    fetchApi<PaginatedResponse<AdminStore>>(`/admin/stores${toQuery({ ...params })}`),
  approveStore: (id: number) => fetchApi<Msg>(`/admin/stores/${id}/approve`, json('PATCH', {})),
  suspendStore: (id: number) => fetchApi<Msg>(`/admin/stores/${id}/suspend`, json('PATCH', {})),
  activateStore: (id: number) => fetchApi<Msg>(`/admin/stores/${id}/activate`, json('PATCH', {})),
  updateStoreFee: (id: number, body: FeePayload) =>
    fetchApi<Msg>(`/admin/stores/${id}/fee`, json('PATCH', body)),
  updateStoreWdSettings: (id: number, body: WdSettingsPayload) =>
    fetchApi<Msg>(`/admin/stores/${id}/wd-settings`, json('PATCH', body)),
  updateStoreHoldHours: (id: number, holdHours: number) =>
    fetchApi<Msg>(`/admin/stores/${id}/hold-hours`, json('PATCH', { holdHours })),
  updateStoreAutoWd: (id: number, excluded: boolean) =>
    fetchApi<Msg>(`/admin/stores/${id}/auto-wd`, json('PATCH', { excluded })),
  getStoreBalance: (id: number) => fetchApi<ApiResponse<StoreBalance>>(`/admin/stores/${id}/balance`),
  adjustStoreBalance: (id: number, body: { type: 'CREDIT' | 'DEBIT'; amount: number; description?: string }) =>
    fetchApi<Msg>(`/admin/stores/${id}/balance-adjustment`, json('POST', body)),

  // Integrasi API merchant (read-only)
  getIntegrations: (params: ListParams) =>
    fetchApi<PaginatedResponse<AdminIntegrationRow>>(`/admin/integrations${toQuery({ ...params })}`),
  getIntegration: (storeId: number) =>
    fetchApi<ApiResponse<AdminIntegrationDetail>>(`/admin/integrations/${storeId}`),

  // Transaksi
  getTransactions: (params: ListParams & { storeId?: number; startDate?: string; endDate?: string }) =>
    fetchApi<PaginatedResponse<AdminOrder>>(`/admin/transactions${toQuery({ ...params })}`),
  markTransactionPaid: (id: number) => fetchApi<Msg>(`/admin/transactions/${id}/mark-paid`, json('POST')),
  cancelTransaction: (id: number) => fetchApi<Msg>(`/admin/transactions/${id}/cancel`, json('POST')),

  // Penarikan (multipart karena bisa upload foto bukti)
  getWithdrawals: (params: ListParams) =>
    fetchApi<PaginatedResponse<AdminWithdrawal>>(`/admin/withdrawals${toQuery({ ...params })}`),
  markWithdrawalPaid: (id: number, body: FormData) =>
    fetchApi<Msg>(`/admin/withdrawals/${id}/mark-paid`, { method: 'POST', body }),
  rejectWithdrawal: (id: number, body: FormData) =>
    fetchApi<Msg>(`/admin/withdrawals/${id}/reject`, { method: 'POST', body }),
  runAutoWithdrawals: () => fetchApi<ApiResponse<Record<string, number | boolean>>>('/admin/auto-withdrawals/run', json('POST')),

  // Rekening bank
  getBankAccounts: (params: ListParams) =>
    fetchApi<PaginatedResponse<AdminBankAccount>>(`/admin/bank-accounts${toQuery({ ...params })}`),
  approveBankAccount: (id: number) => fetchApi<Msg>(`/admin/bank-accounts/${id}/approve`, json('PATCH')),
  rejectBankAccount: (id: number) => fetchApi<Msg>(`/admin/bank-accounts/${id}/reject`, json('PATCH')),
  deleteBankAccount: (id: number) => fetchApi<Msg>(`/admin/bank-accounts/${id}`, json('DELETE')),

  // QRIS manual
  getManualQris: () => fetchApi<ApiResponse<ManualQris[]>>('/admin/manual-qris'),
  createManualQris: (body: { name: string; qrisString: string }) =>
    fetchApi<Msg>('/admin/manual-qris', json('POST', body)),
  deleteManualQris: (id: number) => fetchApi<Msg>(`/admin/manual-qris/${id}`, json('DELETE')),

  // Pengaturan sistem
  getSettings: () => fetchApi<ApiResponse<AdminSettings>>('/admin/settings'),
  updateSettings: (body: Record<string, unknown>) => fetchApi<Msg>('/admin/settings', json('PATCH', body)),
  backupDatabase: () => fetchBlob('/admin/backup-db'),

  // Log aktivitas
  getLogs: (params: { page?: number; limit?: number }) =>
    fetchApi<ApiResponse<AdminLog[]> & { total: number; page: number }>(`/admin/logs${toQuery({ ...params })}`),
  createLog: (body: FormData) => fetchApi<Msg>('/admin/logs', { method: 'POST', body }),
};
