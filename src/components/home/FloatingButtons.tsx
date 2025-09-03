import { Phone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const FloatingButtons = () => {
  return (
    <div className="fixed bottom-4 left-4 flex flex-col gap-3">
      <a href="https://wa.me/972505952966" target="_blank" rel="noopener noreferrer">
        <Button size="icon" className="rounded-full h-14 w-14 bg-green-500 hover:bg-green-600">
          <MessageCircle className="h-7 w-7" />
        </Button>
      </a>
      <a href="tel:0505952966">
        <Button size="icon" className="rounded-full h-14 w-14">
          <Phone className="h-7 w-7" />
        </Button>
      </a>
    </div>
  );
};