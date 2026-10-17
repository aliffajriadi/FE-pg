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

export interface SubadminQrisSummary {
  id: number;
  name: string;
  paidCount: number;
  paidVolume: number;
  todayCount: number;
  todayVolume: number;
  pendingCount: number;
  lastPaidAt: string | null;
}

export interface SubadminDashboard {
  totals: { paidCount: number; paidVolume: number; todayCount: number; todayVolume: number; pendingCount: number };
  qris: SubadminQrisSummary[];
  chartData: { date: string; paidCount: number; totalAmount: number }[];
  recent: SubadminTransaction[];
}

const json = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body) });

export const subadminApi = {
  getDashboard: () => fetchApi<ApiResponse<SubadminDashboard>>('/subadmin/dashboard'),
  updateProfile: (body: { name: string; email: string }) => fetchApi<ApiResponse<unknown>>('/subadmin/profile', json('PATCH', body)),
  updatePassword: (body: { currentPassword: string; newPassword: string }) =>
    fetchApi<ApiResponse<unknown>>('/subadmin/password', json('PATCH', body)),
  markPaid: (id: number) => fetchApi<ApiResponse<unknown>>(`/subadmin/transactions/${id}/mark-paid`, { method: 'POST' }),
  getTransactions: (params: SubadminTransactionParams) =>
    fetchApi<SubadminTransactionsResponse>(`/subadmin/transactions${toQuery({ ...params })}`),
};
