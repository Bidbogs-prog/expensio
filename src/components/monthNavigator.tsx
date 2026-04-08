'use client';

import { useExpenseStore } from '@/useExpenseStore';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function MonthNavigator() {
  const currentMonth = useExpenseStore((state) => state.currentMonth);
  const setCurrentMonth = useExpenseStore((state) => state.setCurrentMonth);

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
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={() => navigate('prev')}
        className="h-8 w-8"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <span className="text-sm font-medium min-w-[120px] text-center">
        {formatted}
      </span>

      <Button
        variant="outline"
        size="icon"
        onClick={() => navigate('next')}
        disabled={isCurrentMonth}
        className="h-8 w-8"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}