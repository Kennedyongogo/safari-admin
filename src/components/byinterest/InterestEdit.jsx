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
  Checkbox,
  FormControlLabel,
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

const CATEGORY_OPTIONS = [
  { value: "adventure", label: "Adventure" },
  { value: "classic", label: "Classic" },
  { value: "meaningful", label: "Meaningful" },
  { value: "retreats", label: "Retreats" },
  { value: "special_interest", label: "Special Interest" },
  { value: "general", label: "General" },
];

const InterestEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType] = useState(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "",
    category: "adventure",
    tagsText: "",
    altText: "",
    isActive: true,
    isFeatured: false,
    priority: 0,
  });

  const buildMediaUrl = (path) => {
    if (!path) return null;
    let normalized = path.replace(/\\/g, "/").trim();
    if (normalized.startsWith("http://") || normalized.startsWith("https://")) return normalized;
    if (normalized.startsWith("/")) return normalized;
    return `/${normalized}`;
  };

  useEffect(() => {
    fetchInterestItem();
  }, [id]);

  const fetchInterestItem = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/interest-gallery/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to load interest gallery item");

      const item = data.data;
      setForm({
        title: item.title || "",
        description: item.description || "",
        type: item.type || "",
        category: item.category || "adventure",
        tagsText: Array.isArray(item.tags) ? item.tags.join(", ") : "",
        altText: item.altText || "",
        isActive: item.isActive ?? true,
        isFeatured: item.isFeatured ?? false,
        priority: item.priority ?? 0,
      });

      setMediaPreview(buildMediaUrl(item.filePath));
      setMediaType(item.type);
    } catch (err) {
      setError(err.message || "Failed to load interest gallery item");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      Swal.fire({ icon: "error", title: "File too large", text: `${file.name} is larger than 100MB` });
      return;
    }

    const allowedTypes = [
      ...["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"],
      ...["video/mp4", "video/avi", "video/mov", "video/wmv", "video/webm", "video/mkv"]
    ];
    if (!allowedTypes.includes(file.type)) {
      Swal.fire({ icon: "error", title: "Invalid file type", text: "Please select a valid image or video file" });
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

      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("description", form.description || "");
      formData.append("category", form.category);
      const tagsArray = (form.tagsText || "").split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      formData.append("tags", JSON.stringify(tagsArray));
      formData.append("altText", form.altText || "");
      formData.append("isActive", form.isActive.toString());
      formData.append("isFeatured", form.isFeatured.toString());
      formData.append("priority", String(form.priority ?? 0));

      const itemType = mediaType || form.type;
      if (!itemType) throw new Error("Media type is required. Please ensure a file is selected or the item has a valid type.");
      formData.append("type", itemType);

      if (mediaFile) {
        formData.append("interest_gallery_media", mediaFile);
      }

      const response = await fetch(`/api/interest-gallery/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        Swal.fire({ icon: "success", title: "Success!", text: "Interest gallery item updated successfully", timer: 1500, showConfirmButton: false });
        navigate(`/interest/${id}`);
      } else {
        throw new Error(data.message || "Failed to update interest gallery item");
      }
    } catch (err) {
      console.error("Error updating interest gallery item:", err);
      Swal.fire({ icon: "error", title: "Error", text: err.message || "Failed to update interest gallery item" });
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
            onClick={() => navigate("/interest")}
          >
            Back to By Interest
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
              onClick={() => navigate(`/interest/${id}`)}
              sx={{
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                color: "white",
                "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.3)" },
              }}
            >
              <ArrowBack />
            </IconButton>
            {mediaType === "video" ? <VideoIcon sx={{ fontSize: 40 }} /> : <ImageIcon sx={{ fontSize: 40 }} />}
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}>
                Edit By Interest Item
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                {form.title || "Interest gallery item details"}
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
                  <Typography variant="h6" fontWeight="bold" gutterBottom>Media File</Typography>
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
                            style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                            onError={(e) => {
                              console.error("Video preview failed to load:", e.target.src);
                              console.error("Video error:", e.target.error);
                              console.error("Media preview URL:", mediaPreview);
                            }}
                          >
                            <source src={mediaPreview} type="video/mp4" />
                            Your browser does not support the video tag.
                          </video>
                        ) : (
                          <img src={mediaPreview} alt="Preview" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
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
                          "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.7)" },
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
                        "&:hover": { borderColor: "#B85C38", backgroundColor: "rgba(184, 92, 56, 0.05)" },
                        mb: 2,
                      }}
                      onClick={() => document.getElementById("media-upload").click()}
                    >
                      <CloudUpload sx={{ fontSize: 48, color: "#B85C38", mb: 1 }} />
                      <Typography variant="body1" color="text.secondary">Click to upload new media file</Typography>
                      <Typography variant="body2" color="text.secondary">or drag and drop</Typography>
                    </Box>
                  )}

                  <input id="media-upload" type="file" accept="image/*,video/*" onChange={handleFileSelect} style={{ display: "none" }} />
                </Box>

                {/* Basic Information */}
                <Box>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 800 }}>Basic Information</Typography>
                  <TextField fullWidth label="Title" value={form.title} onChange={(e) => handleInputChange("title", e.target.value)} required />
                  <TextField fullWidth multiline rows={3} label="Description" value={form.description} onChange={(e) => handleInputChange("description", e.target.value)} sx={{ mt: 2 }} />
                  <FormControl fullWidth sx={{ mt: 2 }}>
                    <InputLabel>Category</InputLabel>
                    <Select value={form.category} label="Category" onChange={(e) => handleInputChange("category", e.target.value)}>
                      {CATEGORY_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField fullWidth label="Tags" value={form.tagsText} onChange={(e) => handleInputChange("tagsText", e.target.value)} placeholder="Enter tags separated by commas" helperText="Separate multiple tags with commas" sx={{ mt: 2 }} />
                  <TextField fullWidth label="Alt Text" value={form.altText} onChange={(e) => handleInputChange("altText", e.target.value)} placeholder="Alternative text for accessibility" helperText="Important for SEO and accessibility" sx={{ mt: 2 }} />
                </Box>

                {/* Settings */}
                <Box>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 800 }}>Settings</Typography>
                  <TextField fullWidth type="number" label="Priority" value={form.priority} onChange={(e) => handleInputChange("priority", parseInt(e.target.value) || 0)} helperText="Higher numbers appear first" />
                  <Box sx={{ mt: 2 }}>
                    <FormControlLabel control={<Checkbox checked={form.isActive} onChange={(e) => handleInputChange("isActive", e.target.checked)} />} label="Active" />
                    <FormControlLabel control={<Checkbox checked={form.isFeatured} onChange={(e) => handleInputChange("isFeatured", e.target.checked)} />} label="Featured" />
                  </Box>
                </Box>

                {/* Action Buttons */}
                <Box display="flex" gap={2} justifyContent="flex-end" sx={{ mt: 3 }}>
                  <Button variant="outlined" onClick={() => navigate(`/interest/${id}`)} disabled={saving}>Cancel</Button>
                  <Button type="submit" variant="contained" startIcon={saving ? <CircularProgress size={20} /> : <Save />} disabled={saving} sx={{ background: "linear-gradient(135deg, #B85C38 0%, #6B4E3D 100%)", "&:hover": { background: "linear-gradient(135deg, #8B4225 0%, #3D2817 100%)" } }}>
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

export default InterestEdit;