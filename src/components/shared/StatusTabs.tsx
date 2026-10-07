'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

/** Tab filter status. Di layar sempit bisa di-scroll ke samping tanpa terpotong. */
export function StatusTabs({
  tabs,
  value,
  onChange,
}: {
  tabs: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:px-0">
      <Tabs value={value} onValueChange={(v) => onChange(v as string)}>
        <TabsList className="w-max">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="px-3">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
