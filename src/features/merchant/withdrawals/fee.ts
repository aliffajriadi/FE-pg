import type { DashboardData } from '@/lib/api/merchant';
import { formatCurrency } from '@/lib/utils';

export const MIN_WITHDRAWAL = 15_000;
const NON_DANA_SURCHARGE = 2_500;

type FeeRule = Pick<DashboardData, 'wdFeeType' | 'wdFeeValue' | 'wdFeeThreshold' | 'wdExtraFeeType' | 'wdExtraFeeValue'>;

/** Estimasi biaya penarikan, sama dengan perhitungan backend (utils/fee.js). Nilai final tetap dari backend. */
export function estimateWithdrawalFee(amount: number, rule: FeeRule, bankName?: string) {
  let fee = rule.wdFeeType === 'PERCENT' ? Math.ceil((amount * rule.wdFeeValue) / 100) : (rule.wdFeeValue ?? 3500);

  if (rule.wdFeeThreshold && amount >= rule.wdFeeThreshold) {
    if (rule.wdExtraFeeType === 'PERCENT') fee += Math.ceil((amount * (rule.wdExtraFeeValue ?? 0)) / 100);
    else if (rule.wdExtraFeeType === 'FIXED') fee += rule.wdExtraFeeValue ?? 0;
  }

  if (bankName && bankName.trim().toUpperCase() !== 'DANA') fee += NON_DANA_SURCHARGE;
  return fee;
}

export function describeFeeRule(rule: FeeRule) {
  const format = (type: string | null, value: number | null) =>
    type === 'PERCENT' ? `${value ?? 0}%` : formatCurrency(value ?? 0);

  let text = format(rule.wdFeeType, rule.wdFeeValue);
  if (rule.wdFeeThreshold) {
    text += ` (+${format(rule.wdExtraFeeType, rule.wdExtraFeeValue)} jika ≥ ${formatCurrency(rule.wdFeeThreshold)})`;
  }
  return text;
}

export { NON_DANA_SURCHARGE };
