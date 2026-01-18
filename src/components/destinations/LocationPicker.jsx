import React, { useState, useEffect, useRef } from "react";
import { Box, TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions, Typography, Stack, IconButton, Paper, List, ListItem, ListItemText } from "@mui/material";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import CloseIcon from "@mui/icons-material/Close";

// Fix for default marker icon in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Component to handle map clicks
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
  });
  return null;
}

// Component to handle map center updates
function MapCenterUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom() > 10 ? map.getZoom() : 13);
    }
  }, [center, map]);
  return null;
}

// Draggable marker component
function DraggableMarker({ position, onPositionChange }) {
  const [draggable, setDraggable] = useState(true);

  const markerRef = useRef(null);
  const eventHandlers = {
    dragend() {
      const marker = markerRef.current;
      if (marker != null) {
        const newPosition = marker.getLatLng();
        onPositionChange(newPosition);
      }
    },
  };

  return (
    <Marker
      draggable={draggable}
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
    />
  );
}

const LocationPicker = ({ open, onClose, onSelect, initialLat, initialLng, searchValue = "" }) => {
  const [position, setPosition] = useState(
    initialLat && initialLng ? [initialLat, initialLng] : [-1.2921, 36.8219] // Default to Nairobi
  );
  const [mapCenter, setMapCenter] = useState(
    initialLat && initialLng ? [initialLat, initialLng] : [-1.2921, 36.8219]
  );
  const [searchInput, setSearchInput] = useState(searchValue);
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    if (initialLat && initialLng) {
      const newPosition = [initialLat, initialLng];
      setPosition(newPosition);
      setMapCenter(newPosition);
    }
  }, [initialLat, initialLng]);

  // Debounced search effect
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchInput.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchInput)}&limit=5`,
          {
            headers: {
              "User-Agent": "Foundation Admin Portal",
            },
          }
        );
        const data = await response.json();

        if (data && data.length > 0) {
          setSearchResults(data);
          setShowResults(true);
        } else {
          setSearchResults([]);
          setShowResults(false);
        }
      } catch (error) {
        console.error("Error searching location:", error);
        setSearchResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchInput]);

  const handleMapClick = (latlng) => {
    const newPosition = [latlng.lat, latlng.lng];
    setPosition(newPosition);
    setMapCenter(newPosition);
  };

  const handleMarkerDrag = (latlng) => {
    const newPosition = [latlng.lat, latlng.lng];
    setPosition(newPosition);
  };

  const handleResultClick = (result) => {
    const newPosition = [parseFloat(result.lat), parseFloat(result.lon)];
    setPosition(newPosition);
    setMapCenter(newPosition);
    setSearchInput(result.display_name);
    setSearchResults([]);
    setShowResults(false);
  };

  const handleSearchInputChange = (e) => {
    setSearchInput(e.target.value);
  };

  const handleSearchBlur = () => {
    // Delay hiding results to allow click events to fire
    setTimeout(() => {
      setShowResults(false);
    }, 200);
  };

  const handleConfirm = () => {
    if (position && position.length === 2) {
      onSelect({
        latitude: position[0],
        longitude: position[1],
        address: searchInput || `Lat: ${position[0].toFixed(6)}, Lng: ${position[1].toFixed(6)}`,
      });
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Select Location on Map</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Box sx={{ position: "relative" }}>
            <TextField
              fullWidth
              label="Search Location"
              value={searchInput}
              onChange={handleSearchInputChange}
              onFocus={() => {
                if (searchResults.length > 0) {
                  setShowResults(true);
                }
              }}
              onBlur={handleSearchBlur}
              placeholder="Type to search (e.g., Maasai Mara, Nairobi, Mount Kilimanjaro)"
              size="small"
              autoComplete="off"
            />
            {showResults && searchResults.length > 0 && (
              <Paper
                sx={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  zIndex: 1000,
                  mt: 0.5,
                  maxHeight: 200,
                  overflow: "auto",
                  boxShadow: 3,
                }}
              >
                <List dense>
                  {searchResults.map((result, idx) => (
                    <ListItem
                      key={idx}
                      onClick={() => handleResultClick(result)}
                      sx={{
                        cursor: "pointer",
                        "&:hover": { bgcolor: "#f5f5f5" },
                      }}
                    >
                      <ListItemText
                        primary={result.display_name}
                        primaryTypographyProps={{ variant: "body2" }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}
          </Box>

          <Box sx={{ height: 400, width: "100%", position: "relative" }}>
            <MapContainer
              center={mapCenter}
              zoom={mapCenter[0] === -1.2921 && mapCenter[1] === 36.8219 ? 6 : 10}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <DraggableMarker position={position} onPositionChange={handleMarkerDrag} />
              <MapClickHandler onMapClick={handleMapClick} />
              <MapCenterUpdater center={mapCenter} />
            </MapContainer>
          </Box>

          <Box sx={{ p: 2, bgcolor: "#f5f5f5", borderRadius: 1 }}>
            <Typography variant="body2">
              <strong>Coordinates:</strong>
            </Typography>
            <Typography variant="body2">
              Latitude: {position[0].toFixed(6)}
            </Typography>
            <Typography variant="body2">
              Longitude: {position[1].toFixed(6)}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", mt: 1, display: "block" }}>
              Click on the map, drag the marker, or search to select a location
            </Typography>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleConfirm} variant="contained" color="primary">
          Select Location
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LocationPicker;
