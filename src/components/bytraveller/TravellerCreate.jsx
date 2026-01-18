import React, { useEffect, useMemo, useState } from "react";
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
  Chip,
} from "@mui/material";
import {
  Save,
  ArrowBack,
  CloudUpload,
  Image as ImageIcon,
  Close as CloseIcon,
  Article,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const CATEGORY_OPTIONS = [
  { value: "family", label: "Family" },
  { value: "honeymoon", label: "Honeymoon" },
  { value: "couples", label: "Couples" },
  { value: "friends", label: "Friends" },
  { value: "women", label: "Women" },
];

const TravellerCreate = () => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "family",
    tagsText: "",
    altText: "",
    isActive: true,
    isFeatured: false,
    priority: 0,
  });

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const tags = useMemo(() => {
    const raw = (form.tagsText || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    // unique
    return Array.from(new Set(raw));
  }, [form.tagsText]);

  const handleInputChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = (event) => {
    const selected = event.target.files?.[0] || null;
    if (!selected) return;
    if (!(selected.type.startsWith("image/") || selected.type.startsWith("video/"))) {
      setError("Please select an image or video file.");
      return;
    }
    setFile(selected);
    event.target.value = "";
  };

  const isFormValid = () => form.title.trim() && !!file;

  const handleCreate = async () => {
    try {
      setSaving(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authentication token found. Please login again.");
        return;
      }

      const formData = new FormData();

      formData.append("traveller_gallery_media", file);
      formData.append("title", form.title);
      formData.append("description", form.description || "");
      formData.append("category", form.category);
      formData.append("tags", JSON.stringify(tags));
      formData.append("altText", form.altText || "");
      formData.append("isActive", form.isActive.toString());
      formData.append("isFeatured", form.isFeatured.toString());
      formData.append("priority", String(form.priority ?? 0));

      const response = await fetch("/api/traveller-gallery/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setFile(null);
        await Swal.fire({
          title: "Success!",
          text: "Traveller gallery item created successfully!",
          icon: "success",
          confirmButtonColor: "#6B4E3D",
        });
        navigate("/traveller");
      } else {
        throw new Error(result.message || "Failed to create traveller gallery item");
      }
    } catch (err) {
      console.error("Error creating traveller gallery item:", err);
      setError(err.message || "Failed to create traveller gallery item");
      await Swal.fire({
        title: "Error!",
        text: err.message || "Failed to create traveller gallery item",
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
              onClick={() => navigate("/traveller")}
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
              Create By Traveller Item
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
                value={form.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                required
              />
              <TextField
                fullWidth
                label="Description (optional)"
                multiline
                minRows={3}
                value={form.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
              />

              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={form.category}
                  label="Category"
                  onChange={(e) => handleInputChange("category", e.target.value)}
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <MenuItem key={c.value} value={c.value}>
                      {c.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Tags (comma separated)"
                value={form.tagsText}
                onChange={(e) => handleInputChange("tagsText", e.target.value)}
                placeholder="e.g., beach, budget, luxury"
              />
              {tags.length > 0 && (
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {tags.map((t) => (
                    <Chip key={t} label={t} size="small" />
                  ))}
                </Box>
              )}

              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Settings
                </Typography>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={form.isActive}
                    onChange={(e) => handleInputChange("isActive", e.target.value === true || e.target.value === "true")}
                    label="Status"
                  >
                    <MenuItem value={true}>Active</MenuItem>
                    <MenuItem value={false}>Inactive</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Featured</InputLabel>
                  <Select
                    value={form.isFeatured}
                    onChange={(e) => handleInputChange("isFeatured", e.target.value === true || e.target.value === "true")}
                    label="Featured"
                  >
                    <MenuItem value={false}>No</MenuItem>
                    <MenuItem value={true}>Yes</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <TextField
                    fullWidth
                    label="Priority"
                    type="number"
                    value={form.priority}
                    onChange={(e) =>
                      handleInputChange("priority", parseInt(e.target.value, 10) || 0)
                    }
                    helperText="Higher numbers appear first"
                  />
                </FormControl>
                <TextField
                  fullWidth
                  label="Alt text (images only, optional)"
                  value={form.altText}
                  onChange={(e) => handleInputChange("altText", e.target.value)}
                  placeholder="Short accessible description"
                  sx={{ mb: 2 }}
                />
              </Box>

              <Box>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Media (image or video)
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
                  Upload one image/video to represent this “By Traveller” card/gallery item.
                </Typography>
                <Box mb={2}>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                    style={{ display: "none" }}
                    id="traveller-media-upload"
                  />
                  <label htmlFor="traveller-media-upload">
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
                      Upload Media
                    </Button>
                  </label>
                </Box>

                {file ? (
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{ mb: 2, color: "text.secondary" }}
                    >
                      Selected: {file.name}
                    </Typography>
                    <Box sx={{ position: "relative", width: "100%", maxWidth: 560 }}>
                      <IconButton
                        onClick={() => setFile(null)}
                        sx={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          backgroundColor: "rgba(0, 0, 0, 0.5)",
                          color: "white",
                          "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.7)" },
                          zIndex: 2,
                        }}
                        size="small"
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                      {file.type.startsWith("video/") ? (
                        <Box
                          component="video"
                          src={previewUrl || undefined}
                          controls
                          sx={{
                            width: "100%",
                            borderRadius: 2,
                            border: "1px solid #e0e0e0",
                          }}
                        />
                      ) : (
                        <Box
                          component="img"
                          src={previewUrl || undefined}
                          alt="Preview"
                          sx={{
                            width: "100%",
                            maxHeight: 320,
                            objectFit: "cover",
                            borderRadius: 2,
                            border: "1px solid #e0e0e0",
                          }}
                        />
                      )}
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
                      No media selected. Click “Upload Media” to choose an image or video.
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
                  {saving ? "Creating..." : "Create Item"}
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate("/traveller")}
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

export default TravellerCreate;
