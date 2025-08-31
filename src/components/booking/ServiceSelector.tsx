import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Service } from "@/pages/client/BookAppointment";

type Props = {
  onSelectService: (service: Service) => void;
};

export const ServiceSelector = ({ onSelectService }: Props) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("services")
        .select("id, name, duration_minutes, price")
        .eq("is_active", true)
        .order("price");

      if (error) {
        console.error("Error fetching services:", error);
      } else if (data) {
        setServices(data);
      }
      setLoading(false);
    };
    fetchServices();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>שלב 1: בחירת שירות</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        {!loading && services.map((service) => (
          <div
            key={service.id}
            onClick={() => onSelectService(service)}
            className="p-4 border rounded-lg hover:bg-muted cursor-pointer transition-colors flex justify-between items-center"
          >
            <div>
              <p className="font-bold">{service.name}</p>
              <p className="text-sm text-muted-foreground">{service.duration_minutes} דקות</p>
            </div>
            <p className="font-bold text-primary">₪{service.price}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};