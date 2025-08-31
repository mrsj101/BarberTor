import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
};

export const CalendarToolbar = ({ currentDate, onPrevMonth, onNextMonth, onToday }: Props) => {
  const options: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' };
  const monthYear = new Intl.DateTimeFormat('he-IL', options).format(currentDate);

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-bold">{monthYear}</h2>
        <Button variant="outline" onClick={onToday}>היום</Button>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={onPrevMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={onNextMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};