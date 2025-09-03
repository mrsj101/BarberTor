import { BusinessHoursManager } from "@/components/admin/BusinessHoursManager";

const SettingsPage = () => {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-center md:text-right">הגדרות מערכת</h1>
      <BusinessHoursManager />
      {/* Other settings components can go here in the future */}
    </div>
  );
};

export default SettingsPage;