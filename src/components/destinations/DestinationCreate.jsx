import React, { useState } from "react";
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
} from "@mui/material";
import {
  Save,
  ArrowBack,
  CloudUpload,
  Image as ImageIcon,
  Close as CloseIcon,
  Article,
  Collections,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import PackageManager from "./PackageManager";

const DestinationCreate = () => {
  const navigate = useNavigate();
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
  });

  const buildImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    if (path.startsWith("/")) return path;
    return `/${path}`;
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

  const handleCreate = async () => {
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
      formData.append("is_active", destinationForm.is_active.toString());
      formData.append("sort_order", destinationForm.sort_order.toString());

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

      // Add hero image if selected
      if (galleryFiles.length > 0) {
        formData.append("hero_image", galleryFiles[0]);
        // Add additional gallery images (skip first one as it's the hero)
        galleryFiles.slice(1).forEach((file) => {
          formData.append("gallery_images", file);
        });
      }

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

      const response = await fetch("/api/destinations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setGalleryFiles([]);
        await Swal.fire({
          title: "Success!",
          text: "Destination created successfully!",
          icon: "success",
          confirmButtonColor: "#6B4E3D",
        });
        navigate("/destinations");
      } else {
        throw new Error(result.message || "Failed to create destination");
      }
    } catch (err) {
      console.error("Error creating destination:", err);
      setError(err.message || "Failed to create destination");
      await Swal.fire({
        title: "Error!",
        text: err.message || "Failed to create destination",
        icon: "error",
        confirmButtonColor: "#6B4E3D",
      });
    } finally {
      setSaving(false);
    }
  };

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
        <Box
          sx={{
            background: "linear-gradient(135deg, #6B4E3D 0%, #B85C38 100%)",
            p: 3,
            color: "white",
            position: "relative",
            overflow: "hidden",
            borderRadius: 2,
            mb: 4,
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
          <Stack
            direction="row"
            alignItems="center"
            spacing={2}
            sx={{ position: "relative", zIndex: 1 }}
          >
            <IconButton
              onClick={() => navigate("/destinations")}
              sx={{
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                color: "white",
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.3)",
                },
              }}
            >
              <ArrowBack />
            </IconButton>
            <Article sx={{ fontSize: 40 }} />
            <Typography
              variant="h3"
              sx={{
                fontWeight: "bold",
                textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
              }}
            >
              Create Destination
            </Typography>
          </Stack>

          {error && (
            <Alert
              severity="error"
              sx={{ mt: 2, position: "relative", zIndex: 1 }}
            >
              {error}
            </Alert>
          )}
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
                required
              />
              <TextField
                fullWidth
                label="Subtitle (optional)"
                value={destinationForm.subtitle}
                onChange={(e) => handleInputChange("subtitle", e.target.value)}
                placeholder="e.g., THE PEARL OF AFRICA"
                helperText="Optional tagline or subtitle for the destination"
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
                required
                placeholder="Brief description of the destination/country"
              />
              <TextField
                fullWidth
                label="Location (e.g., East Africa)"
                value={destinationForm.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
                required
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

              {/* Destination Gallery Images */}
              <Box>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  <Collections sx={{ mr: 1, verticalAlign: "middle" }} />
                  Destination Images
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
                  First image will be used as the hero image, additional images
                  will be in the gallery.
                </Typography>
                <Box mb={2}>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleGallerySelect}
                    style={{ display: "none" }}
                    id="image-upload"
                  />
                  <label htmlFor="image-upload">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<CloudUpload />}
                      sx={{
                        color: "#667eea",
                        borderColor: "#667eea",
                        "&:hover": {
                          borderColor: "#667eea",
                          backgroundColor: "rgba(102, 126, 234, 0.1)",
                        },
                        mb: 2,
                      }}
                    >
                      Upload Images (Hero + Gallery)
                    </Button>
                  </label>
                </Box>

                {galleryFiles.length > 0 ? (
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{ mb: 2, color: "text.secondary" }}
                    >
                      {galleryFiles.length} image
                      {galleryFiles.length !== 1 ? "s" : ""} selected
                      {galleryFiles.length > 0 && " (first = hero image)"}
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                      {galleryFiles.map((file, index) => (
                        <Box
                          key={index}
                          sx={{
                            position: "relative",
                            width: 120,
                            height: 120,
                            borderRadius: 2,
                            overflow: "hidden",
                            border:
                              index === 0
                                ? "2px solid #6B4E3D"
                                : "1px solid #e0e0e0",
                          }}
                        >
                          <IconButton
                            onClick={() => removeGalleryFile(index)}
                            sx={{
                              position: "absolute",
                              top: 4,
                              right: 4,
                              backgroundColor: "rgba(0, 0, 0, 0.5)",
                              color: "white",
                              "&:hover": {
                                backgroundColor: "rgba(0, 0, 0, 0.7)",
                              },
                              zIndex: 2,
                              width: 24,
                              height: 24,
                            }}
                            size="small"
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Image ${index + 1}`}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                          <Box
                            sx={{
                              position: "absolute",
                              bottom: 0,
                              left: 0,
                              right: 0,
                              backgroundColor:
                                index === 0
                                  ? "#6B4E3D"
                                  : "rgba(0, 0, 0, 0.7)",
                              color: "white",
                              padding: "2px 6px",
                              fontSize: "0.75rem",
                            }}
                          >
                            {index === 0
                              ? "HERO"
                              : file.name.length > 15
                              ? `${file.name.substring(0, 12)}...`
                              : file.name}
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      border: "2px dashed #ccc",
                      borderRadius: 2,
                      p: 3,
                      textAlign: "center",
                      bgcolor: "#f9f9f9",
                    }}
                  >
                    <ImageIcon sx={{ fontSize: 48, opacity: 0.3, mb: 1 }} />
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      No images selected. Click "Upload Images" to add a hero
                      image and gallery images.
                    </Typography>
                  </Box>
                )}
              </Box>

              <Box display="flex" gap={2}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={saving ? <CircularProgress size={20} /> : <Save />}
                  onClick={handleCreate}
                  disabled={!isFormValid() || saving}
                  sx={{
                    flex: 1,
                    background: "linear-gradient(135deg, #6B4E3D 0%, #B85C38 100%)",
                    color: "white",
                    "&:hover": {
                      background: "linear-gradient(135deg, #8B4225 0%, #6B4E3D 100%)",
                    },
                    "&:disabled": {
                      background: "#e0e0e0",
                      color: "#999",
                    },
                  }}
                >
                  {saving ? "Creating..." : "Create Destination"}
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate("/destinations")}
                  sx={{
                    flex: 1,
                    color: "#6B4E3D",
                    borderColor: "#6B4E3D",
                    "&:hover": {
                      borderColor: "#B85C38",
                      backgroundColor: "rgba(107, 78, 61, 0.1)",
                    },
                  }}
                >
                  Cancel
                </Button>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default DestinationCreate;
