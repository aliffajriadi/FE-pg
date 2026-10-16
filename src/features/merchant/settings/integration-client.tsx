'use client';

import { createContext, useContext } from 'react';
import type { QueryKey } from '@tanstack/react-query';
import { merchantApi } from '@/lib/api/merchant';
import { mypgApi } from '@/lib/api/mypg';

/**
 * Sumber data untuk komponen Integrasi API & Sandbox. Dashboard live memakai merchantApi;
 * Panel MyPG memakai mypgApi dengan bentuk endpoint yang sama, sehingga tampilannya dipakai ulang.
 */
export interface IntegrationClient {
  scope: 'live' | 'mypg';
  api: Pick<
    typeof merchantApi,
    | 'getProjects'
    | 'deleteProject'
    | 'getApiKeys'
    | 'createApiKey'
    | 'deleteApiKey'
    | 'getWebhooks'
    | 'createWebhook'
    | 'updateWebhook'
    | 'deleteWebhook'
    | 'regenerateWebhookSecret'
    | 'testWebhook'
    | 'getSandboxInvoices'
    | 'createSandboxInvoice'
    | 'simulateSandboxInvoice'
    | 'getSandboxDeliveries'
    | 'resendSandboxDelivery'
  >;
  keys: {
    projects: QueryKey;
    apiKeys: QueryKey;
    webhooks: QueryKey;
    sandboxInvoices: string;
    sandboxDeliveries: string;
  };
  /** Prefix API key: pk (live) atau mp (MyPG). */
  keyPrefix: 'pk' | 'mp';
  /** Path API publik, mis. /api/v1 */
  apiPath: string;
  docsHref: string;
  sandboxHref: string;
  sandboxPayHref: (invoiceCode: string) => string;
  /** live: proyek lewat pengajuan admin; mypg: dibuat langsung. */
  directProjects: boolean;
  /** Key live boleh dihapus merchant sendiri (MyPG). */
  canDeleteLiveKeys: boolean;
}

export const LIVE_CLIENT: IntegrationClient = {
  scope: 'live',
  api: merchantApi,
  keys: {
    projects: ['merchant-projects'],
    apiKeys: ['merchant-api-keys'],
    webhooks: ['merchant-webhooks'],
    sandboxInvoices: 'sandbox-invoices',
    sandboxDeliveries: 'sandbox-deliveries',
  },
  keyPrefix: 'pk',
  apiPath: '/api/v1',
  docsHref: '/docs',
  sandboxHref: '/dashboard/sandbox',
  sandboxPayHref: (code) => `/pay/sandbox/${code}`,
  directProjects: false,
  canDeleteLiveKeys: false,
};

export const MYPG_CLIENT: IntegrationClient = {
  scope: 'mypg',
  api: mypgApi,
  keys: {
    projects: ['mypg-projects'],
    apiKeys: ['mypg-api-keys'],
    webhooks: ['mypg-webhooks'],
    sandboxInvoices: 'mypg-sandbox-invoices',
    sandboxDeliveries: 'mypg-sandbox-deliveries',
  },
  keyPrefix: 'mp',
  apiPath: '/api/mypg/v1',
  docsHref: '/docs/mypg',
  sandboxHref: '/dashboard/mypg/sandbox',
  sandboxPayHref: (code) => `/pay/mypg/sandbox/${code}`,
  directProjects: true,
  canDeleteLiveKeys: true,
};

const IntegrationClientContext = createContext<IntegrationClient>(LIVE_CLIENT);

export function IntegrationClientProvider({ scope, children }: { scope: IntegrationClient['scope']; children: React.ReactNode }) {
  return (
    <IntegrationClientContext.Provider value={scope === 'mypg' ? MYPG_CLIENT : LIVE_CLIENT}>{children}</IntegrationClientContext.Provider>
  );
}

export const useIntegrationClient = () => useContext(IntegrationClientContext);

/** Query yang di-refresh setelah perubahan proyek/key/webhook. */
export const integrationKeysOf = (client: IntegrationClient) => [client.keys.projects, client.keys.webhooks, client.keys.apiKeys];
