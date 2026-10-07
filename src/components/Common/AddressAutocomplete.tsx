import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2, Navigation, Check, Sparkles } from 'lucide-react';

export interface AddressResult {
  address: string;
  suburb: string;
  postcode?: string;
  state?: string;
  coordinates: [number, number];
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onAddressSelect: (result: AddressResult) => void;
  placeholder?: string;
  className?: string;
  currentLocation?: [number, number];
}

interface Suggestion {
  id: string;
  primaryText: string;
  secondaryText: string;
  fullAddress: string;
  suburb: string;
  postcode?: string;
  state?: string;
  coordinates: [number, number];
  source: 'google' | 'osm';
}

declare global {
  interface Window {
    google?: any;
    __googleMapsLoading?: boolean;
  }
}

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChange,
  onAddressSelect,
  placeholder = 'Search street address or place...',
  className = '',
  currentLocation = [-37.9175, 144.7492] // Point Cook default
}) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLocating, setIsLocating] = useState(false);
  const [hasGoogleApi, setHasGoogleApi] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const googleApiKey =
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
    (typeof window !== 'undefined' ? localStorage.getItem('handymap_google_maps_key') : null);

  // Initialize Google Maps Places if API key is provided
  useEffect(() => {
    if (!googleApiKey) return;

    if (window.google?.maps?.places) {
      setHasGoogleApi(true);
      return;
    }

    if (!window.__googleMapsLoading) {
      window.__googleMapsLoading = true;
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${googleApiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setHasGoogleApi(true);
      };
      script.onerror = () => {
        console.warn('Failed to load Google Maps API script, falling back to instant geocoder.');
      };
      document.head.appendChild(script);
    }
  }, [googleApiKey]);

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch address suggestions
  const fetchSuggestions = async (query: string) => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      // 1. If Google Places is loaded, query Google Autocomplete Service
      if (hasGoogleApi && window.google?.maps?.places) {
        const autocompleteService = new window.google.maps.places.AutocompleteService();
        const melbourneCenter = new window.google.maps.LatLng(currentLocation[0], currentLocation[1]);

        autocompleteService.getPlacePredictions(
          {
            input: query,
            componentRestrictions: { country: 'au' },
            location: melbourneCenter,
            radius: 50000 // 50km around Melbourne
          },
          (predictions: any[], status: any) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
              const geocoder = new window.google.maps.Geocoder();
              const googleSuggestions: Suggestion[] = predictions.map((p, idx) => ({
                id: p.place_id || `google-${idx}`,
                primaryText: p.structured_formatting?.main_text || p.description,
                secondaryText: p.structured_formatting?.secondary_text || 'Australia',
                fullAddress: p.description,
                suburb: p.structured_formatting?.secondary_text?.split(',')[0]?.trim() || 'Melbourne',
                source: 'google',
                coordinates: [currentLocation[0], currentLocation[1]]
              }));

              setSuggestions(googleSuggestions);
              setIsOpen(googleSuggestions.length > 0);
              setIsLoading(false);
              return;
            }
            // Fallback to OSM if Google returns no predictions
            fetchOsmSuggestions(query);
          }
        );
        return;
      }

      // 2. Default: Ultra-fast Photon / OpenStreetMap Australian Autocomplete
      await fetchOsmSuggestions(query);
    } catch (err) {
      console.error('Address lookup error:', err);
      setIsLoading(false);
    }
  };

  const fetchOsmSuggestions = async (query: string) => {
    try {
      // Photon API biased around Melbourne / Victoria
      const res = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&lat=${currentLocation[0]}&lon=${currentLocation[1]}&limit=6`
      );
      if (!res.ok) throw new Error('Photon geocoder error');
      const data = await res.json();

      if (data.features && data.features.length > 0) {
        const results: Suggestion[] = data.features
          .filter((f: any) => {
            const country = (f.properties?.country || '').toLowerCase();
            const countryCode = (f.properties?.countrycode || '').toLowerCase();
            return country.includes('australia') || countryCode === 'au' || !f.properties?.country;
          })
          .map((f: any, idx: number) => {
            const p = f.properties || {};
            const coords: [number, number] = [f.geometry.coordinates[1], f.geometry.coordinates[0]];

            const streetPart = [p.housenumber, p.street || p.name].filter(Boolean).join(' ');
            const suburbPart = p.district || p.locality || p.city || p.town || 'Melbourne';
            const statePart = p.state || 'VIC';
            const postcodePart = p.postcode || '';

            const primaryText = streetPart || p.name || 'Location';
            const secondaryText = [suburbPart, statePart, postcodePart].filter(Boolean).join(' ');
            const fullAddress = `${primaryText}, ${secondaryText}`;

            return {
              id: `osm-${p.osm_id || idx}`,
              primaryText,
              secondaryText,
              fullAddress,
              suburb: suburbPart,
              postcode: postcodePart,
              state: statePart,
              coordinates: coords,
              source: 'osm'
            };
          });

        setSuggestions(results);
        setIsOpen(results.length > 0);
      } else {
        setSuggestions([]);
        setIsOpen(false);
      }
    } catch (err) {
      console.warn('Photon lookup fallback:', err);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (val.trim().length >= 2) {
      setIsLoading(true);
      debounceTimerRef.current = setTimeout(() => {
        fetchSuggestions(val);
      }, 250);
    } else {
      setSuggestions([]);
      setIsOpen(false);
      setIsLoading(false);
    }
  };

  const handleSelectSuggestion = async (suggestion: Suggestion) => {
    let finalCoords = suggestion.coordinates;
    let finalAddress = suggestion.fullAddress;
    let finalSuburb = suggestion.suburb;
    let finalPostcode = suggestion.postcode;
    let finalState = suggestion.state;

    // If suggestion is from Google Places and needs precise LatLng
    if (suggestion.source === 'google' && window.google?.maps?.places) {
      try {
        const geocoder = new window.google.maps.Geocoder();
        const res = await geocoder.geocode({ placeId: suggestion.id });
        if (res.results && res.results[0]) {
          const result = res.results[0];
          const lat = result.geometry.location.lat();
          const lng = result.geometry.location.lng();
          finalCoords = [lat, lng];
          finalAddress = result.formatted_address;

          // Extract suburb & postcode from address components
          result.address_components?.forEach((comp: any) => {
            if (comp.types.includes('locality') || comp.types.includes('sublocality')) {
              finalSuburb = comp.long_name;
            }
            if (comp.types.includes('postal_code')) {
              finalPostcode = comp.long_name;
            }
            if (comp.types.includes('administrative_area_level_1')) {
              finalState = comp.short_name;
            }
          });
        }
      } catch (e) {
        console.warn('Google place details geocoding failed:', e);
      }
    }

    onChange(finalAddress);
    setIsOpen(false);
    setSuggestions([]);

    onAddressSelect({
      address: finalAddress,
      suburb: finalSuburb,
      postcode: finalPostcode,
      state: finalState,
      coordinates: finalCoords
    });
  };

  // GPS Current Location button
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        try {
          // Reverse geocode
          const res = await fetch(
            `https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}`
          );
          if (res.ok) {
            const data = await res.json();
            if (data.features && data.features[0]) {
              const p = data.features[0].properties || {};
              const street = [p.housenumber, p.street || p.name].filter(Boolean).join(' ');
              const suburb = p.district || p.locality || p.city || 'Point Cook';
              const state = p.state || 'VIC';
              const postcode = p.postcode || '';
              const fullAddress = `${street || 'Current Location'}, ${suburb} ${state} ${postcode}`.trim();

              onChange(fullAddress);
              onAddressSelect({
                address: fullAddress,
                suburb,
                state,
                postcode,
                coordinates: [lat, lng]
              });
              setIsOpen(false);
              setIsLocating(false);
              return;
            }
          }
        } catch (e) {
          console.warn('Reverse geocode error:', e);
        }

        // Fallback if reverse geocode fails
        const fallbackAddress = `GPS Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
        onChange(fallbackAddress);
        onAddressSelect({
          address: fallbackAddress,
          suburb: 'Current Location',
          coordinates: [lat, lng]
        });
        setIsOpen(false);
        setIsLocating(false);
      },
      (err) => {
        console.error('Geolocation error:', err);
        setIsLocating(false);
        alert('Could not access your location. Please check your browser location permissions.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        handleSelectSuggestion(suggestions[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <MapPin className="w-4 h-4 text-blue-600 absolute left-3 top-3 pointer-events-none" />

        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className={`w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-16 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition text-xs ${className}`}
        />

        <div className="absolute right-2.5 top-2.5 flex items-center gap-1">
          {isLoading && (
            <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
          )}

          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isLocating}
            title="Use current GPS location"
            className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-blue-600 transition"
          >
            {isLocating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
            ) : (
              <Navigation className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Autocomplete Dropdown Popup */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-2xl border border-slate-200 py-1.5 z-[3500] max-h-64 overflow-y-auto animate-in fade-in zoom-in-95 text-xs">
          <div className="px-3 py-1 border-b border-slate-100 flex items-center justify-between text-[10px] font-bold uppercase text-slate-400">
            <span>Address Suggestions</span>
            <span className="text-blue-600 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {hasGoogleApi ? 'Google Maps' : 'Auto Geocoding'}
            </span>
          </div>

          <div className="divide-y divide-slate-50">
            {suggestions.map((item, idx) => {
              const isSelected = selectedIndex === idx;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectSuggestion(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full text-left px-3 py-2.5 flex items-start gap-2.5 transition ${
                    isSelected ? 'bg-blue-50/80 text-blue-900' : 'hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg mt-0.5 shrink-0 ${
                    isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    <MapPin className="w-3.5 h-3.5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 truncate">
                      {item.primaryText}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {item.secondaryText}
                    </p>
                  </div>

                  {isSelected && (
                    <Check className="w-4 h-4 text-blue-600 shrink-0 self-center" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="px-3 py-1.5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between text-[10px] text-slate-500">
            <span>Tip: Select to auto-set exact map pin & suburb</span>
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              className="text-blue-600 font-bold hover:underline flex items-center gap-1"
            >
              <Navigation className="w-3 h-3" /> Current Location
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
