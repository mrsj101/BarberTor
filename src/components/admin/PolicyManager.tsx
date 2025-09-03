import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { showError, showSuccess } from "@/utils/toast";

const policySchema = z.object({
  cancellation_hours_before: z.coerce.number().min(0, "הערך חייב להיות חיובי"),
  rebooking_hours_before: z.coerce.number().min(0, "הערך חייב להיות חיובי"),
  cancellation_grace_period_minutes: z.coerce.number().min(0, "הערך חייב להיות חיובי"),
  rebooking_grace_period_minutes: z.coerce.number().min(0, "הערך חייב להיות חיובי"),
});

type PolicySettings = z.infer<typeof policySchema>;

export const PolicyManager = () => {
  const [loading, setLoading] = useState(true);
  const form = useForm<PolicySettings>({
    resolver: zodResolver(policySchema),
    defaultValues: {
      cancellation_hours_before: 12,
      rebooking_hours_before: 12,
      cancellation_grace_period_minutes: 30,
      rebooking_grace_period_minutes: 30,
    },
  });

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("business_settings")
      .select("cancellation_hours_before, rebooking_hours_before, cancellation_grace_period_minutes, rebooking_grace_period_minutes")
      .single();

    if (error) {
      showError("שגיאה בטעינת מדיניות הביטולים.");
    } else if (data) {
      form.reset(data);
    }
    setLoading(false);
  }, [form]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const onSubmit = async (values: PolicySettings) => {
    const { error } = await supabase
      .from("business_settings")
      .update(values)
      .eq("id", 1);

    if (error) {
      showError(`שגיאה בשמירת המדיניות: ${error.message}`);
    } else {
      showSuccess("מדיניות הביטולים והתיאום מחדש עודכנה!");
    }
  };

  if (loading) {
    return <Card><CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader><CardContent><Skeleton className="h-48 w-full" /></CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>מדיניות ביטול ותיאום מחדש</CardTitle>
        <CardDescription>
          קבע את חוקי המערכת לביטול ותיאום מחדש של תורים על ידי לקוחות.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6 p-4 border rounded-lg">
              <h3 className="md:col-span-2 font-semibold text-lg">מגבלת זמן לפני התור</h3>
              <FormField
                control={form.control}
                name="cancellation_hours_before"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ביטול תור (שעות לפני)</FormLabel>
                    <Input type="number" {...field} />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rebooking_hours_before"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>תיאום מחדש (שעות לפני)</FormLabel>
                    <Input type="number" {...field} />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid md:grid-cols-2 gap-6 p-4 border rounded-lg">
              <h3 className="md:col-span-2 font-semibold text-lg">תקופת חסד לאחר קביעת התור</h3>
              <FormField
                control={form.control}
                name="cancellation_grace_period_minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ביטול תור (דקות אחרי)</FormLabel>
                    <Input type="number" {...field} />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rebooking_grace_period_minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>תיאום מחדש (דקות אחרי)</FormLabel>
                    <Input type="number" {...field} />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "שומר..." : "שמור מדיניות"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};