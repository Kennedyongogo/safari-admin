import React, { useState, useEffect, useCallback, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import { Box, TextField, Autocomplete, CircularProgress, Typography, Paper, IconButton } from "@mui/material";
import { Map as MapIcon, SatelliteAlt, Terrain, Search } from "@mui/icons-material";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Component to handle map click events
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng);
    },
  });
  return null;
}

// Component to handle map view changes
function MapViewUpdater({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || 13);
    }
  }, [center, zoom, map]);
  return null;
}

const LocationMapPicker = ({
  latitude,
  longitude,
  onLocationChange
}) => {
  const [mapCenter, setMapCenter] = useState([0, 0]); // Default: World center
  const [mapZoom, setMapZoom] = useState(2);
  const [markerPosition, setMarkerPosition] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOptions, setSearchOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mapView, setMapView] = useState("osm"); // "osm", "satellite", "terrain"

  // Cache for search results to avoid duplicate API calls
  const searchCacheRef = useRef(new Map());

  // Advanced search function that tries multiple strategies
  const performSearch = useCallback(async (query, searchParams, controller) => {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${searchParams}`,
      {
        headers: {
          'User-Agent': 'Safari-Admin/1.0 (contact@akirasafari.com)'
        },
        signal: controller.signal
      }
    );

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  }, []);

  // Search for locations using Nominatim (OpenStreetMap geocoding) with improved parameters
  const searchLocations = useCallback(async (query, retryCount = 0) => {
    if (!query || query.length < 2) {
      setSearchOptions([]);
      return;
    }

    // Check cache first
    const cacheKey = query.toLowerCase().trim();
    if (searchCacheRef.current.has(cacheKey)) {
      setSearchOptions(searchCacheRef.current.get(cacheKey));
      return;
    }

    setLoading(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    try {
      let allResults = [];

      // Strategy 1: Standard search
      const standardParams = new URLSearchParams({
        q: query,
        format: 'json',
        limit: '6',
        addressdetails: '1',
        extratags: '1',
        namedetails: '1',
        dedupe: '1',
      });

      try {
        const standardResults = await performSearch(query, standardParams, controller);
        allResults = [...allResults, ...standardResults];
      } catch (error) {
        // Standard search failed - continue with other strategies
      }

      // Strategy 2: Search with country bias (Kenya, Tanzania for safari context)
      if (query.toLowerCase().includes('safari') || query.toLowerCase().includes('kenya') ||
          query.toLowerCase().includes('tanzania') || query.toLowerCase().includes('africa')) {
        const countryParams = new URLSearchParams({
          q: query,
          format: 'json',
          limit: '4',
          addressdetails: '1',
          extratags: '1',
          countrycodes: 'KE,TZ,UG', // Kenya, Tanzania, Uganda
        });

        try {
          const countryResults = await performSearch(query, countryParams, controller);
          allResults = [...allResults, ...countryResults];
        } catch (error) {
          // Country-biased search failed - continue
        }
      }

      // Strategy 3: Search for landmarks/parks if query suggests it
      if (query.toLowerCase().includes('national park') || query.toLowerCase().includes('reserve') ||
          query.toLowerCase().includes('mountain') || query.toLowerCase().includes('lake') ||
          query.toLowerCase().includes('river')) {
        const landmarkParams = new URLSearchParams({
          q: query,
          format: 'json',
          limit: '4',
          addressdetails: '1',
          extratags: '1',
          featuretype: 'landuse,natural',
        });

        try {
          const landmarkResults = await performSearch(query, landmarkParams, controller);
          allResults = [...allResults, ...landmarkResults];
        } catch (error) {
          // Landmark search failed - continue
        }
      }

      clearTimeout(timeoutId);

      // Remove duplicates based on coordinates
      const uniqueResults = allResults.filter((item, index, self) =>
        index === self.findIndex(other =>
          Math.abs(parseFloat(item.lat) - parseFloat(other.lat)) < 0.001 &&
          Math.abs(parseFloat(item.lon) - parseFloat(other.lon)) < 0.001
        )
      );

      // Filter and sort results for better relevance
      const filteredData = uniqueResults
        .filter(item => {
          // Filter out very low importance results, but be more lenient
          return item.importance > 0.05 ||
                 ['city', 'town', 'village', 'national_park', 'park', 'nature_reserve'].includes(item.type) ||
                 item.category === 'natural' || item.category === 'landuse';
        })
        .sort((a, b) => {
          // Sort by importance (higher is better), then by type preference
          const typeOrder = {
            city: 5, town: 4, village: 3,
            national_park: 6, park: 6, nature_reserve: 6,
            mountain: 6, lake: 6, river: 6
          };
          const aTypeScore = typeOrder[a.type] || (a.category === 'natural' ? 6 : 0);
          const bTypeScore = typeOrder[b.type] || (b.category === 'natural' ? 6 : 0);

          if (aTypeScore !== bTypeScore) return bTypeScore - aTypeScore;
          return b.importance - a.importance;
        })
        .slice(0, 8); // Take top 8 results

      const options = filteredData.map(item => ({
        label: item.display_name,
        value: item.display_name,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        type: item.type,
        importance: item.importance,
        category: item.category,
        address: item.address,
      }));

      // Cache the results
      searchCacheRef.current.set(cacheKey, options);
      setSearchOptions(options);

    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        // Search request timed out - silently handle
      } else {
        console.error("Error searching locations:", error);
      }

      // Retry once on failure (if not aborted and retry not attempted)
      if (retryCount === 0 && error.name !== 'AbortError') {
        setTimeout(() => searchLocations(query, 1), 1000);
        return;
      }

      setSearchOptions([]);
    } finally {
      setLoading(false);
    }
  }, [performSearch]);

  // Debounce ref for search
  const searchTimeoutRef = useRef(null);

  // Handle search input change
  const handleSearchInputChange = useCallback((event, newInputValue, reason) => {
    setSearchQuery(newInputValue);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search requests
    if (reason === 'input' && newInputValue.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        searchLocations(newInputValue.trim());
        searchTimeoutRef.current = null;
      }, 300);
    } else if (!newInputValue.trim()) {
      setSearchOptions([]);
      setLoading(false);
    }
  }, [searchLocations]);

  // Handle search selection
  const handleSearchSelect = (event, value) => {
    if (value) {
      const lat = value.lat;
      const lon = value.lon;
      setMapCenter([lat, lon]);
      setMapZoom(13);
      setMarkerPosition([lat, lon]);
      if (onLocationChange) {
        onLocationChange(lat.toString(), lon.toString());
      }
    }
  };

  // Sync with parent state

  // Sync with parent state

  // Initialize marker position if coordinates exist
  useEffect(() => {
    if (latitude && longitude) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        setMarkerPosition([lat, lng]);
        setMapCenter([lat, lng]);
        setMapZoom(13);
      }
    }
  }, [latitude, longitude]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);


  // Handle map click
  const handleMapClick = (latlng) => {
    try {
      if (latlng && latlng.lat && latlng.lng) {
        setMarkerPosition([latlng.lat, latlng.lng]);
        if (onLocationChange) {
          onLocationChange(latlng.lat.toString(), latlng.lng.toString());
        }
      }
    } catch (error) {
      console.error("Error handling map click:", error);
    }
  };



  return (
    <Box sx={{ width: "100%", mt: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 2, color: "#666" }}>
        Search for any location worldwide and select on the map
      </Typography>

      {/* Worldwide Location Search */}
      <Box sx={{ mb: 2 }}>
        <Autocomplete
          disablePortal
          options={searchOptions}
          getOptionLabel={(option) => option.label || ""}
          loading={loading}
          value={null}
          inputValue={searchQuery}
          onInputChange={handleSearchInputChange}
          onChange={handleSearchSelect}
          noOptionsText="Type to search for locations..."
          renderInput={(params) => (
            <TextField
              {...params}
              label="Search Worldwide Locations"
              placeholder="Try: Nairobi, Kenya • Maasai Mara • Mount Kilimanjaro • Safari lodges..."
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <Search sx={{ color: 'action.active', mr: 1 }} />
                ),
                endAdornment: (
                  <>
                    {loading ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "transparent",
                },
              }}
              helperText="Search for cities, landmarks, national parks, lodges, or any location worldwide"
            />
          )}
          renderOption={(props, option) => (
            <Box component="li" {...props} key={option.value} sx={{ py: 1.5 }}>
              <Box sx={{ width: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500, flex: 1, mr: 1 }}>
                    {option.label.split(',')[0] || option.label}
                  </Typography>
                  <Typography variant="caption" sx={{
                    color: 'primary.main',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    px: 1,
                    py: 0.25,
                    borderRadius: 1,
                    fontSize: '0.7rem',
                    textTransform: 'capitalize'
                  }}>
                    {option.type || 'location'}
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.3 }}>
                  {option.address?.country || option.address?.state ?
                    `${option.address?.state ? option.address.state + ', ' : ''}${option.address?.country || ''}`
                    : option.label.split(',').slice(1, 3).join(',').trim()
                  }
                </Typography>
                {option.importance && (
                  <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem' }}>
                    Coordinates: {option.lat.toFixed(4)}, {option.lon.toFixed(4)}
                  </Typography>
                )}
              </Box>
            </Box>
          )}
          ListboxProps={{
            style: {
              maxHeight: '300px',
            }
          }}
          sx={{
            '& .MuiAutocomplete-listbox': {
              '& .MuiAutocomplete-option': {
                '&:hover': {
                  backgroundColor: 'rgba(102, 126, 234, 0.08)',
                },
              },
            },
          }}
        />
      </Box>

      {/* Map */}
      <Paper
        elevation={2}
        sx={{
          width: "100%",
          height: "400px",
          borderRadius: 2,
          overflow: "hidden",
          border: "1px solid #e0e0e0",
          position: "relative",
        }}
      >
        {typeof window !== "undefined" && (
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            style={{ height: "100%", width: "100%", zIndex: 0 }}
            scrollWheelZoom={true}
            key={`map-${mapCenter[0]}-${mapCenter[1]}`}
          >
            {/* OSM Layer */}
            {mapView === "osm" && (
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
            )}
            
            {/* Satellite Layer */}
            {mapView === "satellite" && (
              <TileLayer
                attribution='&copy; <a href="https://www.google.com/maps">Google Maps</a>'
                url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
                maxZoom={20}
              />
            )}
            
            {/* Terrain Layer */}
            {mapView === "terrain" && (
              <TileLayer
                attribution='&copy; <a href="https://opentopomap.org">OpenTopoMap</a> contributors'
                url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
                maxZoom={17}
              />
            )}
            
            <MapViewUpdater center={mapCenter} zoom={mapZoom} />
            <MapClickHandler onMapClick={handleMapClick} />
            {markerPosition && Array.isArray(markerPosition) && markerPosition.length === 2 && (
              <Marker position={markerPosition} />
            )}
          </MapContainer>
        )}
        
        {/* Map View Switcher */}
        <Box
          sx={{
            position: "absolute",
            top: 10,
            right: 10,
            zIndex: 1000,
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            borderRadius: 1,
            border: "1px solid #ccc",
            padding: "4px",
            display: "flex",
            flexDirection: "column",
            gap: "2px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}
        >
          <IconButton
            size="small"
            sx={{
              backgroundColor: mapView === "osm" ? "rgba(33, 150, 243, 0.1)" : "transparent",
              color: mapView === "osm" ? "#2196f3" : "#666",
              "&:hover": { backgroundColor: "rgba(0,0,0,0.04)" },
              padding: "8px",
              minWidth: "40px",
              minHeight: "40px",
            }}
            onClick={() => setMapView("osm")}
            title="OpenStreetMap View"
          >
            <MapIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            sx={{
              backgroundColor: mapView === "satellite" ? "rgba(33, 150, 243, 0.1)" : "transparent",
              color: mapView === "satellite" ? "#2196f3" : "#666",
              "&:hover": { backgroundColor: "rgba(0,0,0,0.04)" },
              padding: "8px",
              minWidth: "40px",
              minHeight: "40px",
            }}
            onClick={() => setMapView("satellite")}
            title="Satellite View"
          >
            <SatelliteAlt fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            sx={{
              backgroundColor: mapView === "terrain" ? "rgba(33, 150, 243, 0.1)" : "transparent",
              color: mapView === "terrain" ? "#2196f3" : "#666",
              "&:hover": { backgroundColor: "rgba(0,0,0,0.04)" },
              padding: "8px",
              minWidth: "40px",
              minHeight: "40px",
            }}
            onClick={() => setMapView("terrain")}
            title="Terrain View"
          >
            <Terrain fontSize="small" />
          </IconButton>
        </Box>
      </Paper>

      {/* Instructions */}
      <Typography variant="caption" sx={{ mt: 1, color: "#999", display: "block" }}>
        💡 Tip: Search for any location worldwide (cities, countries, landmarks) to zoom in, then click on the map to set the exact location. Coordinates will be filled automatically.
      </Typography>
    </Box>
  );
};

export default LocationMapPicker;

