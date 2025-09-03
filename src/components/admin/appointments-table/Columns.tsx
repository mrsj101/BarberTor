import { ColumnDef } from "@tanstack/react-table";
import { AppointmentWithDetails } from "@/pages/admin/AppointmentsManagementPage";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { AppointmentActions } from "./AppointmentActions";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export const statusStyles: { [key: string]: string } = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  approved: "bg-green-500/20 text-green-400 border-green-500/30",
  rejected: "bg-red-500/20 text-red-400 border-red-500/30",
  cancelled: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  completed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  client_approval_pending: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

export const statusText: { [key: string]: string } = {
  pending: "ממתין לאישור",
  approved: "מאושר",
  rejected: "נדחה",
  cancelled: "בוטל",
  completed: "הושלם",
  client_approval_pending: "ממתין לאישור לקוח",
};

export const columns = (
  refetch: () => void
): ColumnDef<AppointmentWithDetails>[] => [
  {
    accessorKey: "client",
    header: "לקוח",
    cell: ({ row }) => {
      const name = row.original.profiles?.first_name || "לקוח לא ידוע";
      const phone = row.original.profiles?.phone || "";
      return (
        <div className="font-medium">
          <div>{name}</div>
          <div className="text-xs text-muted-foreground">{phone}</div>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      const name = row.original.profiles?.first_name?.toLowerCase() || "";
      return name.includes(String(value).toLowerCase());
    },
  },
  {
    accessorKey: "service",
    header: "שירות",
    cell: ({ row }) => row.original.services?.name || "לא ידוע",
  },
  {
    accessorKey: "start_time",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          תאריך ושעה
          <ArrowUpDown className="mr-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = new Date(row.original.start_time);
      return (
        <div>
          <div>{format(date, "dd/MM/yyyy")}</div>
          <div className="text-sm text-muted-foreground">
            {format(date, "HH:mm")}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "סטטוס",
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <Badge variant="outline" className={statusStyles[status] || ""}>
          {statusText[status] || status}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const appointment = row.original;
      return <AppointmentActions appointment={appointment} onUpdate={refetch} />;
    },
  },
];