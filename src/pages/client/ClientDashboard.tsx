import { ActionCards } from "@/components/home/ActionCards";
import { MyAppointments } from "@/components/home/MyAppointments";
import { SocialLinks } from "@/components/home/SocialLinks";
import { Gallery } from "@/components/home/Gallery";
import { FloatingButtons } from "@/components/home/FloatingButtons";
import React from "react";

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
        <SocialLinks />
      </AnimatedDiv>
      <AnimatedDiv delay={400}>
        <Gallery />
      </AnimatedDiv>
      <FloatingButtons />
    </div>
  );
};

export default ClientDashboard;