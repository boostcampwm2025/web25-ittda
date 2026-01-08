import { formatDateISO } from '@/lib/date';
import { create } from 'zustand';

type DateType = ReturnType<typeof formatDateISO>;

interface State {
  selectedDateStr: DateType;
}

interface Action {
  setSelectedDateStr: (date: DateType) => void;
}

export const useWeekCalendar = create<State & Action>((set) => ({
  selectedDateStr: formatDateISO(new Date()),

  setSelectedDateStr: (date: DateType) => {
    set({ selectedDateStr: date });
  },
}));
