import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";

const RescheduleAppointment = () => {
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>דחיית תור</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            ממשק דחיית התורים יפותח בקרוב.
          </p>
          <Link to="/" className="text-primary underline mt-4 inline-block">חזרה למסך הבית</Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default RescheduleAppointment;