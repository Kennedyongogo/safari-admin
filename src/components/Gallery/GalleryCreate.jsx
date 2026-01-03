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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  CircularProgress,
  Alert,
  IconButton,
  Checkbox,
  FormControlLabel,
  Paper,
} from "@mui/material";
import {
  Save,
  ArrowBack,
  CloudUpload,
  Close as CloseIcon,
  Image as ImageIcon,
  VideoLibrary as VideoIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const GalleryCreate = () => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);

  const [galleryForm, setGalleryForm] = useState({
    title: "",
    description: "",
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
    event.target.value = "";
  };

  const removeMediaFile = () => {
    setMediaFile(null);
    setMediaPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!galleryForm.title.trim()) {
      setError("Title is required");
      return;
    }

    if (!mediaFile) {
      setError("Please select a media file to upload");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const token = localStorage.getItem("token");

      // Prepare form data
      const formData = new FormData();
      formData.append("gallery_media", mediaFile);
      formData.append("title", galleryForm.title);
      formData.append("description", galleryForm.description);
      formData.append("category", galleryForm.category);
      formData.append("tags", galleryForm.tags);
      formData.append("location", galleryForm.location);
      formData.append("isActive", galleryForm.isActive.toString());
      formData.append("isFeatured", galleryForm.isFeatured.toString());
      formData.append("priority", galleryForm.priority.toString());
      formData.append("altText", galleryForm.altText);

      if (galleryForm.packageId) {
        formData.append("packageId", galleryForm.packageId);
      }
      if (galleryForm.destinationId) {
        formData.append("destinationId", galleryForm.destinationId);
      }

      const response = await fetch("/api/gallery/upload", {
        method: "POST",
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
          text: "Gallery item created successfully",
          timer: 1500,
          showConfirmButton: false,
        });
        navigate("/gallery");
      } else {
        throw new Error(data.message || "Failed to create gallery item");
      }
    } catch (err) {
      console.error("Error creating gallery item:", err);
      setError(err.message || "Failed to create gallery item");
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Failed to create gallery item",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box
      sx={{
        background:
          "linear-gradient(135deg, rgba(245, 241, 232, 0.95) 0%, rgba(255, 255, 255, 0.98) 50%, rgba(232, 224, 209, 0.95) 100%)",
        minHeight: "100vh",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          borderRadius: 0,
          overflow: "hidden",
          background: "rgba(255, 255, 255, 0.98)",
          backdropFilter: "blur(10px)",
          border: "none",
          boxShadow: "none",
          minHeight: "100vh",
        }}
      >
        {/* Header Section */}
        <Box
          sx={{
            background: "linear-gradient(135deg, #6B4E3D 0%, #B85C38 100%)",
            p: 3,
            color: "white",
            position: "relative",
            overflow: "hidden",
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
              zIndex: 0,
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
              zIndex: 0,
            }}
          />
          <Box
            display="flex"
            flexDirection={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            gap={{ xs: 2, sm: 0 }}
            position="relative"
            zIndex={1}
          >
            <Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  mb: 1,
                  textShadow: "0 2px 4px rgba(0,0,0,0.3)",
                  fontSize: { xs: "1.5rem", sm: "2rem", md: "2.125rem" },
                }}
              >
                Create Gallery Item
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Upload and configure a new gallery item
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={() => navigate("/gallery")}
              sx={{
                color: "white",
                borderColor: "rgba(255, 255, 255, 0.3)",
                "&:hover": {
                  borderColor: "rgba(255, 255, 255, 0.5)",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                },
              }}
            >
              Back to Gallery
            </Button>
          </Box>
        </Box>

        {/* Content Section */}
        <Container maxWidth="md" sx={{ py: 4 }}>
          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              {/* Media Upload Section */}
              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Media File *
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Upload an image or video file. Supported formats: Images (JPEG, PNG, GIF, WebP) and Videos (MP4, AVI, MOV, WMV, WebM, MKV). Max size: 100MB.
                  </Typography>

                {mediaPreview ? (
                  <Box sx={{ mb: 2, position: "relative" }}>
                    <Box
                      sx={{
                        width: "100%",
                        height: 300,
                        borderRadius: 2,
                        overflow: "hidden",
                        backgroundColor: "#f5f5f5",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "2px solid #e0e0e0",
                      }}
                    >
                      {mediaPreview.includes("video") || mediaPreview.includes("data:video") ? (
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
                ) : (
                  <Box
                    sx={{
                      width: "100%",
                      height: 200,
                      borderRadius: 2,
                      border: "2px dashed #B85C38",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      backgroundColor: "rgba(184, 92, 56, 0.05)",
                      "&:hover": {
                        backgroundColor: "rgba(184, 92, 56, 0.1)",
                        borderColor: "#8B4225",
                      },
                      transition: "all 0.3s ease",
                    }}
                    onClick={() => document.getElementById("media-upload").click()}
                  >
                    <CloudUpload sx={{ fontSize: 48, color: "#B85C38", mb: 1 }} />
                    <Typography variant="h6" color="#B85C38" fontWeight="bold">
                      Click to upload media file
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      or drag and drop an image or video
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                      Supports: JPEG, PNG, GIF, WebP, MP4, AVI, MOV, WMV, WebM, MKV
                    </Typography>
                  </Box>
                )}

                <input
                  id="media-upload"
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  style={{ display: "none" }}
                  required={!mediaFile}
                />

                {mediaFile && (
                  <Box sx={{ mt: 2, p: 2, backgroundColor: "#f5f5f5", borderRadius: 2 }}>
                    <Typography variant="body2" fontWeight="medium">
                      Selected file: {mediaFile.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Size: {(mediaFile.size / 1024 / 1024).toFixed(2)} MB • Type: {mediaFile.type}
                    </Typography>
                  </Box>
                )}
                </CardContent>
              </Card>

              {/* Basic Information */}
              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Basic Information
                  </Typography>
                  <Stack spacing={2}>
                    <TextField
                      fullWidth
                      label="Title *"
                      value={galleryForm.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      required
                      helperText="Give your gallery item a descriptive title"
                    />
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Description"
                      value={galleryForm.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      helperText="Optional description of the media content"
                    />
                    <FormControl fullWidth>
                      <InputLabel>Category *</InputLabel>
                      <Select
                        value={galleryForm.category}
                        label="Category"
                        onChange={(e) => handleInputChange("category", e.target.value)}
                        required
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
                      placeholder="e.g., Maasai Mara National Reserve"
                      helperText="Where was this media captured?"
                    />
                    <TextField
                      fullWidth
                      label="Tags"
                      value={galleryForm.tags}
                      onChange={(e) => handleInputChange("tags", e.target.value)}
                      placeholder="safari, wildlife, sunset, adventure"
                      helperText="Separate multiple tags with commas for better searchability"
                    />
                    <TextField
                      fullWidth
                      label="Alt Text"
                      value={galleryForm.altText}
                      onChange={(e) => handleInputChange("altText", e.target.value)}
                      placeholder="Describe the image for accessibility"
                      helperText="Important for SEO and users with screen readers"
                    />
                  </Stack>
                </CardContent>
              </Card>

              {/* Settings */}
              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Settings
                  </Typography>
                  <Stack spacing={2}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Priority"
                      value={galleryForm.priority}
                      onChange={(e) => handleInputChange("priority", parseInt(e.target.value) || 0)}
                      helperText="Higher numbers appear first in listings"
                    />
                    <FormControl fullWidth>
                      <InputLabel>Associated Package</InputLabel>
                      <Select
                        value={galleryForm.packageId}
                        label="Associated Package"
                        onChange={(e) => handleInputChange("packageId", e.target.value)}
                      >
                        <MenuItem value="">None</MenuItem>
                        {/* TODO: Load packages dynamically from API */}
                        <MenuItem value="sample-package-1">Maasai Mara Safari Package</MenuItem>
                        <MenuItem value="sample-package-2">Amboseli Wildlife Tour</MenuItem>
                      </Select>
                    </FormControl>
                    <FormControl fullWidth>
                      <InputLabel>Associated Destination</InputLabel>
                      <Select
                        value={galleryForm.destinationId}
                        label="Associated Destination"
                        onChange={(e) => handleInputChange("destinationId", e.target.value)}
                      >
                        <MenuItem value="">None</MenuItem>
                        {/* TODO: Load destinations dynamically from API */}
                        <MenuItem value="sample-dest-1">Maasai Mara</MenuItem>
                        <MenuItem value="sample-dest-2">Amboseli National Park</MenuItem>
                      </Select>
                    </FormControl>
                    <Stack spacing={1}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={galleryForm.isActive}
                            onChange={(e) => handleInputChange("isActive", e.target.checked)}
                          />
                        }
                        label="Active (visible to public)"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={galleryForm.isFeatured}
                            onChange={(e) => handleInputChange("isFeatured", e.target.checked)}
                          />
                        }
                        label="Featured (highlighted)"
                      />
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <Box display="flex" gap={2} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  onClick={() => navigate("/gallery")}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={saving ? <CircularProgress size={20} /> : <Save />}
                  disabled={saving || !mediaFile}
                  sx={{
                    background: "linear-gradient(135deg, #B85C38 0%, #6B4E3D 100%)",
                    "&:hover": {
                      background: "linear-gradient(135deg, #8B4225 0%, #3D2817 100%)",
                    },
                    "&:disabled": {
                      background: "#ccc",
                    },
                  }}
                >
                  {saving ? "Creating..." : "Create Gallery Item"}
                </Button>
              </Box>
            </Stack>
          </form>
        </Container>
      </Paper>
    </Box>
  );
};

export default GalleryCreate;