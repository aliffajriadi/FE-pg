import { fetchApi, toQuery } from './client';
import type { ApiResponse, PaginatedResponse, PaymentStatus } from '@/types';

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

export type BalanceLogType = 'PAYMENT' | 'ADD' | 'SUBTRACT';

/** Mutasi saldo sub admin: PAYMENT = invoice dibayar di QRIS-nya, ADD/SUBTRACT = penyesuaian super admin. */
export interface SubadminBalanceLog {
  id: number;
  type: BalanceLogType;
  amount: number;
  description: string | null;
  occurredAt: string;
  order: { invoiceCode: string; productName: string; store: { name: string } } | null;
  createdBy: { name: string } | null;
  qris: { id: number; name: string } | null;
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

export interface SubadminBalanceSummary {
  /** Uang yang dipegang: total masuk + ditambah admin - dikurangi admin. */
  balance: number;
  today: { amount: number; count: number };
  allTime: { incoming: number; incomingCount: number; added: number; subtracted: number };
  qris: SubadminBalanceQris[];
}

export interface BalanceLogParams {
  page?: number;
  limit?: number;
  type?: string;
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
  getBalanceLogs: (params: BalanceLogParams) =>
    fetchApi<PaginatedResponse<SubadminBalanceLog>>(`/subadmin/balance/logs${toQuery({ ...params })}`),
};
