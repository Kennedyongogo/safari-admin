import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Avatar,
  Grid,
  Button,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Stack,
  Divider,
  Tabs,
  Tab,
} from "@mui/material";
import {
  ArrowBack,
  Edit,
  CalendarToday,
  Star,
  Article,
  Visibility,
  ThumbUp,
  AccessTime,
  CheckCircle,
  RadioButtonUnchecked,
  Map as MapIcon,
} from "@mui/icons-material";

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const TourView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tab management
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const buildImageUrl = (path) => {
    if (!path) return null;
    const normalized = path.replace(/\\/g, "/");
    if (normalized.startsWith("http")) return normalized;
    if (normalized.startsWith("/")) return normalized;
    return `/${normalized}`;
  };

  useEffect(() => {
    fetchPackage();
  }, [id]);

  // Fetch route data when package loads
  useEffect(() => {
    if (blog?.routeStages) {
      const coordinates = getRouteCoordinates();
      if (coordinates.length > 1) {
        fetchRouteData(coordinates);
      }
    }
  }, [blog]);

  const fetchPackage = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/packages/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to load package");


      setBlog(data.data);
    } catch (err) {
      setError(err.message || "Failed to load package");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (value) => {
    if (!value) return "—";
    return new Date(value).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Helper functions for map view
  const getRouteCoordinates = () => {
    if (!blog.routeStages) return [];

    return blog.routeStages
      .sort((a, b) => a.stage - b.stage)
      .filter(stage => stage.latitude && stage.longitude)
      .map(stage => [parseFloat(stage.latitude), parseFloat(stage.longitude)]);
  };

  // State for routing data
  const [routeData, setRouteData] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);

  // Fetch actual road routes between points (OpenRouteService - free tier available)
  const fetchRouteData = async (points) => {
    if (points.length < 2) return null;

    setRouteLoading(true);
    try {
      // Convert points to OpenRouteService format
      const coordinates = points.map(point => [point[1], point[0]]); // [lng, lat]

      // Use OpenRouteService Directions API (free up to 2000 requests/day)
      const response = await fetch(
        `https://api.openrouteservice.org/v2/directions/driving-car/geojson`,
        {
          method: 'POST',
          headers: {
            'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
            'Authorization': '5b3ce3597851110001cf6248d5c6e4c6b8c4e6b8b8c4e6b8b8c4e6b', // Public demo key (replace with your own)
            'Content-Type': 'application/json; charset=utf-8'
          },
          body: JSON.stringify({
            coordinates: coordinates,
            format: 'geojson',
            instructions: false,
            geometry_simplify: true
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        setRouteData(data);
        return data;
      } else {
        return null;
      }
    } catch (error) {
      return null;
    } finally {
      setRouteLoading(false);
    }
  };

  // Create curved route segments between points (fallback when routing fails)
  const createCurvedRoute = (points) => {
    if (points.length < 2) return points;

    const curvedPoints = [];
    curvedPoints.push(points[0]); // Start point

    for (let i = 0; i < points.length - 1; i++) {
      const start = points[i];
      const end = points[i + 1];

      // Calculate control point for curve (midpoint with slight offset)
      const midLat = (start[0] + end[0]) / 2;
      const midLng = (start[1] + end[1]) / 2;

      // Add slight curve by offsetting the control point
      const latDiff = end[0] - start[0];
      const lngDiff = end[1] - start[1];
      const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);

      // Create curve points (simple bezier-like curve)
      const numPoints = Math.max(8, Math.min(25, Math.floor(distance * 150)));
      for (let j = 1; j < numPoints; j++) {
        const t = j / numPoints;
        // Enhanced bezier curve for more natural road-like paths
        const controlOffset = 0.15; // More pronounced curves
        const lat = (1 - t) * (1 - t) * start[0] + 2 * (1 - t) * t * (midLat + latDiff * controlOffset) + t * t * end[0];
        const lng = (1 - t) * (1 - t) * start[1] + 2 * (1 - t) * t * (midLng + lngDiff * controlOffset) + t * t * end[1];
        curvedPoints.push([lat, lng]);
      }
    }

    return curvedPoints;
  };

  const getMapCenter = () => {
    const coordinates = getRouteCoordinates();
    if (coordinates.length === 0) return [0, 0]; // Default center

    if (coordinates.length === 1) return coordinates[0];

    // Calculate center of all coordinates
    const lats = coordinates.map(coord => coord[0]);
    const lngs = coordinates.map(coord => coord[1]);

    const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
    const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;

    return [centerLat, centerLng];
  };

  const getMapZoom = () => {
    const coordinates = getRouteCoordinates();
    if (coordinates.length === 0) return 2;
    if (coordinates.length === 1) return 10;

    // Calculate appropriate zoom level based on coordinate spread
    const lats = coordinates.map(coord => coord[0]);
    const lngs = coordinates.map(coord => coord[1]);

    const latSpread = Math.max(...lats) - Math.min(...lats);
    const lngSpread = Math.max(...lngs) - Math.min(...lngs);
    const maxSpread = Math.max(latSpread, lngSpread);

    if (maxSpread < 0.1) return 12;
    if (maxSpread < 1) return 10;
    if (maxSpread < 5) return 8;
    return 6;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !blog) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || "Blog not found"}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate("/tours")}
        >
          Back to Blogs
        </Button>
      </Container>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, rgba(245, 241, 232, 0.95) 0%, rgba(255, 255, 255, 0.98) 50%, rgba(232, 224, 209, 0.95) 100%)",
        py: 4,
      }}
    >
      <Container maxWidth="lg">
        <Card
          sx={{
            backgroundColor: "white",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
            border: "1px solid #e0e0e0",
          }}
        >
          <CardContent sx={{ p: 0 }}>
            {/* Header Section */}
            <Box
              sx={{
                background: "linear-gradient(135deg, #6B4E3D 0%, #B85C38 100%)",
                p: 3,
                color: "white",
                position: "relative",
                overflow: "hidden",
                borderRadius: "8px 8px 0 0",
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  top: -50,
                  right: -50,
                  width: 200,
                  height: 200,
                  background: "rgba(255, 255, 255, 0.1)",
                  borderRadius: "50%",
                }}
              />
              <Box
                sx={{
                  position: "absolute",
                  bottom: -30,
                  left: -30,
                  width: 150,
                  height: 150,
                  background: "rgba(255, 255, 255, 0.05)",
                  borderRadius: "50%",
                }}
              />
              <Box display="flex" alignItems="center" gap={2} position="relative" zIndex={1} sx={{ minWidth: 0 }}>
                <IconButton
                  onClick={() => navigate("/tours")}
                  sx={{
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                    color: "white",
                    "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.3)" },
                    flexShrink: 0,
                    width: 36,
                    height: 36,
                  }}
                >
                  <ArrowBack sx={{ fontSize: 18 }} />
                </IconButton>
                <Article sx={{ fontSize: 28, flexShrink: 0 }} />
                <Box sx={{ flex: 1, minWidth: 0, mr: 2 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      textShadow: "0 2px 4px rgba(0,0,0,0.3)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: "100%",
                      fontSize: "1.25rem",
                      lineHeight: 1.2,
                    }}
                    title={blog.title} // Tooltip on hover for full title
                  >
                    {blog.title}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8, fontSize: "0.75rem", lineHeight: 1.2 }}>
                    Safari Package Details
                  </Typography>
                </Box>
                <Box display="flex" gap={1} sx={{ flexShrink: 0 }}>
                  <Button
                    variant="contained"
                    startIcon={<Edit />}
                    onClick={() => navigate(`/tours/${blog.id}/edit`)}
                    sx={{
                      backgroundColor: "rgba(255, 255, 255, 0.2)",
                      color: "white",
                      "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.3)" },
                      whiteSpace: "nowrap",
                      fontSize: "0.75rem",
                      py: 0.5,
                      px: 1.5,
                      minWidth: "auto",
                      height: 32,
                    }}
                  >
                    Edit
                  </Button>
                </Box>
              </Box>
            </Box>

            {/* Content Section */}
            <Box sx={{ p: 3 }}>
              {/* Tabs */}
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs
                  value={activeTab}
                  onChange={handleTabChange}
                  aria-label="tour view tabs"
                  sx={{
                    '& .MuiTab-root': {
                      minHeight: 48,
                      textTransform: 'none',
                      fontWeight: 600,
                    }
                  }}
                >
                  <Tab
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Article sx={{ fontSize: 18 }} />
                        Package Overview
                      </Box>
                    }
                  />
                  <Tab
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarToday sx={{ fontSize: 18 }} />
                        Itinerary Details
                        {blog?.routeStages?.length > 0 && (
                          <Chip
                            label={blog.routeStages.length}
                            size="small"
                            sx={{ height: 18, fontSize: '0.7rem', minWidth: 18 }}
                          />
                        )}
                      </Box>
                    }
                  />
                  <Tab
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MapIcon sx={{ fontSize: 18 }} />
                        Tour Map
                        {blog?.routeStages?.filter(stage => stage.latitude && stage.longitude).length > 0 && (
                          <Chip
                            label={blog.routeStages.filter(stage => stage.latitude && stage.longitude).length}
                            size="small"
                            sx={{ height: 18, fontSize: '0.7rem', minWidth: 18 }}
                          />
                        )}
                      </Box>
                    }
                  />
                </Tabs>
              </Box>

              {/* Tab Content */}
              {activeTab === 0 && (
                <Stack spacing={1.5}>
                  <Card
                    sx={{
                      backgroundColor: "white",
                      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
                      border: "1px solid #e0e0e0",
                      borderLeft: "6px solid #B85C38",
                    }}
                  >
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 800 }}>
                        Package Information
                      </Typography>
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mb: 2 }}>
                        <Chip
                          label={`Type: ${blog.type || "Standard"}`}
                          color="primary"
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                        <Chip
                          icon={<Star sx={{ color: "#B85C38" }} />}
                          label={`Rating: ${blog.rating || 0}/5.0`}
                          variant="outlined"
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                        <Chip
                          label={blog.isActive ? "Active" : "Inactive"}
                          color={blog.isActive ? "primary" : "error"}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                        <Chip label={`Stages: ${blog.routeStages?.length || 0}`} variant="outlined" size="small" />
                      </Box>

                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={4}>
                          <Typography variant="body2" sx={{ color: "text.secondary" }}>
                            Duration
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {blog.duration || "—"}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                          <Typography variant="body2" sx={{ color: "text.secondary" }}>
                            Price
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600, color: "#B85C38" }}>
                            {blog.price || "—"} {blog.pricePerPerson}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                          <Typography variant="body2" sx={{ color: "text.secondary" }}>
                            Group Size
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {blog.groupSize || "—"}
                          </Typography>
                        </Grid>
                      </Grid>

                      <Divider sx={{ my: 2 }} />

                      {/* Highlights */}
                      {blog.highlights && Array.isArray(blog.highlights) && blog.highlights.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                            Highlights
                          </Typography>
                          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                            {blog.highlights.map((highlight, index) => (
                              <Chip
                                key={index}
                                label={highlight}
                                size="small"
                                variant="outlined"
                                color="primary"
                              />
                            ))}
                          </Box>
                        </Box>
                      )}

                      {/* What's Included */}
                      {blog.included && Array.isArray(blog.included) && blog.included.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                            What's Included
                          </Typography>
                          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                            {blog.included.map((item, index) => (
                              <Chip
                                key={index}
                                label={item}
                                size="small"
                                variant="outlined"
                                sx={{
                                  color: "#6B4E3D",
                                  borderColor: "#d8c7b6",
                                }}
                              />
                            ))}
                          </Box>
                        </Box>
                      )}

                      <Typography variant="body2" sx={{ color: "text.secondary" }}>
                        Created: {formatDate(blog.createdAt)}
                      </Typography>
                      <Typography variant="body2" sx={{ color: "text.secondary" }}>
                        Last Updated: {formatDate(blog.updatedAt)}
                      </Typography>
                    </CardContent>
                  </Card>

                  <Card
                    sx={{
                      backgroundColor: "white",
                      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
                      border: "1px solid #e0e0e0",
                      borderLeft: "6px solid #6B4E3D",
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                        <Article sx={{ color: "#6B4E3D" }} />
                        <Typography variant="h6" sx={{ fontWeight: 800 }}>
                          Package Description
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          backgroundColor: "#faf6f2",
                          border: "1px dashed #e0d6c8",
                        }}
                      >
                        <Typography variant="body1" sx={{ color: "text.secondary", whiteSpace: "pre-wrap" }}>
                          {blog.description || "No description provided."}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>

                  <Card
                    sx={{
                      backgroundColor: "white",
                      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
                      border: "1px solid #e0e0e0",
                      borderLeft: "6px solid #6B4E3D",
                    }}
                  >
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 800 }}>
                        Package Features
                      </Typography>

                      {/* Highlights */}
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: "#6B4E3D" }}>
                          Key Highlights
                        </Typography>
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                          {blog.highlights && Array.isArray(blog.highlights) && blog.highlights.length > 0 ? (
                            blog.highlights.map((highlight, idx) => (
                              <Chip
                                key={idx}
                                label={highlight}
                                size="small"
                                color="primary"
                                variant={idx % 2 === 0 ? "filled" : "outlined"}
                                sx={{
                                  fontWeight: 600,
                                  backgroundColor: idx % 2 === 0 ? "#f3e7dd" : "transparent",
                                  color: "#6B4E3D",
                                  borderColor: "#d8c7b6",
                                }}
                              />
                            ))
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              No highlights specified
                            </Typography>
                          )}
                        </Box>
                      </Box>

                      {/* What's Included */}
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: "#6B4E3D" }}>
                          What's Included
                        </Typography>
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                          {blog.included && Array.isArray(blog.included) && blog.included.length > 0 ? (
                            blog.included.map((item, idx) => (
                      <Chip
                        key={idx}
                        label={item}
                        size="small"
                        variant={idx % 2 === 0 ? "filled" : "outlined"}
                        sx={{
                          fontWeight: 600,
                          backgroundColor: idx % 2 === 0 ? "#f3e7dd" : "transparent",
                          color: "#6B4E3D",
                          borderColor: "#d8c7b6",
                        }}
                      />
                            ))
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              No inclusions specified
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>

                  {buildImageUrl(blog.image) && (
                    <Card
                      sx={{
                        backgroundColor: "white",
                        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
                        border: "1px solid #e0e0e0",
                        borderLeft: "6px solid #6B4E3D",
                      }}
                    >
                      <CardContent>
                        <Typography variant="h6" sx={{ mb: 1, fontWeight: 800 }}>
                          Package Image
                        </Typography>
                        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
                          Main hero image for the safari package
                        </Typography>
                        <Box
                          component="img"
                          src={buildImageUrl(blog.image)}
                          alt={blog.title}
                          sx={{
                            width: "100%",
                            maxHeight: 440,
                            objectFit: "cover",
                            borderRadius: 2.5,
                            border: "1px solid #eee",
                            boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
                          }}
                        />
                      </CardContent>
                    </Card>
                  )}
                </Stack>
              )}

              {/* Itinerary Details Tab */}
              {activeTab === 1 && (
                <Box>
                  <Typography variant="h6" sx={{ mb: 2, color: "#6B4E3D", fontWeight: 600 }}>
                    Safari Itinerary
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
                    Day-by-day breakdown of your safari package
                  </Typography>

                  {blog.routeStages && blog.routeStages.length > 0 ? (
                    <Stack spacing={2}>
                      {blog.routeStages
                        .sort((a, b) => a.stage - b.stage)
                        .map((stage) => (
                          <Box
                            key={stage.id}
                            sx={{
                              p: 2,
                              borderRadius: 2,
                              border: "1px solid #e0e0e0",
                              backgroundColor: "#faf9f7",
                            }}
                          >
                            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                              <Box
                                sx={{
                                  width: 50,
                                  height: 50,
                                  borderRadius: "50%",
                                  bgcolor: "#6B4E3D",
                                  color: "white",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontWeight: 700,
                                  fontSize: "1.2rem",
                                  flexShrink: 0,
                                }}
                              >
                                {stage.stage}
                              </Box>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: "#6B4E3D", mb: 1 }}>
                                  {stage.name}
                                </Typography>
                                <Typography variant="body1" sx={{ color: "text.primary", mb: 2 }}>
                                  {stage.description}
                                </Typography>

                                <Grid container spacing={2}>
                                  <Grid item xs={12} sm={6} md={3}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#6B4E3D" }}>
                                      Duration
                                    </Typography>
                                    <Typography variant="body2">{stage.duration}</Typography>
                                  </Grid>

                                  {stage.accommodation && (
                                    <Grid item xs={12} sm={6} md={3}>
                                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#6B4E3D" }}>
                                        Accommodation
                                      </Typography>
                                      <Typography variant="body2">{stage.accommodation}</Typography>
                                    </Grid>
                                  )}

                                  {stage.meals && (
                                    <Grid item xs={12} sm={6} md={3}>
                                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#6B4E3D" }}>
                                        Meals
                                      </Typography>
                                      <Typography variant="body2">{stage.meals}</Typography>
                                    </Grid>
                                  )}

                                  {stage.transportation && (
                                    <Grid item xs={12} sm={6} md={3}>
                                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#6B4E3D" }}>
                                        Transportation
                                      </Typography>
                                      <Typography variant="body2">{stage.transportation}</Typography>
                                    </Grid>
                                  )}
                                </Grid>

                                {stage.activities && Array.isArray(stage.activities) && stage.activities.length > 0 && (
                                  <Box sx={{ mt: 2 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#6B4E3D", mb: 1 }}>
                                      Activities
                                    </Typography>
                                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                                      {stage.activities.map((activity, idx) => (
                                        <Chip key={idx} label={activity} size="small" color="primary" variant="outlined" />
                                      ))}
                                    </Box>
                                  </Box>
                                )}

                                {stage.highlights && Array.isArray(stage.highlights) && stage.highlights.length > 0 && (
                                  <Box sx={{ mt: 2 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#6B4E3D", mb: 1 }}>
                                      Highlights
                                    </Typography>
                                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                                      {stage.highlights.map((highlight, idx) => (
                                        <Chip key={idx} label={highlight} size="small" variant="outlined" sx={{ color: "#6B4E3D", borderColor: "#d8c7b6" }} />
                                      ))}
                                    </Box>
                                  </Box>
                                )}

                                {stage.wildlife && Array.isArray(stage.wildlife) && stage.wildlife.length > 0 && (
                                  <Box sx={{ mt: 2 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#6B4E3D", mb: 1 }}>
                                      Wildlife to Spot
                                    </Typography>
                                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                                      {stage.wildlife.map((animal, idx) => (
                                        <Chip key={idx} label={animal} size="small" variant="outlined" sx={{ color: "#6B4E3D", borderColor: "#d8c7b6" }} />
                                      ))}
                                    </Box>
                                  </Box>
                                )}

                                {stage.images && Array.isArray(stage.images) && stage.images.length > 0 && (
                                  <Box sx={{ mt: 2 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#6B4E3D", mb: 1 }}>
                                      📸 Stage Gallery
                                    </Typography>
                                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                                      {stage.images.map((imageUrl, idx) => (
                                        <Box
                                          key={idx}
                                          sx={{
                                            width: 100,
                                            height: 100,
                                            borderRadius: 2,
                                            overflow: "hidden",
                                            border: "2px solid #e0e0e0",
                                            cursor: "pointer",
                                            transition: "transform 0.2s",
                                            "&:hover": {
                                              transform: "scale(1.05)",
                                              borderColor: "#B85C38",
                                            },
                                          }}
                                          onClick={() => {
                                            // Open image in new tab
                                            window.open(buildImageUrl(imageUrl), '_blank');
                                          }}
                                        >
                                          <Box
                                            component="img"
                                            src={buildImageUrl(imageUrl)}
                                            alt={`Stage ${stage.stage} image ${idx + 1}`}
                                            sx={{
                                              width: "100%",
                                              height: "100%",
                                              objectFit: "cover",
                                            }}
                                          />
                                        </Box>
                                      ))}
                                    </Box>
                                  </Box>
                                )}

                                {stage.tips && (
                                  <Box sx={{ mt: 2 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#6B4E3D", mb: 1 }}>
                                      Travel Tips
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontStyle: "italic" }}>
                                      {stage.tips}
                                    </Typography>
                                  </Box>
                                )}
                              </Box>
                            </Box>
                          </Box>
                        ))}
                    </Stack>
                  ) : (
                    <Box sx={{ textAlign: "center", py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        No itinerary stages have been added yet.
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}

              {/* Tour Map Tab */}
              {activeTab === 2 && (
                <Box>
                  <Typography variant="h6" sx={{ mb: 2, color: "#6B4E3D", fontWeight: 600 }}>
                    Tour Route Map
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
                    Interactive map showing all stages of your safari itinerary
                  </Typography>

                  {blog.routeStages && blog.routeStages.length > 0 ? (
                    <Card
                      sx={{
                        backgroundColor: "white",
                        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
                        border: "1px solid #e0e0e0",
                        overflow: "hidden",
                      }}
                    >
                      <Box sx={{ height: "500px", width: "100%" }}>
                        {typeof window !== "undefined" && (
                          <MapContainer
                            center={getMapCenter()}
                            zoom={getMapZoom()}
                            style={{ height: "100%", width: "100%" }}
                            scrollWheelZoom={true}
                          >
                            <TileLayer
                              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />

                            {/* Draw actual road route if available, otherwise curved route */}
                            {getRouteCoordinates().length > 1 && (
                              <>
                                {routeData && routeData.features && routeData.features[0] ? (
                                  // Use actual road routing data
                                  <Polyline
                                    positions={routeData.features[0].geometry.coordinates.map(coord => [coord[1], coord[0]])}
                                    color="#B85C38"
                                    weight={5}
                                    opacity={0.9}
                                    lineCap="round"
                                    lineJoin="round"
                                  />
                                ) : (
                                  // Fallback to enhanced curved route
                                  <Polyline
                                    positions={createCurvedRoute(getRouteCoordinates())}
                                    color="#B85C38"
                                    weight={4}
                                    opacity={0.8}
                                    dashArray="10, 10"
                                    lineCap="round"
                                    lineJoin="round"
                                  />
                                )}

                                {/* Draw straight reference line (always show for comparison) */}
                                <Polyline
                                  positions={getRouteCoordinates()}
                                  color="#666"
                                  weight={1}
                                  opacity={0.3}
                                  dashArray="3, 8"
                                />
                              </>
                            )}

                            {/* Route loading indicator */}
                            {routeLoading && (
                              <div style={{
                                position: 'absolute',
                                top: '10px',
                                right: '10px',
                                background: 'rgba(255,255,255,0.9)',
                                padding: '8px 12px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                zIndex: 1000,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                              }}>
                                Calculating route...
                              </div>
                            )}

                            {/* Add markers for each stage */}
                            {blog.routeStages
                              .sort((a, b) => a.stage - b.stage)
                              .map((stage, index) => {
                                if (stage.latitude && stage.longitude) {
                                  // Create custom icon with stage number
                                  const customIcon = L.divIcon({
                                    html: `<div style="
                                      background-color: #B85C38;
                                      color: white;
                                      border-radius: 50%;
                                      width: 30px;
                                      height: 30px;
                                      display: flex;
                                      align-items: center;
                                      justify-content: center;
                                      font-weight: bold;
                                      font-size: 14px;
                                      border: 3px solid white;
                                      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
                                    ">${stage.stage}</div>`,
                                    className: 'custom-stage-marker',
                                    iconSize: [30, 30],
                                    iconAnchor: [15, 15],
                                  });

                                  return (
                                    <Marker
                                      key={stage.id}
                                      position={[parseFloat(stage.latitude), parseFloat(stage.longitude)]}
                                      icon={customIcon}
                                      eventHandlers={{
                                        mouseover: (e) => {
                                          e.target.openPopup();
                                        },
                                        mouseout: (e) => {
                                          e.target.closePopup();
                                        },
                                      }}
                                    >
                                      <Popup closeButton={false} autoPan={false}>
                                        <Box sx={{ minWidth: 250, maxWidth: 350 }}>
                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                            <Box
                                              sx={{
                                                backgroundColor: "#B85C38",
                                                color: "white",
                                                borderRadius: "50%",
                                                width: 24,
                                                height: 24,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                fontWeight: "bold",
                                                fontSize: "12px",
                                              }}
                                            >
                                              {stage.stage}
                                            </Box>
                                            <Typography variant="h6" sx={{ fontWeight: 700, color: "#6B4E3D", m: 0 }}>
                                              {stage.name}
                                            </Typography>
                                          </Box>
                                          <Typography variant="body1" sx={{ mb: 2, fontSize: '0.9rem' }}>
                                            {stage.description}
                                          </Typography>
                                          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                                            <Typography variant="caption" sx={{ color: "text.secondary", display: 'block' }}>
                                              ⏱️ {stage.duration}
                                            </Typography>
                                            {stage.accommodation && (
                                              <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                                                🏨 {stage.accommodation}
                                              </Typography>
                                            )}
                                          </Box>
                                          {stage.activities && Array.isArray(stage.activities) && stage.activities.length > 0 && (
                                            <Box sx={{ mt: 1 }}>
                                              <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                                                🎯 Activities:
                                              </Typography>
                                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                                                {stage.activities.slice(0, 3).map((activity, idx) => (
                                                  <Chip
                                                    key={idx}
                                                    label={activity}
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{
                                                      height: 20,
                                                      fontSize: '0.7rem',
                                                      color: "#6B4E3D",
                                                      borderColor: "#d8c7b6"
                                                    }}
                                                  />
                                                ))}
                                                {stage.activities.length > 3 && (
                                                  <Typography variant="caption" sx={{ color: "text.secondary", alignSelf: 'center' }}>
                                                    +{stage.activities.length - 3} more
                                                  </Typography>
                                                )}
                                              </Box>
                                            </Box>
                                          )}
                                          <Typography variant="caption" sx={{ color: "text.secondary", mt: 1, display: 'block' }}>
                                            📍 {parseFloat(stage.latitude).toFixed(4)}, {parseFloat(stage.longitude).toFixed(4)}
                                          </Typography>
                                        </Box>
                                      </Popup>
                                    </Marker>
                                  );
                                }
                                return null;
                              })}
                          </MapContainer>
                        )}
                      </Box>
                    </Card>
                  ) : (
                    <Box sx={{ textAlign: "center", py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        No itinerary stages with location data available for map view.
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default TourView;
