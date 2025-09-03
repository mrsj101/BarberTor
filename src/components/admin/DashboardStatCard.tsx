import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

type Item = {
  id: string;
  primaryText: string;
  secondaryText: string;
};

type Props = {
  title: string;
  value: number;
  icon: LucideIcon;
  isLoading?: boolean;
  items?: Item[];
  listTitle?: string;
  emptyStateMessage?: string;
  linkTo?: string;
  linkText?: string;
};

export const DashboardStatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  isLoading, 
  items, 
  listTitle, 
  emptyStateMessage,
  linkTo,
  linkText
}: Props) => {
  const displayValue = isLoading ? <Skeleton className="h-8 w-1/2" /> : value;

  return (
    <Card className="relative">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{displayValue}</div>
        
        {items && items.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">{listTitle}</h4>
            <div className="space-y-1">
              {items.map((item) => (
                <div key={item.id} className="text-sm text-muted-foreground">
                  {item.primaryText} - {item.secondaryText}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {items && items.length === 0 && emptyStateMessage && (
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">{emptyStateMessage}</p>
          </div>
        )}

        {linkTo && linkText && (
          <div className="mt-4">
            <Link 
              to={linkTo} 
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              {linkText}
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
};