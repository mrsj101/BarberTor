import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";

const images = Array.from({ length: 6 }, (_, i) => `https://picsum.photos/400/500?random=${i + 1}`);

export const Gallery = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center md:text-right">גלריית עבודות</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((src, index) => (
            <AspectRatio ratio={1 / 1} key={index}>
              <img src={src} alt={`עבודה ${index + 1}`} className="rounded-md object-cover w-full h-full" />
            </AspectRatio>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};