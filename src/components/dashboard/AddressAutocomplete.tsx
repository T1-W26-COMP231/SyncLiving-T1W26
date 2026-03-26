'use client';

import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";
import { useEffect, useRef, useState } from "react";

interface AddressAutocompleteProps {
  defaultValue?: string;
  onAddressSelect: (address: string, city: string, postalCode: string, lat: number, lng: number) => void;
}

export default function AddressAutocomplete({ defaultValue, onAddressSelect }: AddressAutocompleteProps) {
  // Add state to track if google is available
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Poll for google maps availability
    const checkGoogle = () => {
      if ((window as any).google && (window as any).google.maps && (window as any).google.maps.places) {
        setIsLoaded(true);
      } else {
        setTimeout(checkGoogle, 100);
      }
    };
    checkGoogle();
  }, []);

  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      componentRestrictions: { country: "ca" },
    },
    debounce: 300,
    defaultValue: defaultValue,
    initOnMount: isLoaded, // Only init when script is actually there
  });

  // Sync internal value when defaultValue changes (e.g., after DB fetch)
  useEffect(() => {
    if (defaultValue) {
      setValue(defaultValue, false);
    }
  }, [defaultValue, setValue]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  const handleSelect = async (suggestion: any) => {
    const address = suggestion.description;
    setValue(address, false);
    clearSuggestions();

    try {
      const results = await getGeocode({ address });
      const { lat, lng } = await getLatLng(results[0]);
      
      let city = "";
      let postalCode = "";
      
      results[0].address_components.forEach((component: any) => {
        const types = component.types;
        if (types.includes("locality")) {
          city = component.long_name;
        } else if (types.includes("postal_code")) {
          postalCode = component.long_name;
        }
      });

      onAddressSelect(address, city, postalCode, lat, lng);
    } catch (error) {
      console.error("Error Select: ", error);
    }
  };

  return (
    <div className="relative w-full">
      <label className="block text-sm font-semibold text-slate-700 mb-2">
        Address
      </label>
      <div className="relative rounded-xl shadow-sm">
        <input
          value={value}
          onChange={handleInput}
          disabled={!ready || !isLoaded}
          placeholder={isLoaded ? "Enter property address" : "Loading address service..."}
          className="block w-full rounded-xl border-slate-200 bg-slate-50 pl-4 pr-4 py-3 text-slate-900 placeholder-slate-400 focus:border-primary focus:ring-primary sm:text-sm transition-all"
          name="address"
          autoComplete="off"
          required
        />
      </div>

      {status === "OK" && (
        <ul className="absolute z-50 w-full bg-white border border-slate-200 mt-1 rounded-xl shadow-lg max-h-60 overflow-auto py-2">
          {data.map((suggestion) => (
            <li
              key={suggestion.place_id}
              onClick={() => handleSelect(suggestion)}
              className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm text-slate-700 transition-colors border-b border-slate-50 last:border-0"
            >
              <span className="font-bold">{suggestion.structured_formatting.main_text}</span>{" "}
              <span className="text-slate-500 text-xs">{suggestion.structured_formatting.secondary_text}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
