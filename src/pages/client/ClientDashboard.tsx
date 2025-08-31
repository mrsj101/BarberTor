import { ActionCards } from "@/components/home/ActionCards";
import { MyAppointments } from "@/components/home/MyAppointments";
import { SocialLinks } from "@/components/home/SocialLinks";
import { Gallery } from "@/components/home/Gallery";
import { FloatingButtons } from "@/components/home/FloatingButtons";

const ClientDashboard = () => {
  return (
    <div className="space-y-8">
      <ActionCards />
      <MyAppointments />
      <SocialLinks />
      <Gallery />
      <FloatingButtons />
    </div>
  );
};

export default ClientDashboard;