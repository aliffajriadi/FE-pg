import { fetchApi, toQuery } from './client';
import type { ApiResponse, PaginatedResponse, PaymentStatus, WithdrawalStatus } from '@/types';

export interface SubadminTransaction {
  id: number;
  invoiceCode: string;
  productName: string;
  amount: number;
  uniqueCode: number | null;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  createdAt: string;
  paidAt: string | null;
  expiredAt: string | null;
  store: { name: string };
  qris: { id: number; name?: string };
}

export interface SubadminTransactionsResponse extends PaginatedResponse<SubadminTransaction> {
  summary: { total: number; paidCount: number; paidVolume: number };
  /** QRIS yang ditugaskan ke sub admin ini. */
  qris: { id: number; name: string }[];
}

export interface SubadminTransactionParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  qrisId?: number;
  startDate?: string;
  endDate?: string;
}

export interface SubadminPeriodStats {
  /** Invoice dibuat dalam rentang. */
  invoiceCount: number;
  /** Invoice dibayar dalam rentang (berdasarkan tanggal dibayar). */
  paidCount: number;
  paidVolume: number;
}

export interface SubadminQrisSummary extends SubadminPeriodStats {
  id: number;
  name: string;
  /** Invoice yang masih menunggu saat ini. */
  pendingCount: number;
  lastPaidAt: string | null;
}

export interface SubadminDashboard {
  range: { from: string; to: string };
  totals: SubadminPeriodStats & { pendingCount: number };
  qris: SubadminQrisSummary[];
  /** Per hari WIB, date = YYYY-MM-DD. */
  daily: (SubadminPeriodStats & { date: string })[];
  recent: SubadminTransaction[];
}

export type BalanceLogType = 'PAYMENT' | 'ADD' | 'SUBTRACT' | 'WITHDRAWAL';

/**
 * Mutasi saldo sub admin: PAYMENT = invoice dibayar di QRIS-nya, ADD/SUBTRACT = penyesuaian super admin,
 * WITHDRAWAL = penarikan merchant yang ditransfer sub admin.
 */
export interface SubadminBalanceLog {
  id: number;
  type: BalanceLogType;
  amount: number;
  description: string | null;
  occurredAt: string;
  order: { invoiceCode: string; productName: string; amount: number; platformFee: number; store: { name: string } } | null;
  createdBy: { name: string } | null;
  qris: { id: number; name: string } | null;
  withdrawal: { id: number; bankName: string; bankAccount: string; bankHolderName: string; store: { name: string } } | null;
}

export interface SubadminBalanceQris {
  id: number;
  name: string;
  /** false = QRIS lama yang sudah dipindah, uangnya tetap tercatat di sini. */
  isAssigned: boolean;
  todayAmount: number;
  todayCount: number;
  totalAmount: number;
  totalCount: number;
  lastPaidAt: string | null;
}

/** Rincian uang masuk: hak merchant (nominal invoice) + fee platform + kode unik = yang dibayar pembeli. */
export interface PaymentBreakdown {
  merchant: number;
  fee: number;
  unique: number;
}

export interface SubadminBalanceSummary {
  /** Uang yang dipegang: total masuk + ditambah admin - dikurangi admin - penarikan merchant yang ditransfer. */
  balance: number;
  /** Pendapatan platform yang dipegang (fee + kode unik), dikurangi yang sudah disetor. */
  income: number;
  today: { amount: number; count: number; breakdown: PaymentBreakdown };
  allTime: {
    incoming: number;
    incomingCount: number;
    breakdown: PaymentBreakdown;
    added: number;
    subtracted: number;
    withdrawn: number;
    withdrawnCount: number;
  };
  qris: SubadminBalanceQris[];
}

export interface DailyRecapRow extends PaymentBreakdown {
  /** Tanggal WIB YYYY-MM-DD; kosong untuk baris total. */
  date: string;
  count: number;
  incoming: number;
  added: number;
  subtracted: number;
  withdrawn: number;
}

export interface DailyRecap {
  range: { from: string; to: string };
  /** Hari terbaru di atas. */
  days: DailyRecapRow[];
  totals: Omit<DailyRecapRow, 'date'>;
}

export interface BalanceLogParams {
  page?: number;
  limit?: number;
  type?: string;
  /** Tanggal WIB YYYY-MM-DD, opsional. */
  from?: string;
  to?: string;
}

/** Penarikan merchant yang ditugaskan admin. Hanya nominal transfer, biaya admin tidak dikirim. */
export interface SubadminWithdrawal {
  id: number;
  transferAmount: number;
  bankName: string;
  bankAccount: string;
  bankHolderName: string;
  status: WithdrawalStatus;
  /** Catatan merchant. */
  note: string | null;
  /** Catatan saat ditransfer. */
  adminNote: string | null;
  adminPhotoUrl: string | null;
  createdAt: string;
  assignedAt: string | null;
  paidAt: string | null;
  /** false = diproses langsung oleh admin, saldo Anda tidak terpotong. */
  paidBySubadmin: boolean;
  store: { name: string };
}

export interface SubadminWithdrawalsResponse extends PaginatedResponse<SubadminWithdrawal> {
  /** Jumlah penarikan yang masih menunggu ditransfer. */
  openCount: number;
}

const json = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body) });

export const subadminApi = {
  getDashboard: (range: { from: string; to: string }) => fetchApi<ApiResponse<SubadminDashboard>>(`/subadmin/dashboard${toQuery(range)}`),
  updateProfile: (body: { name: string; email: string }) => fetchApi<ApiResponse<unknown>>('/subadmin/profile', json('PATCH', body)),
  updatePassword: (body: { currentPassword: string; newPassword: string }) =>
    fetchApi<ApiResponse<unknown>>('/subadmin/password', json('PATCH', body)),
  markPaid: (id: number) => fetchApi<ApiResponse<unknown>>(`/subadmin/transactions/${id}/mark-paid`, { method: 'POST' }),
  getTransactions: (params: SubadminTransactionParams) =>
    fetchApi<SubadminTransactionsResponse>(`/subadmin/transactions${toQuery({ ...params })}`),
  getBalance: () => fetchApi<ApiResponse<SubadminBalanceSummary>>('/subadmin/balance'),
  getDailyRecap: (range: { from: string; to: string }) => fetchApi<ApiResponse<DailyRecap>>(`/subadmin/balance/daily${toQuery(range)}`),
  getBalanceLogs: (params: BalanceLogParams) =>
    fetchApi<PaginatedResponse<SubadminBalanceLog>>(`/subadmin/balance/logs${toQuery({ ...params })}`),
  getWithdrawals: (params: { page?: number; limit?: number; status?: 'OPEN' | 'DONE' | 'ALL' }) =>
    fetchApi<SubadminWithdrawalsResponse>(`/subadmin/withdrawals${toQuery({ ...params })}`),
  markWithdrawalPaid: (id: number, body: FormData) => fetchApi<ApiResponse<unknown>>(`/subadmin/withdrawals/${id}/mark-paid`, { method: 'POST', body }),
  getNotification: () => fetchApi<ApiResponse<{ discordWebhookUrl: string | null }>>('/subadmin/notification'),
  updateNotification: (discordWebhookUrl: string) => fetchApi<ApiResponse<unknown>>('/subadmin/notification', json('PATCH', { discordWebhookUrl })),
  testNotification: (discordWebhookUrl: string) => fetchApi<ApiResponse<unknown>>('/subadmin/notification/test', json('POST', { discordWebhookUrl })),
  returnWithdrawal: (id: number, reason: string) => fetchApi<ApiResponse<unknown>>(`/subadmin/withdrawals/${id}/return`, json('POST', { reason })),
};
