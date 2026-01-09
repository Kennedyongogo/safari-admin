import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Stack,
  CircularProgress,
  Alert,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
} from "@mui/material";
import {
  ArrowBack,
  Save,
  CloudUpload,
  Close as CloseIcon,
  Article,
  Image as ImageIcon,
} from "@mui/icons-material";
import Swal from "sweetalert2";
import PackageManager from "./PackageManager";

const DestinationEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [galleryFiles, setGalleryFiles] = useState([]);

  const [destinationForm, setDestinationForm] = useState({
    title: "",
    subtitle: "",
    slug: "",
    brief_description: "",
    location: "",
    packages: [],
    is_active: true,
    sort_order: 0,
    hero_image: "",
    gallery_images: [],
  });

  const buildImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    if (path.startsWith("/")) return path;
    return `/${path}`;
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
      if (!res.ok || !data.success)
        throw new Error(data.message || "Failed to load destination");

      const d = data.data;
      setDestinationForm({
        title: d.title || "",
        subtitle: d.subtitle || "",
        slug: d.slug || "",
        brief_description: d.brief_description || "",
        location: d.location || "",
        packages: Array.isArray(d.packages) ? d.packages : [],
        is_active: d.is_active ?? true,
        sort_order: d.sort_order || 0,
        hero_image: d.hero_image || "",
        gallery_images: Array.isArray(d.gallery_images) ? d.gallery_images : [],
      });
    } catch (err) {
      setError(err.message || "Failed to load destination");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setDestinationForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleGallerySelect = (event) => {
    const files = Array.from(event.target.files || []);
    const valid = files.filter(
      (file) => file.type.startsWith("image/") && file.size <= 10 * 1024 * 1024
    );
    setGalleryFiles((prev) => [...prev, ...valid]);
    event.target.value = "";
  };

  const removeGalleryFile = (index) => {
    setGalleryFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const isFormValid = () =>
    destinationForm.title.trim() &&
    destinationForm.brief_description.trim() &&
    destinationForm.location.trim();

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      const token = localStorage.getItem("token");

      const formData = new FormData();

      // Add basic fields
      formData.append("title", destinationForm.title);
      formData.append("subtitle", destinationForm.subtitle || "");
      formData.append(
        "slug",
        destinationForm.slug ||
          destinationForm.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "")
      );
      formData.append("brief_description", destinationForm.brief_description);
      formData.append("location", destinationForm.location);

      // Add hero image (empty string if deleted, or existing path)
      formData.append("hero_image", destinationForm.hero_image || "");

      // Process packages - separate File objects from data
      const packagesForJson = destinationForm.packages.map((category, catIndex) => ({
        category_name: category.category_name,
        category_order: category.category_order || catIndex + 1,
        packages: category.packages.map((pkg, pkgIndex) => ({
          number: pkg.number || pkgIndex + 1,
          title: pkg.title,
          short_description: pkg.short_description,
          highlights: pkg.highlights || [],
          pricing_tiers: pkg.pricing_tiers || [],
          // Keep only string URLs (existing images), File objects will be uploaded separately
          gallery: (pkg.gallery || []).filter((img) => typeof img === "string"),
        })),
      }));

      formData.append("packages", JSON.stringify(packagesForJson));

      // Add settings
      formData.append("is_active", destinationForm.is_active.toString());
      formData.append("sort_order", destinationForm.sort_order.toString());

      // Add existing gallery images
      formData.append("gallery_images", JSON.stringify(destinationForm.gallery_images));

      // Add new gallery files
      galleryFiles.forEach((file) => formData.append("gallery_images", file));

      // Add package gallery images with proper field names
      destinationForm.packages.forEach((category, catIndex) => {
        category.packages.forEach((pkg, pkgIndex) => {
          const newGalleryImages = (pkg.gallery || []).filter(
            (img) => img instanceof File
          );
          newGalleryImages.forEach((file) => {
            formData.append(`package_gallery_${catIndex}_${pkgIndex}`, file);
          });
        });
      });

      // Add hero image file if new one is uploaded
      if (galleryFiles.length > 0) {
        formData.append("hero_image", galleryFiles[0]);
      }

      const res = await fetch(`/api/destinations/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.message || "Failed to update destination");

      await Swal.fire({
        icon: "success",
        title: "Updated",
        text: "Destination updated successfully",
        timer: 1500,
        showConfirmButton: false,
      });

      navigate("/destinations");
    } catch (err) {
      setError(err.message || "Failed to update destination");
      Swal.fire("Error", err.message || "Failed to update destination", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="60vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
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
            mb: 4,
          }}
        >
          <Box
            display="flex"
            alignItems="center"
            gap={2}
            position="relative"
            zIndex={1}
          >
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
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  textShadow: "0 2px 4px rgba(0,0,0,0.3)",
                }}
              >
                Edit Destination
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                {destinationForm.title}
              </Typography>
            </Box>
            <Box ml="auto" display="flex" gap={1}>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleSave}
                disabled={!isFormValid() || saving}
                sx={{
                  background: "linear-gradient(135deg, #6B4E3D 0%, #B85C38 100%)",
                  color: "white",
                  "&:hover": {
                    background: "linear-gradient(135deg, #8B4225 0%, #6B4E3D 100%)",
                  },
                  "&:disabled": { backgroundColor: "rgba(255,255,255,0.15)" },
                }}
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            </Box>
          </Box>
        </Box>

        <Card
          sx={{
            backgroundColor: "white",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
            border: "1px solid #e0e0e0",
          }}
        >
          <CardContent>
            <Stack spacing={3}>
              <TextField
                fullWidth
                label="Title"
                value={destinationForm.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
              />
              <TextField
                fullWidth
                label="Subtitle (optional)"
                value={destinationForm.subtitle}
                onChange={(e) => handleInputChange("subtitle", e.target.value)}
                placeholder="e.g., THE PEARL OF AFRICA"
              />
              <TextField
                fullWidth
                label="Slug (optional - auto-generated from title)"
                value={destinationForm.slug}
                onChange={(e) => handleInputChange("slug", e.target.value)}
                helperText="Leave empty to auto-generate from title"
              />
              <TextField
                fullWidth
                label="Brief Description"
                multiline
                rows={4}
                value={destinationForm.brief_description}
                onChange={(e) =>
                  handleInputChange("brief_description", e.target.value)
                }
              />
              <TextField
                fullWidth
                label="Location (e.g., East Africa)"
                value={destinationForm.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
              />

              {/* Packages Section */}
              <Box>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                  Packages
                </Typography>
                <PackageManager
                  packages={destinationForm.packages}
                  onChange={(packages) => handleInputChange("packages", packages)}
                  buildImageUrl={buildImageUrl}
                />
              </Box>

              {/* Administrative Fields */}
              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Settings
                </Typography>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={destinationForm.is_active}
                    onChange={(e) =>
                      handleInputChange("is_active", e.target.value === "true")
                    }
                    label="Status"
                  >
                    <MenuItem value={true}>Active</MenuItem>
                    <MenuItem value={false}>Inactive</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  fullWidth
                  label="Sort Order"
                  type="number"
                  value={destinationForm.sort_order}
                  onChange={(e) =>
                    handleInputChange("sort_order", parseInt(e.target.value) || 0)
                  }
                  helperText="Lower numbers appear first"
                  sx={{ mb: 2 }}
                />
              </Box>

              {/* Images Section */}
              <Box>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Images
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
                  First image will be used as the hero image, additional images
                  will be in the gallery.
                </Typography>

                {/* Existing Hero Image */}
                {destinationForm.hero_image && (
                  <Box mb={3}>
                    <Typography
                      variant="subtitle2"
                      sx={{ mb: 1, color: "text.secondary" }}
                    >
                      Current Hero Image
                    </Typography>
                    <Box
                      sx={{
                        position: "relative",
                        border: "2px solid #6B4E3D",
                        borderRadius: 2,
                        overflow: "hidden",
                        display: "inline-block",
                        "&:hover .remove-btn": {
                          opacity: 1,
                        },
                      }}
                    >
                      <Box
                        component="img"
                        src={buildImageUrl(destinationForm.hero_image)}
                        alt="Hero image"
                        sx={{
                          width: 200,
                          height: 150,
                          objectFit: "cover",
                        }}
                      />
                      <Box
                        sx={{
                          position: "absolute",
                          bottom: 0,
                          left: 0,
                          right: 0,
                          background: "#6B4E3D",
                          color: "white",
                          padding: "2px 6px",
                          fontSize: "0.75rem",
                          textAlign: "center",
                        }}
                      >
                        HERO IMAGE
                      </Box>
                      <Box
                        className="remove-btn"
                        sx={{
                          position: "absolute",
                          top: 4,
                          right: 4,
                          opacity: 0,
                          transition: "opacity 0.2s",
                        }}
                      >
                        <IconButton
                          size="small"
                          onClick={() => handleInputChange("hero_image", "")}
                          sx={{
                            backgroundColor: "rgba(255, 255, 255, 0.9)",
                            "&:hover": {
                              backgroundColor: "rgba(255, 255, 255, 1)",
                            },
                          }}
                        >
                          <CloseIcon fontSize="small" color="error" />
                        </IconButton>
                      </Box>
                    </Box>
                  </Box>
                )}

                {/* Existing Gallery Images */}
                {Array.isArray(destinationForm.gallery_images) &&
                  destinationForm.gallery_images.length > 0 && (
                    <Box mb={3}>
                      <Typography
                        variant="subtitle2"
                        sx={{ mb: 1, color: "text.secondary" }}
                      >
                        Existing Gallery Images ({destinationForm.gallery_images.length})
                      </Typography>
                      <Grid container spacing={2}>
                        {destinationForm.gallery_images.map((image, idx) => (
                          <Grid item xs={12} sm={6} md={4} key={`existing-${idx}`}>
                            <Box
                              sx={{
                                position: "relative",
                                border: "1px solid #e0e0e0",
                                borderRadius: 2,
                                overflow: "hidden",
                                "&:hover .remove-btn": {
                                  opacity: 1,
                                },
                              }}
                            >
                              <Box
                                component="img"
                                src={buildImageUrl(image)}
                                alt={`Gallery ${idx + 1}`}
                                sx={{
                                  width: "100%",
                                  height: 150,
                                  objectFit: "cover",
                                }}
                              />
                              <Box
                                className="remove-btn"
                                sx={{
                                  position: "absolute",
                                  top: 4,
                                  right: 4,
                                  opacity: 0,
                                  transition: "opacity 0.2s",
                                }}
                              >
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    const updatedImages =
                                      destinationForm.gallery_images.filter(
                                        (_, i) => i !== idx
                                      );
                                    handleInputChange("gallery_images", updatedImages);
                                  }}
                                  sx={{
                                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                                    "&:hover": {
                                      backgroundColor: "rgba(255, 255, 255, 1)",
                                    },
                                  }}
                                >
                                  <CloseIcon fontSize="small" color="error" />
                                </IconButton>
                              </Box>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )}

                {/* Upload New Images */}
                <Box mb={2}>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleGallerySelect}
                    style={{ display: "none" }}
                    id="destination-images-upload"
                  />
                  <label htmlFor="destination-images-upload">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<CloudUpload />}
                      sx={{
                        color: "#6B4E3D",
                        borderColor: "#6B4E3D",
                        "&:hover": {
                          borderColor: "#B85C38",
                          backgroundColor: "rgba(184, 92, 56, 0.1)",
                        },
                        mb: 2,
                      }}
                    >
                      Upload Images (Hero + Gallery)
                    </Button>
                  </label>
                </Box>

                {/* New Files Preview */}
                {galleryFiles.length > 0 && (
                  <Box>
                    <Typography
                      variant="subtitle2"
                      sx={{ mb: 1, color: "text.secondary" }}
                    >
                      New Images to Upload ({galleryFiles.length})
                      {galleryFiles.length > 0 && " (first = hero image)"}
                    </Typography>
                    <Grid container spacing={2}>
                      {galleryFiles.map((file, idx) => (
                        <Grid item xs={12} sm={6} md={4} key={`new-${idx}`}>
                          <Box
                            sx={{
                              position: "relative",
                              border:
                                idx === 0
                                  ? "2px solid #6B4E3D"
                                  : "1px solid #e0e0e0",
                              borderRadius: 2,
                              overflow: "hidden",
                              "&:hover .remove-btn": {
                                opacity: 1,
                              },
                            }}
                          >
                            <Box
                              component="img"
                              src={URL.createObjectURL(file)}
                              alt={`New upload ${idx + 1}`}
                              sx={{
                                width: "100%",
                                height: 150,
                                objectFit: "cover",
                              }}
                            />
                            <Box
                              sx={{
                                position: "absolute",
                                bottom: 0,
                                left: 0,
                                right: 0,
                                background:
                                  idx === 0
                                    ? "#6B4E3D"
                                    : "linear-gradient(to top, rgba(0,0,0,0.7), transparent)",
                                p: 1,
                              }}
                            >
                              <Typography
                                variant="caption"
                                sx={{
                                  color: "white",
                                  fontWeight: 500,
                                  display: "block",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {idx === 0 ? "HERO IMAGE" : file.name}
                              </Typography>
                            </Box>
                            <Box
                              className="remove-btn"
                              sx={{
                                position: "absolute",
                                top: 4,
                                right: 4,
                                opacity: 0,
                                transition: "opacity 0.2s",
                              }}
                            >
                              <IconButton
                                size="small"
                                onClick={() => removeGalleryFile(idx)}
                                sx={{
                                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                                  "&:hover": {
                                    backgroundColor: "rgba(255, 255, 255, 1)",
                                  },
                                }}
                              >
                                <CloseIcon fontSize="small" color="error" />
                              </IconButton>
                            </Box>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default DestinationEdit;
