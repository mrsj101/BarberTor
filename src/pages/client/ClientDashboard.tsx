import { ActionCards } from "@/components/home/ActionCards";
import { MyAppointments } from "@/components/home/MyAppointments";
import { InstagramGallery } from "@/components/home/InstagramGallery";
import { FloatingButtons } from "@/components/home/FloatingButtons";
import * as React from "react";

const AnimatedDiv = ({ children, delay }: { children: React.ReactNode, delay: number }) => (
  <div
    className="opacity-0 animate-fade-in-up"
    style={{ animationDelay: `${delay}ms` }}
  >
    {children}
  </div>
);

const ClientDashboard = () => {
  return (
    <div className="space-y-8">
      <AnimatedDiv delay={100}>
        <ActionCards />
      </AnimatedDiv>
      <AnimatedDiv delay={200}>
        <MyAppointments />
      </AnimatedDiv>
      <AnimatedDiv delay={300}>
        <InstagramGallery />
      </AnimatedDiv>
      <FloatingButtons />
    </div>
  );
};

export default ClientDashboard;