import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Icon } from "leaflet";
import { Cause } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import { Link } from "wouter";

// Fix Vite/Webpack marker icon path issue with explicit CDN URLs
const defaultIcon = new Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface CauseMapProps {
  causes: Cause[];
}

export function CauseMap({ causes }: CauseMapProps) {
  const mappableCauses = causes.filter(
    (c): c is Cause & { latitude: number; longitude: number } =>
      c.latitude !== null && c.longitude !== null
  );

  const center: [number, number] =
    mappableCauses.length > 0
      ? [
          mappableCauses.reduce((sum, c) => sum + c.latitude, 0) / mappableCauses.length,
          mappableCauses.reduce((sum, c) => sum + c.longitude, 0) / mappableCauses.length,
        ]
      : [20, 0];

  const zoom = mappableCauses.length > 0 ? 5 : 2;

  if (mappableCauses.length === 0) {
    return (
      <div className="text-center py-20 bg-muted/20 rounded-2xl border border-dashed">
        <MapPin className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No causes with map data available</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Causes created with a valid location will appear on the map.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden border border-border/50 shadow-sm">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        style={{ height: "600px", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {mappableCauses.map((cause) => (
          <Marker
            key={cause.id}
            position={[cause.latitude, cause.longitude]}
            icon={defaultIcon}
          >
            <Popup>
              <div className="p-1 min-w-[200px]">
                <h3 className="font-bold text-sm mb-1">{cause.title}</h3>
                <div className="flex gap-1 mb-2">
                  <Badge variant="outline" className="text-xs">
                    {cause.category}
                  </Badge>
                  {cause.urgency !== null && (
                    <Badge
                      variant={cause.urgency > 7 ? "destructive" : "secondary"}
                      className="text-xs"
                    >
                      Urgency: {cause.urgency}/10
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                  {cause.description}
                </p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                  <MapPin className="h-3 w-3" />
                  {cause.location}
                </div>
                <Link href={`/cause/${cause.id}`}>
                  <Button size="sm" className="w-full text-xs">
                    View Details
                  </Button>
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
