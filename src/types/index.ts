export type UserRole = 'ADMIN' | 'MERCHANT';
export type FeeType = 'FIXED' | 'PERCENT';
export type StoreStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
export type PaymentStatus =
  | 'PENDING'
  | 'WAITING_PAYMENT'
  | 'PAID'
  | 'EXPIRED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED';
export type WithdrawalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID' | 'CANCELLED';
export type BankAccountStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: Pagination;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  isActive?: boolean;
  apiKeyLimit?: number;
  webhookLimit?: number;
  createdAt?: string;
}

export interface Store {
  id: number;
  userId: number;
  name: string;
  slug: string;
  status: StoreStatus;
  feeType: FeeType;
  feeValue: number;
  feeThreshold: number | null;
  extraFeeType: FeeType | null;
  extraFeeValue: number | null;
  balanceHoldHours: number;
  wdFeeType: FeeType;
  wdFeeValue: number;
  wdFeeThreshold: number | null;
  wdExtraFeeType: FeeType | null;
  wdExtraFeeValue: number | null;
  wdMaxAmount: number | null;
  paymentGateway: string;
  autoWdExcluded: boolean;
  manualInvoiceEnabled: boolean;
  createdAt: string;
}

export interface Order {
  id: number;
  storeId: number;
  invoiceCode: string;
  productName: string;
  customerName: string | null;
  customerContact: string | null;
  amount: number;
  platformFee: number;
  totalAmount: number;
  netAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod: string | null;
  paymentNumber: string | null;
  paymentUrl: string | null;
  /** Tambahan nominal gateway manual agar tiap invoice menunggu punya total berbeda. */
  uniqueCode?: number | null;
  externalId?: string | null;
  pgReference?: string | null;
  expiredAt?: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface Withdrawal {
  id: number;
  storeId: number;
  amount: number;
  fee: number;
  bankName: string;
  bankAccount: string;
  bankHolderName: string;
  status: WithdrawalStatus;
  note: string | null;
  adminNote: string | null;
  adminPhotoUrl: string | null;
  isAuto?: boolean;
  createdAt: string;
}

export interface BankAccount {
  id: number;
  storeId: number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  status: BankAccountStatus;
  createdAt: string;
}

export interface BalanceLog {
  id: number;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  description: string | null;
  createdAt: string;
}

export interface AdminLog {
  id: number;
  action: string;
  targetType: string | null;
  targetId: number | null;
  note: string | null;
  photoUrl: string | null;
  createdAt: string;
  admin?: { id: number; name: string; email: string };
}

export interface ManualQris {
  id: number;
  name: string;
  qrisString: string;
  createdAt: string;
}

export interface SystemSetting {
  key: string;
  value: string;
  isActive: boolean;
}

export interface SupportMessage {
  id: number;
  senderRole: UserRole;
  message: string;
  attachmentUrl: string | null;
  createdAt: string;
}

export interface SupportTicket {
  id: number;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  updatedAt: string;
  store?: { name: string; user?: { name: string; email: string } };
  messages?: SupportMessage[];
  _count?: { messages: number };
}

export interface ApiKey {
  id: number;
  name: string;
  key: string;
  isActive: boolean;
  /** Key uji coba (pk_test_...). Undefined = key live. */
  isSandbox?: boolean;
  lastUsedAt: string | null;
  projectId?: number | null;
}

export interface Webhook {
  id: number;
  name: string;
  url: string;
  secret: string;
  isActive: boolean;
  /** Undefined = LIVE. */
  mode?: IntegrationMode;
  projectId?: number | null;
}

export type IntegrationMode = 'LIVE' | 'SANDBOX';

export interface SandboxOrder {
  id: number;
  invoiceCode: string;
  externalId: string | null;
  productName: string;
  customerName: string | null;
  amount: number;
  platformFee: number;
  totalAmount: number;
  netAmount: number;
  paymentStatus: PaymentStatus;
  paymentUrl: string | null;
  expiredAt: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface WebhookDelivery {
  id: number;
  event: string;
  url: string;
  payload: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  responseStatus: number | null;
  responseBody: string | null;
  lastError: string | null;
  createdAt: string;
}

export type ProjectRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ProjectRequest {
  id: number;
  storeId: number;
  name: string;
  purpose: string;
  status: ProjectRequestStatus;
  adminNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export interface Project {
  id: number;
  name: string;
  isActive: boolean;
  apiKeys: ApiKey[];
  webhooks: Webhook[];
}

export interface PublicInvoice {
  /** true untuk invoice uji coba (tidak ada uang yang berpindah). */
  sandbox?: boolean;
  invoiceCode: string;
  storeName: string;
  productName: string;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod: string | null;
  paymentNumber: string | null;
  expiredAt: string | null;
  paidAt: string | null;
}
