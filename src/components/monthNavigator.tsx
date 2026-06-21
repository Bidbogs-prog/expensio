'use client';

import { useUiStore } from '@/hooks/use-ui-store';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function MonthNavigator() {
  const currentMonth = useUiStore((state) => state.currentMonth);
  const setCurrentMonth = useUiStore((state) => state.setCurrentMonth);

  const formatted = new Date(currentMonth + '-01').toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const navigate = (direction: 'prev' | 'next') => {
    const [year, month] = currentMonth.split('-').map(Number);
    const date = new Date(year, month - 1 + (direction === 'next' ? 1 : -1));
    const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    setCurrentMonth(newMonth);
  };

  const isCurrentMonth = currentMonth === new Date().toISOString().slice(0, 7);

  return (
    <div className="flex items-center gap-1 rounded-full border border-border bg-card/70 p-1 shadow-soft backdrop-blur">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate('prev')}
        className="h-8 w-8 rounded-full hover:text-primary"
        aria-label="Previous month"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <span className="min-w-[140px] text-center text-sm font-semibold tracking-tight">
        {formatted}
      </span>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate('next')}
        disabled={isCurrentMonth}
        className="h-8 w-8 rounded-full hover:text-primary"
        aria-label="Next month"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
