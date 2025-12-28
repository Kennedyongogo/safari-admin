import React, { useState } from "react";
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
  Save,
  ArrowBack,
  CloudUpload,
  Image as ImageIcon,
  Close as CloseIcon,
  Article,
  Add,
  Collections,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
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


const DestinationCreate = () => {
  const navigate = useNavigate();
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
    wildlife_types: [],
    featured_species: [],
    key_highlights: [],
    attractions: [],
    category_tags: [],
    best_visit_months: [],
    is_active: true,
    sort_order: 0,
  });

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

  const handleCreate = async () => {
    try {
      setSaving(true);
      setError(null);

      const token = localStorage.getItem("token");

      // Prepare data payload
      const payload = {
        title: destinationForm.title,
        slug: destinationForm.slug || destinationForm.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        description: destinationForm.description,
        location: destinationForm.location,
        wildlife_types: destinationForm.wildlife_types,
        featured_species: destinationForm.featured_species,
        key_highlights: destinationForm.key_highlights,
        attractions: destinationForm.attractions,
        category_tags: destinationForm.category_tags,
        best_visit_months: destinationForm.best_visit_months,
        is_active: destinationForm.is_active,
        sort_order: destinationForm.sort_order,
      };

      // Add optional travel fields
      if (destinationForm.duration_min) payload.duration_min = parseInt(destinationForm.duration_min);
      if (destinationForm.duration_max) payload.duration_max = parseInt(destinationForm.duration_max);
      if (destinationForm.duration_display) payload.duration_display = destinationForm.duration_display;

      // Add array fields as JSON
      const formData = new FormData();

      // Add all payload fields to FormData
      Object.entries(payload).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach((v) => formData.append(key, v));
        } else {
          formData.append(key, value);
        }
      });

      // Add hero image if selected
      if (galleryFiles.length > 0) {
        formData.append("hero_image", galleryFiles[0]);
        // Add additional gallery images (skip first one as it's the hero)
        galleryFiles.slice(1).forEach((file) => formData.append("gallery_images", file));
      }

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
                            id={`attraction-gallery-${index}`}
                          />
                          <label htmlFor={`attraction-gallery-${index}`}>
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
                                      src={URL.createObjectURL(file)}
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
                  <Collections sx={{ mr: 1, verticalAlign: "middle" }} />
                  Images
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
                  First image will be used as the hero image, additional images will be in the gallery.
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
                            border: index === 0 ? "2px solid #6B4E3D" : "1px solid #e0e0e0",
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
                              backgroundColor: index === 0 ? "#6B4E3D" : "rgba(0, 0, 0, 0.7)",
                              color: "white",
                              padding: "2px 6px",
                              fontSize: "0.75rem",
                            }}
                          >
                            {index === 0 ? "HERO" : file.name.length > 15
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
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary" }}
                    >
                      No images selected. Click "Upload Images" to add a hero image and gallery images.
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
                    background:
                      "linear-gradient(135deg, #6B4E3D 0%, #B85C38 100%)",
                    color: "white",
                    "&:hover": {
                      background:
                        "linear-gradient(135deg, #8B4225 0%, #6B4E3D 100%)",
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
