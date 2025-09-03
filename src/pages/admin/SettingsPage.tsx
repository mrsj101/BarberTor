import { BusinessHoursManager } from "@/components/admin/BusinessHoursManager";
import { AutoApprovalManager } from "@/components/admin/AutoApprovalManager";
import { PolicyManager } from "@/components/admin/PolicyManager";

const SettingsPage = () => {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-center md:text-right">הגדרות מערכת</h1>
      <AutoApprovalManager />
      <PolicyManager />
      <BusinessHoursManager />
    </div>
  );
};

export default SettingsPage;