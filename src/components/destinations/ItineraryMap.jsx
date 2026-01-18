import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap, Popup, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Box, Typography } from "@mui/material";

// Fix for default marker icon in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Custom marker icon with day number
const createDayMarker = (dayNumber) => {
  return L.divIcon({
    className: "custom-day-marker",
    html: `<div style="
      background-color: #6B4E3D;
      color: white;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 14px;
      border: 3px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    ">${dayNumber}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

// Component to fit map bounds
function MapBounds({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      try {
        const latLngBounds = L.latLngBounds(bounds);
        map.fitBounds(latLngBounds, { padding: [20, 20], maxZoom: 12 });
      } catch (error) {
        console.error("Error fitting bounds:", error);
      }
    }
  }, [bounds, map]);
  return null;
}

const ItineraryMap = ({ itinerary, height = 300 }) => {
  if (!itinerary || !Array.isArray(itinerary) || itinerary.length === 0) {
    return null;
  }

  // Extract all coordinates for bounds calculation and route drawing
  const allCoordinates = [];
  const routeSegments = [];
  const markers = [];

  itinerary.forEach((day, index) => {
    if (!day.start_location || !day.start_location.latitude || !day.start_location.longitude) {
      return; // Skip if no start location
    }

    const startCoord = [day.start_location.latitude, day.start_location.longitude];
    
    // Check if day has end location that's different from start
    const hasEndLocation =
      day.end_location &&
      day.end_location.latitude &&
      day.end_location.longitude &&
      (day.end_location.latitude !== day.start_location.latitude ||
        day.end_location.longitude !== day.start_location.longitude);

    const endCoord = hasEndLocation
      ? [day.end_location.latitude, day.end_location.longitude]
      : null;

    // Add coordinates to bounds
    allCoordinates.push(startCoord);
    if (hasEndLocation && endCoord) {
      allCoordinates.push(endCoord);
    }

    // Add marker at START location with day number
    markers.push({
      position: startCoord,
      day: day.day,
      description: day.description,
      isStart: true,
    });

    // Add marker at END location with same day number (if end exists and is different)
    if (hasEndLocation && endCoord) {
      markers.push({
        position: endCoord,
        day: day.day,
        description: day.description,
        isStart: false,
      });

      // Draw route within the day (from start to end)
      routeSegments.push({
        coordinates: [startCoord, endCoord],
        day: day.day,
        isDayRoute: true,
      });
    }

    // Connect consecutive days: current day's end (or start if no end) → next day's start
    if (index < itinerary.length - 1) {
      const nextDay = itinerary[index + 1];
      if (
        nextDay.start_location &&
        nextDay.start_location.latitude &&
        nextDay.start_location.longitude
      ) {
        const nextStartCoord = [
          nextDay.start_location.latitude,
          nextDay.start_location.longitude,
        ];
        
        // Use end location if exists, otherwise use start location
        const currentDayEnd = endCoord || startCoord;
        
        // Only draw connecting line if next day's start is different from current day's end/start
        if (
          nextStartCoord[0] !== currentDayEnd[0] ||
          nextStartCoord[1] !== currentDayEnd[1]
        ) {
          routeSegments.push({
            coordinates: [currentDayEnd, nextStartCoord],
            day: `Day ${day.day} to ${nextDay.day}`,
            isDayRoute: false,
          });
        }
      }
    }
  });

  // Default center if no coordinates
  const defaultCenter = [-1.2921, 36.8219]; // Nairobi
  const mapCenter =
    allCoordinates.length > 0
      ? allCoordinates[Math.floor(allCoordinates.length / 2)]
      : defaultCenter;

  return (
    <Box sx={{ width: "100%", height, borderRadius: 1, overflow: "hidden", border: "1px solid #e0e0e0" }}>
      <MapContainer
        center={mapCenter}
        zoom={6}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Draw route segments */}
        {routeSegments.map((segment, idx) => (
          <Polyline
            key={`route-${idx}`}
            positions={segment.coordinates}
            color="#6B4E3D"
            weight={3}
            opacity={0.7}
          />
        ))}

        {/* Add markers for each day */}
        {markers.map((marker, idx) => {
          const locationType = marker.isStart ? "Start" : "End";
          const tooltipText = `Day ${marker.day} (${locationType}): ${marker.description || "No description"}`;
          
          return (
            <Marker key={`marker-${idx}`} position={marker.position} icon={createDayMarker(marker.day)}>
              <Tooltip permanent={false} direction="top" offset={[0, -10]} interactive={false}>
                {tooltipText}
              </Tooltip>
              <Popup>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                    Day {marker.day} ({locationType})
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    {marker.description || "No description"}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary", mt: 0.5, display: "block" }}>
                    {marker.position[0].toFixed(6)}, {marker.position[1].toFixed(6)}
                  </Typography>
                </Box>
              </Popup>
            </Marker>
          );
        })}

        {/* Fit bounds to show all markers */}
        {allCoordinates.length > 0 && <MapBounds bounds={allCoordinates} />}
      </MapContainer>
    </Box>
  );
};

export default ItineraryMap;
