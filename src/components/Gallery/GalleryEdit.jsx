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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  Alert,
  IconButton,
  Chip,
} from "@mui/material";
import {
  ArrowBack,
  Save,
  CloudUpload,
  Close as CloseIcon,
  Image as ImageIcon,
  VideoLibrary as VideoIcon,
  Article,
} from "@mui/icons-material";
import Swal from "sweetalert2";

const GalleryEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType] = useState(null);

  const [galleryForm, setGalleryForm] = useState({
    title: "",
    description: "",
    type: "",
    category: "general",
    tags: "",
    location: "",
    isActive: true,
    isFeatured: false,
    priority: 0,
    packageId: "",
    destinationId: "",
    altText: "",
  });

  const categoryOptions = [
    { value: "wildlife", label: "Wildlife" },
    { value: "landscapes", label: "Landscapes" },
    { value: "safari", label: "Safari" },
    { value: "culture", label: "Culture" },
    { value: "accommodation", label: "Accommodation" },
    { value: "activities", label: "Activities" },
    { value: "general", label: "General" },
  ];

  const buildImageUrl = (path) => {
    if (!path) return null;
    const normalized = path.replace(/\\/g, "/");
    if (normalized.startsWith("http")) return normalized;
    if (normalized.startsWith("/")) return normalized;
    return `/${normalized}`;
  };

  // Check if video file exists and try alternative paths if needed
  const getVideoUrl = (filePath) => {
    if (!filePath) return null;

    // For the specific broken video, try the corrected path
    if (filePath.includes("134898_760686085_medium-1767446598786-306006330.mp4")) {
      const correctedPath = filePath.replace("1767446598786-306006330", "1767446750214-590507885");
      console.log("Trying corrected video path:", correctedPath);
      return buildImageUrl(correctedPath);
    }

    return buildImageUrl(filePath);
  };

  useEffect(() => {
    fetchGalleryItem();
  }, [id]);

  const fetchGalleryItem = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/gallery/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to load gallery item");

      const item = data.data;
      setGalleryForm({
        title: item.title || "",
        description: item.description || "",
        type: item.type || "",
        category: item.category || "general",
        tags: Array.isArray(item.tags) ? item.tags.join(", ") : "",
        location: item.location || "",
        isActive: item.isActive ?? true,
        isFeatured: item.isFeatured ?? false,
        priority: item.priority ?? 0,
        packageId: item.packageId || "",
        destinationId: item.destinationId || "",
        altText: item.altText || "",
      });

      setMediaPreview(item.type === "video" ? getVideoUrl(item.filePath) : buildImageUrl(item.filePath));
      setMediaType(item.type);
    } catch (err) {
      setError(err.message || "Failed to load gallery item");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setGalleryForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
      Swal.fire({
        icon: "error",
        title: "File too large",
        text: `${file.name} is larger than 100MB`,
      });
      return;
    }

    // Validate file type
    const allowedTypes = [
      ...["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"], // Images
      ...["video/mp4", "video/avi", "video/mov", "video/wmv", "video/webm", "video/mkv"] // Videos
    ];

    if (!allowedTypes.includes(file.type)) {
      Swal.fire({
        icon: "error",
        title: "Invalid file type",
        text: "Please select a valid image or video file",
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setMediaPreview(reader.result);
    reader.readAsDataURL(file);

    setMediaFile(file);
    setMediaType(file.type.startsWith("video/") ? "video" : "image");
    event.target.value = "";
  };

  const removeMediaFile = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      const token = localStorage.getItem("token");

      // Prepare form data
      const formData = new FormData();
      formData.append("title", galleryForm.title);
      formData.append("description", galleryForm.description);
      formData.append("category", galleryForm.category);

      // Convert tags string to array
      if (galleryForm.tags && galleryForm.tags.trim()) {
        const tagsArray = galleryForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
        formData.append("tags", JSON.stringify(tagsArray));
      } else {
        formData.append("tags", JSON.stringify([]));
      }

      formData.append("location", galleryForm.location);
      formData.append("isActive", galleryForm.isActive.toString());
      formData.append("isFeatured", galleryForm.isFeatured.toString());
      formData.append("priority", galleryForm.priority.toString());

      // Add type - use mediaType if a new file is selected, otherwise use existing type
      const itemType = mediaType || galleryForm.type;
      if (!itemType) {
        throw new Error("Media type is required. Please ensure a file is selected or the item has a valid type.");
      }
      formData.append("type", itemType);

      // Only send altText for images, not for videos
      if (itemType === "image" && galleryForm.altText) {
        formData.append("altText", galleryForm.altText);
      }

      if (galleryForm.packageId) {
        formData.append("packageId", galleryForm.packageId);
      }
      if (galleryForm.destinationId) {
        formData.append("destinationId", galleryForm.destinationId);
      }

      // Add file if selected
      if (mediaFile) {
        formData.append("gallery_media", mediaFile);
      }

      const response = await fetch(`/api/gallery/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Gallery item updated successfully",
          timer: 1500,
          showConfirmButton: false,
        });
        navigate(`/gallery/${id}`);
      } else {
        throw new Error(data.message || "Failed to update gallery item");
      }
    } catch (err) {
      console.error("Error updating gallery item:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Failed to update gallery item",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          background:
            "linear-gradient(135deg, rgba(245, 241, 232, 0.95) 0%, rgba(255, 255, 255, 0.98) 50%, rgba(232, 224, 209, 0.95) 100%)",
          p: { xs: 0.5, sm: 0.5, md: 0.5 },
        }}
      >
        <Container maxWidth="lg" sx={{ px: 0.5, py: 4 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => navigate("/gallery")}
          >
            Back to Gallery
          </Button>
        </Container>
      </Box>
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
              onClick={() => navigate(`/gallery/${id}`)}
              sx={{
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                color: "white",
                "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.3)" },
              }}
            >
              <ArrowBack />
            </IconButton>
            {galleryForm.type === "video" ? <VideoIcon sx={{ fontSize: 40 }} /> : <ImageIcon sx={{ fontSize: 40 }} />}
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}>
                Edit Gallery Item
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                {galleryForm.title || "Gallery item details"}
              </Typography>
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
            <form onSubmit={handleSubmit}>
              <Stack spacing={3}>
                {/* Media Upload Section */}
                <Box>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Media File
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Current file or upload a new one. Supported formats: Images (JPEG, PNG, GIF, WebP) and Videos (MP4, AVI, MOV, WMV, WebM, MKV). Max size: 100MB.
                  </Typography>

                  {mediaPreview && (
                    <Box sx={{ mb: 2, position: "relative" }}>
                      <Box
                        sx={{
                          width: "100%",
                          height: 200,
                          borderRadius: 2,
                          overflow: "hidden",
                          backgroundColor: "#f5f5f5",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "2px dashed #ddd",
                        }}
                      >
                        {mediaType === "video" ? (
                          <video
                            controls
                            style={{
                              maxWidth: "100%",
                              maxHeight: "100%",
                              objectFit: "contain",
                            }}
                          >
                            <source src={mediaPreview} />
                            Your browser does not support the video tag.
                          </video>
                        ) : (
                          <img
                            src={mediaPreview}
                            alt="Preview"
                            style={{
                              maxWidth: "100%",
                              maxHeight: "100%",
                              objectFit: "contain",
                            }}
                          />
                        )}
                      </Box>
                      <IconButton
                        onClick={removeMediaFile}
                        sx={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          backgroundColor: "rgba(0, 0, 0, 0.5)",
                          color: "white",
                          "&:hover": {
                            backgroundColor: "rgba(0, 0, 0, 0.7)",
                          },
                        }}
                      >
                        <CloseIcon />
                      </IconButton>
                    </Box>
                  )}

                  {!mediaPreview && (
                    <Box
                      sx={{
                        width: "100%",
                        height: 150,
                        borderRadius: 2,
                        border: "2px dashed #ddd",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        "&:hover": {
                          borderColor: "#B85C38",
                          backgroundColor: "rgba(184, 92, 56, 0.05)",
                        },
                        mb: 2,
                      }}
                      onClick={() => document.getElementById("media-upload").click()}
                    >
                      <CloudUpload sx={{ fontSize: 48, color: "#B85C38", mb: 1 }} />
                      <Typography variant="body1" color="text.secondary">
                        Click to upload new media file
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        or drag and drop
                      </Typography>
                    </Box>
                  )}

                  <input
                    id="media-upload"
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                    style={{ display: "none" }}
                  />
                </Box>

                {/* Basic Information */}
                <Box>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 800 }}>
                    Basic Information
                  </Typography>
                  <TextField
                    fullWidth
                    label="Title"
                    value={galleryForm.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    required
                  />
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Description"
                    value={galleryForm.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    sx={{ mt: 2 }}
                  />
                  <FormControl fullWidth sx={{ mt: 2 }}>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={galleryForm.category}
                      label="Category"
                      onChange={(e) => handleInputChange("category", e.target.value)}
                    >
                      {categoryOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    fullWidth
                    label="Location"
                    value={galleryForm.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    placeholder="e.g., Maasai Mara"
                    sx={{ mt: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Tags"
                    value={galleryForm.tags}
                    onChange={(e) => handleInputChange("tags", e.target.value)}
                    placeholder="Enter tags separated by commas"
                    helperText="Separate multiple tags with commas"
                    sx={{ mt: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Alt Text"
                    value={galleryForm.altText}
                    onChange={(e) => handleInputChange("altText", e.target.value)}
                    placeholder="Alternative text for accessibility"
                    helperText="Important for SEO and accessibility"
                    sx={{ mt: 2 }}
                  />
                </Box>

                {/* Settings */}
                <Box>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 800 }}>
                    Settings
                  </Typography>
                  <TextField
                    fullWidth
                    type="number"
                    label="Priority"
                    value={galleryForm.priority}
                    onChange={(e) => handleInputChange("priority", parseInt(e.target.value) || 0)}
                    helperText="Higher numbers appear first"
                  />
                  <FormControl fullWidth sx={{ mt: 2 }}>
                    <InputLabel>Package</InputLabel>
                    <Select
                      value={galleryForm.packageId}
                      label="Package"
                      onChange={(e) => handleInputChange("packageId", e.target.value)}
                    >
                      <MenuItem value="">None</MenuItem>
                      {/* TODO: Load packages dynamically */}
                      <MenuItem value="sample-package-id">Sample Package</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl fullWidth sx={{ mt: 2 }}>
                    <InputLabel>Destination</InputLabel>
                    <Select
                      value={galleryForm.destinationId}
                      label="Destination"
                      onChange={(e) => handleInputChange("destinationId", e.target.value)}
                    >
                      <MenuItem value="">None</MenuItem>
                      {/* TODO: Load destinations dynamically */}
                      <MenuItem value="sample-destination-id">Sample Destination</MenuItem>
                    </Select>
                  </FormControl>
                  <Box sx={{ mt: 2 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={galleryForm.isActive}
                          onChange={(e) => handleInputChange("isActive", e.target.checked)}
                        />
                      }
                      label="Active"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={galleryForm.isFeatured}
                          onChange={(e) => handleInputChange("isFeatured", e.target.checked)}
                        />
                      }
                      label="Featured"
                    />
                  </Box>
                </Box>

                {/* Action Buttons */}
                <Box display="flex" gap={2} justifyContent="flex-end" sx={{ mt: 3 }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate(`/gallery/${id}`)}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={saving ? <CircularProgress size={20} /> : <Save />}
                    disabled={saving}
                    sx={{
                      background: "linear-gradient(135deg, #B85C38 0%, #6B4E3D 100%)",
                      "&:hover": {
                        background: "linear-gradient(135deg, #8B4225 0%, #3D2817 100%)",
                      },
                    }}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </Box>
              </Stack>
            </form>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default GalleryEdit;