import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
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
  OutlinedInput,
  Chip,
} from "@mui/material";
import {
  ArrowBack,
  Save,
  CloudUpload,
  Close as CloseIcon,
  Article,
  Image as ImageIcon,
  Add,
} from "@mui/icons-material";
import Swal from "sweetalert2";

// Reusable component for managing array fields with chips
const ChipArrayField = ({ label, value, onChange, placeholder }) => {
  const [inputValue, setInputValue] = useState("");

  const handleAddItem = () => {
    const trimmedValue = inputValue.trim();
    if (trimmedValue && !value.includes(trimmedValue)) {
      onChange([...value, trimmedValue]);
      setInputValue("");
    }
  };

  const handleRemoveItem = (itemToRemove) => {
    onChange(value.filter((item) => item !== itemToRemove));
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleAddItem();
    }
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 1 }}>
        {label}
      </Typography>
      <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          sx={{
            "& .MuiOutlinedInput-root": {
              backgroundColor: "transparent",
            },
          }}
        />
        <Button
          variant="contained"
          onClick={handleAddItem}
          disabled={!inputValue.trim() || value.includes(inputValue.trim())}
          sx={{
            background: "linear-gradient(135deg, #6B4E3D 0%, #B85C38 100%)",
            color: "white",
            minWidth: "auto",
            px: 2,
            "&:hover": {
              background: "linear-gradient(135deg, #8B4225 0%, #6B4E3D 100%)",
            },
            "&:disabled": {
              background: "#e0e0e0",
              color: "#999",
            },
          }}
        >
          <Add />
        </Button>
      </Box>
      {value.length > 0 && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {value.map((item, index) => (
            <Chip
              key={index}
              label={item}
              onDelete={() => handleRemoveItem(item)}
              sx={{
                backgroundColor: "#6B4E3D",
                color: "white",
                "& .MuiChip-deleteIcon": {
                  color: "rgba(255, 255, 255, 0.7)",
                  "&:hover": {
                    color: "white",
                  },
                },
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};


const DestinationEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [galleryFiles, setGalleryFiles] = useState([]);

  const [destinationForm, setDestinationForm] = useState({
    title: "",
    slug: "",
    description: "",
    location: "",
    duration_min: "",
    duration_max: "",
    duration_display: "",
    best_time: "",
    wildlife_types: [],
    featured_species: [],
    key_highlights: [],
    attractions: [],
    category_tags: [],
    best_visit_months: [],
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
        slug: d.slug || "",
        description: d.description || "",
        location: d.location || "",
        duration_min: d.duration_min || "",
        duration_max: d.duration_max || "",
        duration_display: d.duration_display || "",
        best_time: d.best_time || "",
        wildlife_types: Array.isArray(d.wildlife_types) ? d.wildlife_types : [],
        featured_species: Array.isArray(d.featured_species) ? d.featured_species : [],
        key_highlights: Array.isArray(d.key_highlights) ? d.key_highlights : [],
        attractions: Array.isArray(d.attractions) ? d.attractions : [],
        category_tags: Array.isArray(d.category_tags) ? d.category_tags : [],
        best_visit_months: Array.isArray(d.best_visit_months) ? d.best_visit_months : [],
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
    destinationForm.description.trim() &&
    destinationForm.location.trim();

  const parseList = (input) => {
    // Handle arrays directly (from ChipArrayField components)
    if (Array.isArray(input)) {
      return input.filter(Boolean);
    }
    // Handle strings (from text fields)
    if (typeof input === "string") {
      return input
        .split("\n")
        .map((t) => t.split(","))
        .flat()
        .map((t) => t.trim())
        .filter(Boolean);
    }
    // Handle other cases
    return [];
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      const token = localStorage.getItem("token");

      // Always use FormData for consistency
      const formData = new FormData();

      // Add basic fields
      formData.append("title", destinationForm.title);
      formData.append("slug", destinationForm.slug || destinationForm.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
      formData.append("description", destinationForm.description);
      formData.append("location", destinationForm.location);

      // Add hero image (empty string if deleted, or existing path)
      formData.append("hero_image", destinationForm.hero_image || "");

      // Add travel information
      if (destinationForm.duration_min) formData.append("duration_min", destinationForm.duration_min);
      if (destinationForm.duration_max) formData.append("duration_max", destinationForm.duration_max);
      if (destinationForm.duration_display) formData.append("duration_display", destinationForm.duration_display);
      // Handle attractions separately - preserve existing images and handle new uploads
      const attractionsForJson = destinationForm.attractions.map((attraction, index) => ({
        name: attraction.name,
        description: attraction.description,
        // Keep existing string images (from database) and filter out File objects (new uploads)
        images: (attraction.images || []).filter(img => typeof img === 'string'),
        // Add index to help backend map uploaded files to attractions
        index: index
      }));

      // Add array fields as JSON
      formData.append("wildlife_types", JSON.stringify(destinationForm.wildlife_types));
      formData.append("featured_species", JSON.stringify(destinationForm.featured_species));
      formData.append("key_highlights", JSON.stringify(destinationForm.key_highlights));
      formData.append("attractions", JSON.stringify(attractionsForJson));
      formData.append("category_tags", JSON.stringify(destinationForm.category_tags));
      formData.append("best_visit_months", JSON.stringify(destinationForm.best_visit_months));

      // Add settings
      formData.append("is_active", destinationForm.is_active.toString());
      formData.append("sort_order", destinationForm.sort_order.toString());

      // Add existing gallery images
      formData.append("gallery_images", JSON.stringify(destinationForm.gallery_images));

      // Add new gallery files
      galleryFiles.forEach((file) => formData.append("gallery_images", file));

      // Add attraction images with proper mapping - group by attraction index
      destinationForm.attractions.forEach((attraction, attractionIndex) => {
        const newImages = (attraction.images || []).filter(img => img instanceof File);
        newImages.forEach((file) => {
          formData.append(`attraction_images_${attractionIndex}`, file);
        });
      });

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

      // Navigate back to destinations list
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
                  background:
                    "linear-gradient(135deg, #6B4E3D 0%, #B85C38 100%)",
                  color: "white",
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, #8B4225 0%, #6B4E3D 100%)",
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
                label="Slug (optional - auto-generated from title)"
                value={destinationForm.slug}
                onChange={(e) => handleInputChange("slug", e.target.value)}
                helperText="Leave empty to auto-generate from title"
              />
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={4}
                value={destinationForm.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
              />
              <TextField
                fullWidth
                label="Location (e.g., East Africa)"
                value={destinationForm.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
              />

              {/* Travel Information */}
              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Travel Information
                </Typography>
                <TextField
                  fullWidth
                  label="Duration Min (days)"
                  type="number"
                  value={destinationForm.duration_min}
                  onChange={(e) => handleInputChange("duration_min", e.target.value)}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Duration Max (days)"
                  type="number"
                  value={destinationForm.duration_max}
                  onChange={(e) => handleInputChange("duration_max", e.target.value)}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Duration Display (e.g., '5-14 Days')"
                  value={destinationForm.duration_display}
                  onChange={(e) => handleInputChange("duration_display", e.target.value)}
                  sx={{ mb: 2 }}
                />
                <Box>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    Best Months to Visit
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
                    {[
                      "January", "February", "March", "April", "May", "June",
                      "July", "August", "September", "October", "November", "December"
                    ].map((month) => {
                      const isSelected = destinationForm.best_visit_months.includes(month);
                      return (
                        <Chip
                          key={month}
                          label={month}
                          onClick={() => {
                            const updatedMonths = isSelected
                              ? destinationForm.best_visit_months.filter(m => m !== month)
                              : [...destinationForm.best_visit_months, month];
                            handleInputChange("best_visit_months", updatedMonths);
                          }}
                          sx={{
                            backgroundColor: isSelected ? "#6B4E3D" : "#f5f5f5",
                            color: isSelected ? "white" : "text.primary",
                            "&:hover": {
                              backgroundColor: isSelected ? "#B85C38" : "#e0e0e0",
                            },
                            cursor: "pointer",
                          }}
                        />
                      );
                    })}
                  </Box>
                  {destinationForm.best_visit_months.length > 0 && (
                    <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
                      Selected: {destinationForm.best_visit_months.join(", ")}
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* Category Tags */}
              <ChipArrayField
                label="Category Tags"
                value={destinationForm.category_tags}
                onChange={(value) => handleInputChange("category_tags", value)}
                placeholder="Add a category tag (e.g., Wildlife Adventures)..."
              />

              {/* Wildlife Information */}
              <ChipArrayField
                label="Wildlife Types"
                value={destinationForm.wildlife_types}
                onChange={(value) => handleInputChange("wildlife_types", value)}
                placeholder="Add a wildlife type (e.g., Big Five)..."
              />

              <ChipArrayField
                label="Featured Species"
                value={destinationForm.featured_species}
                onChange={(value) => handleInputChange("featured_species", value)}
                placeholder="Add a featured species (e.g., Lion)..."
              />

              {/* Key Highlights */}
              <ChipArrayField
                label="Key Highlights"
                value={destinationForm.key_highlights}
                onChange={(value) => handleInputChange("key_highlights", value)}
                placeholder="Add a key highlight (e.g., Maasai Mara)..."
              />

              {/* Tourist Attractions */}
              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Tourist Attractions
                </Typography>
                {destinationForm.attractions.map((attraction, index) => (
                  <Card key={index} sx={{ mb: 3, p: 2 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        Attraction {index + 1}
                      </Typography>
                      <IconButton
                        onClick={() => {
                          const updatedAttractions = destinationForm.attractions.filter((_, i) => i !== index);
                          handleInputChange("attractions", updatedAttractions);
                        }}
                        color="error"
                        size="small"
                      >
                        <CloseIcon />
                      </IconButton>
                    </Box>
                    <TextField
                      fullWidth
                      label="Attraction Name"
                      value={attraction.name || ""}
                      onChange={(e) => {
                        const updatedAttractions = [...destinationForm.attractions];
                        updatedAttractions[index] = { ...updatedAttractions[index], name: e.target.value };
                        handleInputChange("attractions", updatedAttractions);
                      }}
                      placeholder="e.g., Maasai Mara National Reserve"
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      label="Short Description"
                      value={attraction.description || ""}
                      onChange={(e) => {
                        const updatedAttractions = [...destinationForm.attractions];
                        updatedAttractions[index] = { ...updatedAttractions[index], description: e.target.value };
                        handleInputChange("attractions", updatedAttractions);
                      }}
                      placeholder="Brief description of the attraction"
                      multiline
                      rows={2}
                      sx={{ mb: 2 }}
                    />
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                          Attraction Gallery Images
                        </Typography>
                        <Box sx={{ mb: 2 }}>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => {
                              const files = Array.from(e.target.files || []);
                              const valid = files.filter(
                                (file) => file.type.startsWith("image/") && file.size <= 10 * 1024 * 1024
                              );
                              const updatedAttractions = [...destinationForm.attractions];
                              const existingImages = updatedAttractions[index].images || [];
                              updatedAttractions[index] = {
                                ...updatedAttractions[index],
                                images: [...existingImages, ...valid]
                              };
                              handleInputChange("attractions", updatedAttractions);
                              e.target.value = "";
                            }}
                            style={{ display: "none" }}
                            id={`edit-attraction-gallery-${index}`}
                          />
                          <label htmlFor={`edit-attraction-gallery-${index}`}>
                            <Button
                              variant="outlined"
                              component="span"
                              startIcon={<CloudUpload />}
                              size="small"
                              sx={{
                                color: "#667eea",
                                borderColor: "#667eea",
                                "&:hover": {
                                  borderColor: "#667eea",
                                  backgroundColor: "rgba(102, 126, 234, 0.1)",
                                },
                                mb: 1,
                              }}
                            >
                              Upload Gallery Images
                            </Button>
                          </label>
                        </Box>

                        {/* Display selected images for this attraction */}
                        {attraction.images && attraction.images.length > 0 && (
                          <Box>
                            <Typography variant="caption" sx={{ color: "text.secondary", mb: 1, display: "block" }}>
                              {attraction.images.length} image{attraction.images.length !== 1 ? "s" : ""} selected
                            </Typography>
                            <Grid container spacing={1}>
                              {attraction.images.map((file, imgIndex) => (
                                <Grid item xs={6} sm={4} md={3} key={imgIndex}>
                                  <Box
                                    sx={{
                                      position: "relative",
                                      border: "1px solid #e0e0e0",
                                      borderRadius: 1,
                                      overflow: "hidden",
                                      "&:hover .remove-btn": {
                                        opacity: 1,
                                      },
                                    }}
                                  >
                                    <Box
                                      component="img"
                                      src={typeof file === 'string' ? buildImageUrl(file) : URL.createObjectURL(file)}
                                      alt={`Attraction ${index + 1} - Image ${imgIndex + 1}`}
                                      sx={{
                                        width: "100%",
                                        height: 80,
                                        objectFit: "cover",
                                      }}
                                    />
                                    <Box
                                      className="remove-btn"
                                      sx={{
                                        position: "absolute",
                                        top: 2,
                                        right: 2,
                                        opacity: 0,
                                        transition: "opacity 0.2s",
                                      }}
                                    >
                                      <IconButton
                                        size="small"
                                        onClick={() => {
                                          const updatedAttractions = [...destinationForm.attractions];
                                          const updatedImages = attraction.images.filter((_, i) => i !== imgIndex);
                                          updatedAttractions[index] = {
                                            ...updatedAttractions[index],
                                            images: updatedImages
                                          };
                                          handleInputChange("attractions", updatedAttractions);
                                        }}
                                        sx={{
                                          backgroundColor: "rgba(255, 255, 255, 0.9)",
                                          "&:hover": {
                                            backgroundColor: "rgba(255, 255, 255, 1)",
                                          },
                                          width: 20,
                                          height: 20,
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
                    </Grid>
                  </Card>
                ))}
                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={() => {
                    const newAttraction = { name: "", description: "", images: [] };
                    handleInputChange("attractions", [...destinationForm.attractions, newAttraction]);
                  }}
                  sx={{
                    color: "#6B4E3D",
                    borderColor: "#6B4E3D",
                    "&:hover": {
                      borderColor: "#B85C38",
                      backgroundColor: "rgba(184, 92, 56, 0.1)",
                    },
                  }}
                >
                  Add Tourist Attraction
                </Button>
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
                    onChange={(e) => handleInputChange("is_active", e.target.value === 'true')}
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
                  onChange={(e) => handleInputChange("sort_order", e.target.value)}
                  helperText="Lower numbers appear first"
                  sx={{ mb: 2 }}
                />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Images
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
                  First image will be used as the hero image, additional images will be in the gallery.
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
                          <Grid
                            item
                            xs={12}
                            sm={6}
                            md={4}
                            key={`existing-${idx}`}
                          >
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
                              border: idx === 0 ? "2px solid #6B4E3D" : "1px solid #e0e0e0",
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
                                  idx === 0 ? "#6B4E3D" : "linear-gradient(to top, rgba(0,0,0,0.7), transparent)",
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
                              {idx > 0 && (
                                <Typography
                                  variant="caption"
                                  sx={{ color: "rgba(255,255,255,0.8)" }}
                                >
                                  {(file.size / 1024 / 1024).toFixed(2)} MB
                                </Typography>
                              )}
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
