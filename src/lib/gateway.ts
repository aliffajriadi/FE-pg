export const GATEWAY_OPTIONS = [
  { value: 'PAKASIR', label: 'Pakasir (QRIS via Pakasir SDK)' },
  { value: 'DANA_MANUAL', label: 'DANA Manual (lacak via notifikasi HP)' },
  {
    value: 'SHOPEEPAY_MANUAL',
    label: 'ShopeePay Manual (lacak via notifikasi HP)',
  },
  { value: 'GOPAY_MANUAL', label: 'GoPay Manual (lacak via notifikasi HP)' },
];

export const GATEWAY_SHORT_LABEL: Record<string, string> = {
  PAKASIR: 'Pakasir',
  DANA_MANUAL: 'DANA',
  SHOPEEPAY_MANUAL: 'ShopeePay',
  GOPAY_MANUAL: 'GoPay',
};

export const isManualGateway = (gateway: string | null | undefined) => !!gateway && gateway !== 'PAKASIR';
