import { z } from 'zod';

/** Untuk `register(..., { setValueAs })`: string kosong menjadi undefined, selain itu Number. */
export const toOptionalNumber = (value: unknown) =>
  value === '' || value === null || value === undefined ? undefined : Number(value);

export const requiredNumber = (message = 'Wajib diisi') =>
  z.number({ error: message }).min(0, 'Tidak boleh negatif');

export const optionalNumber = () => z.number({ error: 'Harus berupa angka' }).min(0, 'Tidak boleh negatif').optional();
