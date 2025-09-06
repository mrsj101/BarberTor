import { Card, CardContent } from "@/components/ui/card";
import { CalendarPlus, CalendarClock, CalendarX } from "lucide-react";
import { Link } from "react-router-dom";

const actions = [
  {
    title: "קביעת תור",
    icon: <CalendarPlus className="w-10 h-10 text-primary mb-2" />,
    href: "/book",
  },
  {
    title: "תיאום תור מחדש",
    icon: <CalendarClock className="w-10 h-10 text-primary mb-2" />,
    href: "/rebook",
  },
  {
    title: "ביטול תור",
    icon: <CalendarX className="w-10 h-10 text-primary mb-2" />,
    href: "/cancel",
  },
];

export const ActionCards = () => {
  return (
    <div className="grid grid-cols-3 gap-4">
      {actions.map((action) => (
        <Link to={action.href} key={action.title}>
          <Card className="bg-muted hover:bg-accent transition-colors text-center p-4">
            <CardContent className="p-0 flex flex-col items-center justify-center">
              {action.icon}
              <span className="font-bold">{action.title}</span>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
};