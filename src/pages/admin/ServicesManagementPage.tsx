import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, Edit, Trash2 } from "lucide-react";

type Service = {
  id: string;
  name: string;
  duration_minutes: number;
  price: number | null;
  is_active: boolean;
};

const serviceSchema = z.object({
  name: z.string().min(2, { message: "שם השירות חייב להכיל לפחות 2 תווים." }),
  duration_minutes: z.coerce.number().int().positive({ message: "משך הזמן חייב להיות מספר חיובי." }),
  price: z.coerce.number().nonnegative({ message: "המחיר חייב להיות 0 או יותר." }).nullable(),
});

const ServicesManagementPage = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const form = useForm<z.infer<typeof serviceSchema>>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: "",
      duration_minutes: 30,
      price: null,
    },
  });

  const fetchServices = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("services").select("*").order("name");
    if (error) {
      showError("שגיאה בטעינת השירותים.");
    } else {
      setServices(data as Service[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const openDialogForEdit = (service: Service) => {
    setEditingService(service);
    form.reset({
      name: service.name,
      duration_minutes: service.duration_minutes,
      price: service.price,
    });
    setIsDialogOpen(true);
  };

  const openDialogForNew = () => {
    setEditingService(null);
    form.reset({ name: "", duration_minutes: 30, price: null });
    setIsDialogOpen(true);
  };

  const onSubmit = async (values: z.infer<typeof serviceSchema>) => {
    const serviceData = {
      name: values.name,
      duration_minutes: values.duration_minutes,
      price: values.price,
    };

    let error;
    if (editingService) {
      ({ error } = await supabase.from("services").update(serviceData).eq("id", editingService.id));
    } else {
      ({ error } = await supabase.from("services").insert(serviceData));
    }

    if (error) {
      showError(`שגיאה בשמירת השירות: ${error.message}`);
    } else {
      showSuccess(`השירות "${values.name}" נשמר בהצלחה!`);
      setIsDialogOpen(false);
      fetchServices();
    }
  };

  const handleDelete = async (serviceId: string) => {
    if (!window.confirm("האם אתה בטוח שברצונך למחוק את השירות?")) return;
    const { error } = await supabase.from("services").delete().eq("id", serviceId);
    if (error) {
      showError(`שגיאה במחיקת השירות: ${error.message}`);
    } else {
      showSuccess("השירות נמחק בהצלחה.");
      fetchServices();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">ניהול שירותים</h1>
          <p className="text-muted-foreground">הוסף, ערוך ומחק שירותים המוצעים בעסק.</p>
        </div>
        <Button onClick={openDialogForNew}>
          <PlusCircle className="w-4 h-4 ml-2" />
          הוסף שירות חדש
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>שם השירות</TableHead>
                <TableHead className="text-center">משך (דקות)</TableHead>
                <TableHead className="text-center">מחיר (₪)</TableHead>
                <TableHead className="text-right">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={4}><Skeleton className="h-8 w-full" /></TableCell>
                  </TableRow>
                ))
              ) : services.length > 0 ? (
                services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">{service.name}</TableCell>
                    <TableCell className="text-center">{service.duration_minutes}</TableCell>
                    <TableCell className="text-center">{service.price ?? "לא צוין"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => openDialogForEdit(service)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(service.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24">לא נמצאו שירותים. לחץ על "הוסף שירות חדש" כדי להתחיל.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingService ? "עריכת שירות" : "הוספת שירות חדש"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>שם השירות</FormLabel>
                    <FormControl>
                      <Input placeholder="למשל: תספורת גברים" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="duration_minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>משך השירות (בדקות)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="30" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>מחיר (אופציונלי)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="100" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary">ביטול</Button>
                </DialogClose>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "שומר..." : "שמור שירות"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ServicesManagementPage;