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
  CalendarToday,
  Star,
  Article,
  Visibility,
  ThumbUp,
  AccessTime,
} from "@mui/icons-material";

const TourView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState(null);
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
    fetchPackage();
  }, [id]);

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
              onClick={() => navigate("/tours")}
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
                {blog.title}
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Safari Package Details
              </Typography>
            </Box>
            <Box ml="auto" display="flex" gap={1}>
              <Button
                variant="contained"
                startIcon={<Edit />}
                onClick={() => navigate(`/tours/${blog.id}/edit`)}
                sx={{
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  color: "white",
                  "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.3)" },
                }}
              >
                Edit Package
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
                  color={blog.isActive ? "success" : "error"}
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
                  <Typography variant="body1" sx={{ fontWeight: 600, color: "#27ae60" }}>
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
                        color="success"
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

          {/* Itinerary Section */}
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
                                    <Chip key={idx} label={highlight} size="small" color="success" variant="outlined" />
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
                                    <Chip key={idx} label={animal} size="small" color="success" variant="outlined" />
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
                        color="success"
                        variant={idx % 2 === 0 ? "filled" : "outlined"}
                        sx={{
                          fontWeight: 600,
                          backgroundColor: idx % 2 === 0 ? "#e8f5e9" : "transparent",
                          color: "#2e7d32",
                          borderColor: "#a5d6a7",
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
      </Container>
    </Box>
  );
};

export default TourView;
