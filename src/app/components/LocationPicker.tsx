import React, { useState, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Autocomplete } from '@react-google-maps/api';
import { MapPin, Search, Crosshair, X, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface LocationPickerProps {
  onLocationSelect: (location: {
    lat: number;
    lng: number;
    address: string;
    city: string;
    state: string;
    pincode: string;
  }) => void;
  onClose: () => void;
}

const defaultCenter = { lat: 20.5937, lng: 78.9629 }; // India center
const MAP_LIBRARIES: "places"[] = ['places'];

export function LocationPicker({ onLocationSelect, onClose }: LocationPickerProps) {
  const rawKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const apiKey = (typeof rawKey === 'string' ? rawKey.trim() : '');
  
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
    libraries: MAP_LIBRARIES,
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markerPos, setMarkerPos] = useState<google.maps.LatLngLiteral | null>(null);
  const [addressLine, setAddressLine] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const onLoad = useCallback(function callback(map: google.maps.Map) {
    setMap(map);
    // Optional: Get user location
    if (navigator.geolocation) {
       navigator.geolocation.getCurrentPosition((pos) => {
         const userLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
         map.panTo(userLoc);
         map.setZoom(15);
         setMarkerPos(userLoc);
         geocodeLocation(userLoc);
       });
    }
  }, []);

  const onUnmount = useCallback(function callback(map: google.maps.Map) {
    setMap(null);
  }, []);

  const geocodeLocation = async (latLng: google.maps.LatLngLiteral) => {
    if (!window.google) return;
    setIsGeocoding(true);
    const geocoder = new window.google.maps.Geocoder();
    
    try {
      const response = await geocoder.geocode({ location: latLng });
      if (response.results[0]) {
        const result = response.results[0];
        setAddressLine(result.formatted_address);
      } else {
        setAddressLine('Location not found');
      }
    } catch (e) {
      console.error(e);
      setAddressLine('Error fetching address');
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const loc = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      setMarkerPos(loc);
      geocodeLocation(loc);
    }
  };

  const onPlaceChanged = () => {
    if (autocompleteRef.current !== null) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry?.location) {
        const loc = { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() };
        setMarkerPos(loc);
        map?.panTo(loc);
        map?.setZoom(16);
        setAddressLine(place.formatted_address || '');
      }
    }
  };

  const handleConfirm = async () => {
    if (!markerPos) return;
    
    // We parse the exact city, state, pincode again just to be sure
    // In production we would extract these from the actual geocoder component loops
    // For this prototype, we'll try to extract them if geocoder is available
    let city = "Unknown";
    let state = "Unknown";
    let pincode = "";

    if (window.google) {
      const geocoder = new window.google.maps.Geocoder();
      try {
        const response = await geocoder.geocode({ location: markerPos });
        if (response.results[0]) {
           const comps = response.results[0].address_components;
           comps.forEach(c => {
             if (c.types.includes('locality')) city = c.long_name;
             if (c.types.includes('administrative_area_level_1')) state = c.long_name;
             if (c.types.includes('postal_code')) pincode = c.long_name;
           });
        }
      } catch (e) {}
    }

    onLocationSelect({
      lat: markerPos.lat,
      lng: markerPos.lng,
      address: addressLine,
      city,
      state,
      pincode
    });
  };

  if (loadError || !apiKey) {
    return (
      <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-card w-full max-w-md rounded-3xl border border-border shadow-2xl p-6 relative">
           <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
             <X className="w-5 h-5" />
           </button>
           <div className="text-center space-y-4 pt-4 pb-2">
             <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-2 text-muted-foreground">
                <MapPin className="w-8 h-8" />
             </div>
             <h3 className="text-lg font-bold">Map unavailable</h3>
             <p className="text-sm text-muted-foreground">
               Please provide a valid <code>VITE_GOOGLE_MAPS_API_KEY</code> in your environment file, or fallback to manual entries.
             </p>
             <Button onClick={onClose} className="w-full mt-4">Close Modal</Button>
           </div>
        </div>
      </div>
    );
  }

  if (!isLoaded) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex flex-col md:items-center md:justify-center">
      <div className="bg-card w-full h-full md:h-auto md:max-h-[90vh] md:max-w-2xl md:rounded-[2rem] border-0 md:border border-border shadow-2xl flex flex-col overflow-hidden relative">
        
        {/* Header Search */}
        <div className="p-4 bg-card border-b border-border z-10 flex gap-2">
          <div className="flex-1 relative">
            <Autocomplete 
              onLoad={(autocomplete) => autocompleteRef.current = autocomplete}
              onPlaceChanged={onPlaceChanged}
            >
               <div className="relative">
                 <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                 <Input 
                   type="text" 
                   placeholder="Search for your area, street..." 
                   className="pl-10 h-12 rounded-xl bg-muted/50 border-transparent focus-visible:border-primary"
                 />
               </div>
            </Autocomplete>
          </div>
          <Button variant="outline" size="icon" onClick={() => {
             if (navigator.geolocation) {
               navigator.geolocation.getCurrentPosition((pos) => {
                 const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                 map?.panTo(loc);
                 map?.setZoom(16);
                 setMarkerPos(loc);
                 geocodeLocation(loc);
               });
             }
          }} className="h-12 w-12 rounded-xl shrink-0">
             <Crosshair className="w-5 h-5 text-foreground" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-12 w-12 rounded-xl shrink-0">
             <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Map Body */}
        <div className="flex-1 relative min-h-[300px]">
           <GoogleMap
             mapContainerStyle={{ width: '100%', height: '100%' }}
             center={defaultCenter}
             zoom={5}
             onLoad={onLoad}
             onUnmount={onUnmount}
             onClick={handleMapClick}
             options={{
               disableDefaultUI: true,
               zoomControl: true,
               styles: [
                  // Dark minimal map style for fintech look
                  { "elementType": "geometry", "stylers": [{"color": "#1A1A2E"}] },
                  { "elementType": "labels.text.stroke", "stylers": [{"color": "#1A1A2E"}] },
                  { "elementType": "labels.text.fill", "stylers": [{"color": "#746855"}] },
                  { "featureType": "water", "stylers": [{"color": "#2c2c4d"}] },
               ]
             }}
           >
             {markerPos && <Marker position={markerPos} animation={window.google.maps.Animation.DROP} />}
           </GoogleMap>
        </div>

        {/* Footer Actions */}
        <div className="p-5 bg-card border-t border-border z-10 shadow-[0_-20px_40px_rgba(0,0,0,0.1)]">
           <div className="mb-4">
             <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 flex items-center gap-2">
               Selected Location {isGeocoding && <Loader2 className="w-3 h-3 animate-spin"/>}
             </p>
             <p className="text-base font-medium line-clamp-2 leading-snug">
                {addressLine || "Drop a pin on the map to set location"}
             </p>
           </div>
           <Button 
             className="w-full h-14 rounded-2xl text-lg font-bold tracking-wide" 
             disabled={!markerPos || isGeocoding}
             onClick={handleConfirm}
           >
             Confirm Location
           </Button>
        </div>

      </div>
    </div>
  );
}
