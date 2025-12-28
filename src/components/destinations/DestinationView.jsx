import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
} from "@mui/material";
import {
  ArrowBack,
  Edit,
  Article,
} from "@mui/icons-material";

const DestinationView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [destination, setDestination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const buildImageUrl = (path) => {
    if (!path) return null;
    const normalized = path.replace(/\\/g, "/");
    if (normalized.startsWith("http")) return normalized;
    if (normalized.startsWith("/")) return normalized;
    return `/${normalized}`;
  };

  useEffect(() => {
    fetchDestination();
  }, [id]);

  const fetchDestination = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/destinations/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to load destination");

      const normalized = {
        ...data.data,
        wildlife_types: Array.isArray(data.data?.wildlife_types) ? data.data.wildlife_types : [],
        featured_species: Array.isArray(data.data?.featured_species) ? data.data.featured_species : [],
        key_highlights: Array.isArray(data.data?.key_highlights) ? data.data.key_highlights : [],
        category_tags: Array.isArray(data.data?.category_tags) ? data.data.category_tags : [],
        best_visit_months: Array.isArray(data.data?.best_visit_months) ? data.data.best_visit_months : [],
        gallery_images: Array.isArray(data.data?.gallery_images) ? data.data.gallery_images : [],
      };

      setDestination(normalized);
    } catch (err) {
      setError(err.message || "Failed to load destination");
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !destination) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || "Destination not found"}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate("/destinations")}
        >
          Back to Destinations
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
        p: { xs: 0.5, sm: 0.5, md: 0.5 },
      }}
    >
      <Container maxWidth="lg" sx={{ px: 0.5 }}>
        <Box
          sx={{
            background: "linear-gradient(135deg, #6B4E3D 0%, #B85C38 100%)",
            p: 3,
            color: "white",
            borderRadius: 2,
            position: "relative",
            overflow: "hidden",
            mb: 2,
          }}
        >
          <Box display="flex" alignItems="center" gap={2} position="relative" zIndex={1}>
            <IconButton
              onClick={() => navigate("/destinations")}
              sx={{
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                color: "white",
                "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.3)" },
              }}
            >
              <ArrowBack />
            </IconButton>
            <Article sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}>
                {destination.title}
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Destination details
              </Typography>
            </Box>
            <Box ml="auto" display="flex" gap={1}>
              <Button
                variant="contained"
                startIcon={<Edit />}
                onClick={() => navigate(`/destinations/${destination.id}/edit`)}
                sx={{
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  color: "white",
                  "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.3)" },
                }}
              >
                Edit
              </Button>
            </Box>
          </Box>
        </Box>

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
                Overview
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mb: 2 }}>
                <Chip label={`Location: ${destination.location || "—"}`} size="small" />
                <Chip label={`Slug: ${destination.slug || "—"}`} size="small" />
                {destination.duration_display && (
                  <Chip label={`Duration: ${destination.duration_display}`} size="small" />
                )}
                {Array.isArray(destination.best_visit_months) && destination.best_visit_months.length > 0 && (
                  <Chip label={`Best Months: ${destination.best_visit_months.join(", ")}`} size="small" />
                )}
                <Chip label={`Status: ${destination.is_active ? "Active" : "Inactive"}`} size="small" />
                <Chip label={`Sort Order: ${destination.sort_order || 0}`} size="small" />
                {Array.isArray(destination.category_tags) && destination.category_tags.length > 0 && (
                  <Chip label={`Categories: ${destination.category_tags.join(", ")}`} size="small" />
                )}
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Created
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {formatDate(lodge.createdAt)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Updated
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {formatDate(lodge.updatedAt)}
                  </Typography>
                </Grid>
              </Grid>


              <Divider sx={{ my: 2 }} />

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
                  Description
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
                  {lodge.description || "No description provided."}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {Array.isArray(destination.key_highlights) && destination.key_highlights.length > 0 && (
            <Card
              sx={{
                backgroundColor: "white",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
                border: "1px solid #e0e0e0",
                borderLeft: "6px solid #6B4E3D",
              }}
            >
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 800 }}>
                  Key Highlights
                </Typography>
                <Box component="ul" sx={{ pl: 2, m: 0 }}>
                  {destination.key_highlights.map((highlight, idx) => (
                    <Typography key={idx} component="li" variant="body2" sx={{ mb: 1 }}>
                      {highlight}
                    </Typography>
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}

          {Array.isArray(destination.attractions) && destination.attractions.length > 0 && (
            <Card
              sx={{
                backgroundColor: "white",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
                border: "1px solid #e0e0e0",
                borderLeft: "6px solid #6B4E3D",
              }}
            >
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 800 }}>
                  Tourist Attractions
                </Typography>
                <Grid container spacing={2}>
                  {destination.attractions.map((attraction, idx) => (
                    <Grid item xs={12} key={idx}>
                      <Card
                        sx={{
                          border: "1px solid #e0e0e0",
                          borderRadius: 2,
                        }}
                      >
                        <CardContent sx={{ p: 2 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                            {attraction.name}
                          </Typography>
                          <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
                            {attraction.description}
                          </Typography>
                          {Array.isArray(attraction.images) && attraction.images.length > 0 && (
                            <Box sx={{ mt: 2 }}>
                              <Typography variant="caption" sx={{ color: "text.secondary", mb: 1, display: "block" }}>
                                Images ({attraction.images.length})
                              </Typography>
                              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                                {attraction.images.slice(0, 3).map((image, imgIdx) => (
                                  <Box
                                    key={imgIdx}
                                    component="img"
                                    src={typeof image === 'string' ? buildImageUrl(image) : URL.createObjectURL(image)}
                                    alt={`${attraction.name} - Image ${imgIdx + 1}`}
                                    sx={{
                                      width: 80,
                                      height: 60,
                                      objectFit: "cover",
                                      borderRadius: 1,
                                      border: "1px solid #e0e0e0",
                                    }}
                                  />
                                ))}
                                {attraction.images.length > 3 && (
                                  <Box
                                    sx={{
                                      width: 80,
                                      height: 60,
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      backgroundColor: "#f5f5f5",
                                      borderRadius: 1,
                                      border: "1px solid #e0e0e0",
                                    }}
                                  >
                                    <Typography variant="caption" color="text.secondary">
                                      +{attraction.images.length - 3}
                                    </Typography>
                                  </Box>
                                )}
                              </Box>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          )}

          {Array.isArray(destination.wildlife_types) && destination.wildlife_types.length > 0 && (
            <Card
              sx={{
                backgroundColor: "white",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
                border: "1px solid #e0e0e0",
                borderLeft: "6px solid #B85C38",
              }}
            >
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 800 }}>
                  Wildlife Types
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {destination.wildlife_types.map((type, idx) => (
                    <Chip key={idx} label={type} size="small" />
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}

          {Array.isArray(destination.featured_species) && destination.featured_species.length > 0 && (
            <Card
              sx={{
                backgroundColor: "white",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
                border: "1px solid #e0e0e0",
                borderLeft: "6px solid #6B4E3D",
              }}
            >
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 800 }}>
                  Featured Species
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {destination.featured_species.map((species, idx) => (
                    <Chip key={idx} label={species} size="small" />
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}

          {Array.isArray(destination.category_tags) && destination.category_tags.length > 0 && (
            <Card
              sx={{
                backgroundColor: "white",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
                border: "1px solid #e0e0e0",
                borderLeft: "6px solid #B85C38",
              }}
            >
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 800 }}>
                  Categories
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {destination.category_tags.map((tag, idx) => (
                    <Chip key={idx} label={tag} size="small" />
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Hero Image */}
          {destination.hero_image && (
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
                  Hero Image
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
                  Main hero image for this destination
                </Typography>
                <Box
                  component="img"
                  src={buildImageUrl(destination.hero_image)}
                  alt="Hero image"
                  sx={{
                    width: "100%",
                    maxWidth: 400,
                    height: 250,
                    objectFit: "cover",
                    borderRadius: 2,
                    border: "2px solid #6B4E3D",
                    boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
                  }}
                />
              </CardContent>
            </Card>
          )}

          {/* Gallery Images */}
          {Array.isArray(destination.gallery_images) && destination.gallery_images.length > 0 && (
            <Card
              sx={{
                backgroundColor: "white",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
                border: "1px solid #e0e0e0",
                borderLeft: "6px solid #B85C38",
              }}
            >
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 800 }}>
                  Gallery Images
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
                  Additional gallery images for this destination ({destination.gallery_images.length} images)
                </Typography>
                <Grid container spacing={2}>
                  {destination.gallery_images.map((img, idx) => (
                    <Grid item xs={12} sm={6} md={4} key={idx}>
                      <Box
                        component="img"
                        src={buildImageUrl(img)}
                        alt={`Gallery ${idx + 1}`}
                        sx={{
                          width: "100%",
                          height: 200,
                          objectFit: "cover",
                          borderRadius: 2,
                          border: "1px solid #eee",
                          boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
                        }}
                      />
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          )}
        </Stack>
      </Container>
    </Box>
  );
};

export default DestinationView;
