import { MypgGuard } from '@/features/mypg/MypgGuard';

export default function MypgLayout({ children }: { children: React.ReactNode }) {
  return <MypgGuard>{children}</MypgGuard>;
}
