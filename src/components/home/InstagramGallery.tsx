import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Instagram, ExternalLink } from "lucide-react";

export const InstagramGallery = () => {
  // תמונות אמיתיות מהפרופיל אינסטגרם של @tapiro_barber
  const instagramPosts = [
    {
      id: 1,
      imagePath: "/images/instagram/barber_work_1.jpg",
      postUrl: "https://www.instagram.com/tapiro_barber/p/DJDtU81oB1miuvmZ8kFk8tCGvPJaaqEEvSf0FY0/",
      alt: "תספורת פייד נקייה ומעוצבת"
    },
    {
      id: 2,
      imagePath: "/images/instagram/barber_work_2.jpg",
      postUrl: "https://www.instagram.com/tapiro_barber/p/Cq8ZzqGIHTCNxKzK8y4-njGuaND7xjtfzb_Xas0/",
      alt: "קוקו גולגול עם קווים מגולחים"
    },
    {
      id: 3,
      imagePath: "/images/instagram/barber_work_3.jpg",
      postUrl: "https://www.instagram.com/tapiro_barber/p/Co-QJYLKBrZ3lgLGMJWauY5_dj2WW3y3L_vsBM0/",
      alt: "זקן מלא עם קעקוע עוגן"
    },
    {
      id: 4,
      imagePath: "/images/instagram/barber_work_4.jpg",
      postUrl: "https://www.instagram.com/tapiro_barber/p/CS6f3OwAoMakvF1-XbevKEpZiTvcetanzI7QhE0/",
      alt: "תספורת מאלט מודרנית"
    },
    {
      id: 5,
      imagePath: "/images/instagram/barber_work_5.jpg",
      postUrl: "https://www.instagram.com/tapiro_barber/p/CR3KekllF6FW6V68oYA2M9QHy6weM4e3fuwmDM0/",
      alt: "תספורת טרייה ומסודרת"
    },
    {
      id: 6,
      imagePath: "/images/instagram/barber_work_6.jpg",
      postUrl: "https://www.instagram.com/tapiro_barber/p/CKuYM-qFr3Rer5OflbILB6RBcenqXpe2p1RJbY0/",
      alt: "עבודה עם גלימת מספרה לבנה"
    }
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-center md:text-right">גלריית עבודות</CardTitle>
          <a 
            href="https://www.instagram.com/tapiro_barber/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <Instagram className="h-4 w-4" />
            @tapiro_barber
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {instagramPosts.map((post) => (
            <div key={post.id} className="relative group">
              <a 
                href={post.postUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block"
              >
                <div className="aspect-square rounded-lg overflow-hidden border border-muted-foreground/20 hover:border-primary/40 transition-all duration-300 hover:shadow-lg group-hover:shadow-xl">
                  <img 
                    src={post.imagePath} 
                    alt={post.alt}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="bg-white/90 text-black rounded-full p-2 shadow-lg">
                      <Instagram className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </a>
            </div>
          ))}
        </div>
        <div className="mt-6 text-center">
          <a 
            href="https://www.instagram.com/tapiro_barber/" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <Button className="w-full md:w-auto">
              <Instagram className="h-4 w-4 mr-2" />
              צפה בכל העבודות ב-Instagram
            </Button>
          </a>
        </div>
      </CardContent>
    </Card>
  );
};
