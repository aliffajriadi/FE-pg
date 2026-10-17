import type { Metadata } from 'next';
import AgentKeys from '@/features/admin/agent-keys/AgentKeys';

export const metadata: Metadata = { title: 'API Key Agent' };

export default function AdminAgentKeysPage() {
  return <AgentKeys />;
}
