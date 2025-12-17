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

const BlogEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [featuredFile, setFeaturedFile] = useState(null);
  const [featuredPreview, setFeaturedPreview] = useState(null);
  const [authorFile, setAuthorFile] = useState(null);
  const [authorPreview, setAuthorPreview] = useState(null);

  const [blogForm, setBlogForm] = useState({
    slug: "",
    title: "",
    excerpt: "",
    content: "",
    category: "",
    tags: "",
    featured: false,
    priority: 0,
    authorName: "",
    readTime: "",
    publishDate: "",
    status: "draft",
  });

  const buildImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    if (path.startsWith("/")) return path;
    return `/${path}`;
  };

  useEffect(() => {
    fetchBlog();
  }, [id]);

  const fetchBlog = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/blogs/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to load blog");

      const b = data.data;
      setBlogForm({
        slug: b.slug || "",
        title: b.title || "",
        excerpt: b.excerpt || "",
        content: b.content || "",
        category: b.category || "",
        tags: Array.isArray(b.tags) ? b.tags.join(", ") : "",
        featured: !!b.featured,
        priority: b.priority ?? 0,
        authorName: b.authorName || "",
        readTime: b.readTime || "",
        publishDate: b.publishDate ? b.publishDate.split("T")[0] : "",
        status: b.status || "draft",
        ctaText: b.ctaText || "",
        ctaUrl: b.ctaUrl || "",
      });
      setFeaturedPreview(buildImageUrl(b.featuredImage));
      setAuthorPreview(buildImageUrl(b.authorImage));
    } catch (err) {
      setError(err.message || "Failed to load blog");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setBlogForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = (event, type = "featured") => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      Swal.fire("File too large", `${file.name} is larger than 10MB`, "error");
      return;
    }
    if (!file.type.startsWith("image/")) {
      Swal.fire("Invalid file type", `${file.name} is not an image`, "error");
      return;
    }
    const reader = new FileReader();
    if (type === "author") {
      setAuthorFile(file);
      reader.onloadend = () => setAuthorPreview(reader.result);
    } else {
      setFeaturedFile(file);
      reader.onloadend = () => setFeaturedPreview(reader.result);
    }
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const removeFeaturedFile = () => {
    setFeaturedFile(null);
    setFeaturedPreview(null);
  };

  const removeAuthorFile = () => {
    setAuthorFile(null);
    setAuthorPreview(null);
  };

  const isFormValid = () =>
    blogForm.slug.trim() && blogForm.title.trim() && blogForm.content.trim();

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      const token = localStorage.getItem("token");
      const formData = new FormData();

      formData.append("slug", blogForm.slug);
      formData.append("title", blogForm.title);
      formData.append("excerpt", blogForm.excerpt);
      formData.append("content", blogForm.content);
      if (blogForm.category) formData.append("category", blogForm.category);
      formData.append("featured", blogForm.featured);
      formData.append("priority", blogForm.priority || 0);
      if (blogForm.authorName) formData.append("authorName", blogForm.authorName);
      if (blogForm.readTime) formData.append("readTime", blogForm.readTime);
      if (blogForm.publishDate) formData.append("publishDate", blogForm.publishDate);
      if (blogForm.status) formData.append("status", blogForm.status);
      if (blogForm.tags) {
        formData.append(
          "tags",
          JSON.stringify(
            blogForm.tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          )
        );
      }
      if (featuredFile) {
        formData.append("blog_image", featuredFile);
      }
      if (authorFile) {
        formData.append("author_image", authorFile);
      }

      const res = await fetch(`/api/blogs/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to update blog");

      await Swal.fire({
        icon: "success",
        title: "Updated",
        text: "Blog updated successfully",
        timer: 1400,
        showConfirmButton: false,
      });
      navigate("/blogs");
    } catch (err) {
      setError(err.message || "Failed to update blog");
      Swal.fire("Error", err.message || "Failed to update blog", "error");
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
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate("/blogs")}
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
            mb: 4,
          }}
        >
          <Box display="flex" alignItems="center" gap={2} position="relative" zIndex={1}>
            <IconButton
              onClick={() => navigate("/blogs")}
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
                Edit Blog
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                {blogForm.title}
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
                  "&:hover": { background: "linear-gradient(135deg, #8B4225 0%, #6B4E3D 100%)" },
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
                label="Slug"
                value={blogForm.slug}
                onChange={(e) => handleInputChange("slug", e.target.value)}
                helperText="URL-friendly identifier"
              />
              <TextField
                fullWidth
                label="Title"
                value={blogForm.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
              />
              <TextField
                fullWidth
                label="Excerpt"
                multiline
                rows={2}
                value={blogForm.excerpt}
                onChange={(e) => handleInputChange("excerpt", e.target.value)}
              />
              <TextField
                fullWidth
                label="Content"
                multiline
                rows={6}
                value={blogForm.content}
                onChange={(e) => handleInputChange("content", e.target.value)}
              />
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={blogForm.category}
                  label="Category"
                  onChange={(e) => handleInputChange("category", e.target.value)}
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  <MenuItem value="Wildlife">Wildlife</MenuItem>
                  <MenuItem value="Travel Tips">Travel Tips</MenuItem>
                  <MenuItem value="Conservation">Conservation</MenuItem>
                  <MenuItem value="Photography">Photography</MenuItem>
                  <MenuItem value="Guides">Guides</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Tags (comma separated)"
                value={blogForm.tags}
                onChange={(e) => handleInputChange("tags", e.target.value)}
              />
              <TextField
                fullWidth
                label="Author Name"
                value={blogForm.authorName}
                onChange={(e) => handleInputChange("authorName", e.target.value)}
              />
              <Box>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Author Image
                </Typography>
                <Box mb={2}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e, "author")}
                    style={{ display: "none" }}
                    id="blog-author-upload"
                  />
                  <label htmlFor="blog-author-upload">
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
                      Upload Author Image
                    </Button>
                  </label>
                </Box>

                {authorPreview ? (
                  <Box
                    sx={{
                      p: 2,
                      backgroundColor: "#f8f9fa",
                      borderRadius: 2,
                      border: "1px solid #e0e0e0",
                      position: "relative",
                      maxWidth: 300,
                    }}
                  >
                    <IconButton
                      onClick={removeAuthorFile}
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
                    <img
                      src={authorPreview}
                      alt="Author"
                      style={{
                        width: "120px",
                        height: "120px",
                        objectFit: "cover",
                        borderRadius: "50%",
                        marginBottom: "8px",
                      }}
                    />
                    <Typography variant="caption" sx={{ color: "#333" }}>
                      {authorFile?.name || "Current author image"}
                    </Typography>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      border: "2px dashed #ccc",
                      borderRadius: 2,
                      p: 3,
                      textAlign: "center",
                      bgcolor: "#f9f9f9",
                      maxWidth: 300,
                    }}
                  >
                    <ImageIcon sx={{ fontSize: 48, opacity: 0.3 }} />
                    <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>
                      No author image. Click "Upload Author Image" to add one.
                    </Typography>
                  </Box>
                )}
              </Box>
              <TextField
                fullWidth
                label="Read Time (minutes)"
                type="number"
                value={blogForm.readTime}
                onChange={(e) => handleInputChange("readTime", e.target.value)}
              />
              <TextField
                fullWidth
                label="Priority"
                type="number"
                value={blogForm.priority}
                onChange={(e) => handleInputChange("priority", e.target.value)}
                helperText="Higher shows first when featured"
              />
              <TextField
                fullWidth
                label="Publish Date"
                type="date"
                value={blogForm.publishDate}
                onChange={(e) => handleInputChange("publishDate", e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={blogForm.status}
                  label="Status"
                  onChange={(e) => handleInputChange("status", e.target.value)}
                >
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="published">Published</MenuItem>
                  <MenuItem value="archived">Archived</MenuItem>
                </Select>
              </FormControl>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={blogForm.featured}
                    onChange={(e) => handleInputChange("featured", e.target.checked)}
                  />
                }
                label="Featured"
              />
              <Box>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Featured Image
                </Typography>
                <Box mb={2}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    style={{ display: "none" }}
                    id="blog-featured-upload"
                  />
                  <label htmlFor="blog-featured-upload">
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
                      Upload Image
                    </Button>
                  </label>
                </Box>

                {featuredPreview ? (
                  <Box
                    sx={{
                      p: 2,
                      backgroundColor: "#f8f9fa",
                      borderRadius: 2,
                      border: "1px solid #e0e0e0",
                      position: "relative",
                      maxWidth: 400,
                    }}
                  >
                    <IconButton
                      onClick={removeFeaturedFile}
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
                    <img
                      src={featuredPreview}
                      alt="Featured"
                      style={{
                        width: "100%",
                        height: "200px",
                        objectFit: "cover",
                        borderRadius: "8px",
                        marginBottom: "8px",
                      }}
                    />
                    <Typography variant="caption" sx={{ color: "#333" }}>
                      {featuredFile?.name || "Current featured image"}
                    </Typography>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      border: "2px dashed #ccc",
                      borderRadius: 2,
                      p: 3,
                      textAlign: "center",
                      bgcolor: "#f9f9f9",
                      maxWidth: 400,
                    }}
                  >
                    <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>
                      No image selected. Click "Upload Image" to add one.
                    </Typography>
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

export default BlogEdit;
