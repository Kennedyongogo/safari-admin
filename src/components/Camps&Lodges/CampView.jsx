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

const CampView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lodge, setLodge] = useState(null);
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
    fetchLodge();
  }, [id]);

  const fetchLodge = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/lodges/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to load lodge");

      const normalized = {
        ...data.data,
        images: Array.isArray(data.data?.images) ? data.data.images : [],
        campType: Array.isArray(data.data?.campType) ? data.data.campType : [],
        openMonths: Array.isArray(data.data?.openMonths) ? data.data.openMonths : [],
        whyYouLoveIt: Array.isArray(data.data?.whyYouLoveIt) ? data.data.whyYouLoveIt : [],
        highlights: Array.isArray(data.data?.highlights) ? data.data.highlights : [],
        dayAtCamp: Array.isArray(data.data?.dayAtCamp) ? data.data.dayAtCamp : [],
        essentials: Array.isArray(data.data?.essentials) ? data.data.essentials : [],
        amenities: Array.isArray(data.data?.amenities) ? data.data.amenities : [],
      };

      setLodge(normalized);
    } catch (err) {
      setError(err.message || "Failed to load lodge");
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

  if (error || !lodge) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || "Lodge not found"}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate("/camp-lodges")}
        >
          Back to Camps & Lodges
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
              onClick={() => navigate("/camp-lodges")}
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
                {lodge.name}
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Camp / Lodge details
              </Typography>
            </Box>
            <Box ml="auto" display="flex" gap={1}>
              <Button
                variant="contained"
                startIcon={<Edit />}
                onClick={() => navigate(`/camp-lodges/${lodge.id}/edit`)}
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
                <Chip label={`Destination: ${lodge.destination || "—"}`} size="small" />
                <Chip label={`Location: ${lodge.location || "—"}`} size="small" />
                <Chip label={`Latitude: ${lodge.latitude ?? "—"}`} size="small" />
                <Chip label={`Longitude: ${lodge.longitude ?? "—"}`} size="small" />
                {Array.isArray(lodge.campType) && lodge.campType.length > 0 && (
                  <Chip label={`Type: ${lodge.campType.join(", ")}`} size="small" />
                )}
                {Array.isArray(lodge.openMonths) && lodge.openMonths.length > 0 && (
                  <Chip label={`Open: ${lodge.openMonths.join(", ")}`} size="small" />
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

          {Array.isArray(lodge.highlights) && lodge.highlights.length > 0 && (
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
                  Highlights
                </Typography>
                <Box component="ul" sx={{ pl: 2, m: 0 }}>
                  {lodge.highlights.map((highlight, idx) => (
                    <Typography key={idx} component="li" variant="body2" sx={{ mb: 1 }}>
                      {highlight}
                    </Typography>
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}

          {Array.isArray(lodge.whyYouLoveIt) && lodge.whyYouLoveIt.length > 0 && (
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
                  Why You'll Love It
                </Typography>
                <Box component="ul" sx={{ pl: 2, m: 0 }}>
                  {lodge.whyYouLoveIt.map((reason, idx) => (
                    <Typography key={idx} component="li" variant="body2" sx={{ mb: 1 }}>
                      {reason}
                    </Typography>
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}

          {Array.isArray(lodge.dayAtCamp) && lodge.dayAtCamp.length > 0 && (
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
                  A Day at Camp
                </Typography>
                <Box component="ul" sx={{ pl: 2, m: 0 }}>
                  {lodge.dayAtCamp.map((activity, idx) => (
                    <Typography key={idx} component="li" variant="body2" sx={{ mb: 1 }}>
                      {activity}
                    </Typography>
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}

          {Array.isArray(lodge.essentials) && lodge.essentials.length > 0 && (
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
                  Essentials
                </Typography>
                <Box component="ul" sx={{ pl: 2, m: 0 }}>
                  {lodge.essentials.map((essential, idx) => (
                    <Typography key={idx} component="li" variant="body2" sx={{ mb: 1 }}>
                      {essential}
                    </Typography>
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}

          {Array.isArray(lodge.amenities) && lodge.amenities.length > 0 && (
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
                  Amenities
                </Typography>
                <Box component="ul" sx={{ pl: 2, m: 0 }}>
                  {lodge.amenities.map((amenity, idx) => (
                    <Typography key={idx} component="li" variant="body2" sx={{ mb: 1 }}>
                      {amenity}
                    </Typography>
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}

          {Array.isArray(lodge.images) && lodge.images.length > 0 && (
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
                  Gallery
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
                  Gallery images for this camp / lodge ({lodge.images.length} images)
                </Typography>
                <Grid container spacing={2}>
                  {lodge.images.map((img, idx) => (
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

export default CampView;
