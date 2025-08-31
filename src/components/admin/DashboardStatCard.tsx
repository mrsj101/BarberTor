import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { LucideIcon } from "lucide-react";

type Item = {
  id: string;
  primaryText: string;
  secondaryText: string;
};

type Props = {
  title: string;
  value: number | string;
  icon: LucideIcon;
  isLoading: boolean;
  items?: Item[];
  listTitle?: string;
  emptyStateMessage?: string;
};

export const DashboardStatCard = ({ title, value, icon: Icon, isLoading, items, listTitle, emptyStateMessage }: Props) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-1/2" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
        {items && !isLoading && (
          <div className="mt-4 space-y-2 pt-4 border-t">
            <h4 className="text-xs font-semibold text-muted-foreground">{listTitle}</h4>
            {items.length > 0 ? (
              <div className="space-y-2">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between items-center text-sm">
                    <p className="font-medium">{item.primaryText}</p>
                    <p className="text-muted-foreground">{item.secondaryText}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center pt-2">{emptyStateMessage}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};