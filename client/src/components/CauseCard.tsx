import { Cause } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";

interface CauseCardProps {
  cause: Cause;
}

export function CauseCard({ cause }: CauseCardProps) {
  const { user } = useAuth();
  
  // Dynamic placeholder image based on category
  const imageUrl = `https://source.unsplash.com/random/800x600/?${cause.category},volunteer`;
  // Fallback if Unsplash source is unreliable for demo
  const fallbackImage = "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800&q=80";

  return (
    <div className="group bg-card rounded-2xl border border-border/50 overflow-hidden card-hover h-full flex flex-col">
      <div className="relative h-48 overflow-hidden">
        {/* Descriptive alt text for accessibility */}
        {/* charity volunteer community work */}
        <img 
          src={fallbackImage} 
          alt={cause.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-80" />
        <div className="absolute top-4 left-4">
          <Badge className="bg-white/90 text-secondary hover:bg-white capitalize backdrop-blur-sm">
            {cause.category}
          </Badge>
        </div>
        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
          <Badge variant={cause.urgency > 7 ? "destructive" : "secondary"} className="shadow-lg">
            Urgency: {cause.urgency}/10
          </Badge>
        </div>
      </div>

      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-xl font-bold text-foreground mb-2 line-clamp-1">{cause.title}</h3>
        <p className="text-muted-foreground text-sm line-clamp-3 mb-4 flex-grow">
          {cause.description}
        </p>
        
        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            <span>{cause.location}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-primary" />
            <span>Posted recently</span>
          </div>
        </div>

        <div className="mt-auto">
          <Link href={`/cause/${cause.id}`} className="w-full">
            <Button className="w-full group-hover:bg-primary group-hover:text-white transition-colors">
              View Details
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
