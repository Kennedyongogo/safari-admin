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
} from "@mui/material";
import { ArrowBack, Edit, CalendarToday, Star, Article } from "@mui/icons-material";

const BlogView = () => {
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

      const normalized = {
        ...data.data,
        tags: Array.isArray(data.data?.tags)
          ? data.data.tags
          : typeof data.data?.tags === "string"
          ? data.data.tags.split(",").map((t) => t.trim()).filter(Boolean)
          : [],
      };

      setBlog(normalized);
    } catch (err) {
      setError(err.message || "Failed to load blog");
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
                {blog.title}
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Blog details
              </Typography>
            </Box>
            <Box ml="auto" display="flex" gap={1}>
              <Button
                variant="contained"
                startIcon={<Edit />}
                onClick={() => navigate(`/blogs/${blog.id}/edit`)}
                sx={{
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  color: "white",
                  "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.3)" },
                }}
              >
                Edit
              </Button>
            </Box>
          </Box>
        </Box>

        <Stack spacing={3}>
          <Card
            sx={{
              backgroundColor: "white",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
              border: "1px solid #e0e0e0",
            }}
          >
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>
                Content
              </Typography>
              <Typography variant="body1" sx={{ color: "text.secondary", whiteSpace: "pre-wrap" }}>
                {blog.content || "No content provided."}
              </Typography>
            </CardContent>
          </Card>

          <Card
            sx={{
              backgroundColor: "white",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
              border: "1px solid #e0e0e0",
            }}
          >
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>
                Meta
              </Typography>
              <Typography variant="body2">Slug: {blog.slug}</Typography>
              <Typography variant="body2">Category: {blog.category || "—"}</Typography>
              <Typography variant="body2">Status: {blog.status}</Typography>
              <Typography variant="body2">
                Featured: {blog.featured ? "Yes" : "No"}
              </Typography>
              <Typography variant="body2">Priority: {blog.priority ?? 0}</Typography>
              <Typography variant="body2">Views: {blog.views ?? 0}</Typography>
              <Typography variant="body2">Likes: {blog.likes ?? 0}</Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 1.5 }}>
                <Avatar
                  src={buildImageUrl(blog.authorImage)}
                  alt={blog.authorName || "Author"}
                  sx={{ width: 40, height: 40 }}
                />
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {blog.authorName || "Unknown author"}
                  </Typography>
                  {blog.authorBio ? (
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      {blog.authorBio}
                    </Typography>
                  ) : null}
                </Box>
              </Box>
              <Typography variant="body2">
                Publish Date: {formatDate(blog.publishDate || blog.createdAt)}
              </Typography>
              <Typography variant="body2">
                Read Time: {blog.readTime ? `${blog.readTime} min` : "—"}
              </Typography>
            </CardContent>
          </Card>

          <Card
            sx={{
              backgroundColor: "white",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
              border: "1px solid #e0e0e0",
            }}
          >
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>
                Tags
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {Array.isArray(blog.tags) && blog.tags.length ? (
                  blog.tags.map((tag, idx) => (
                    <Chip key={idx} label={tag} size="small" />
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    None
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>

          {(blog.excerpt || blog.ctaText || blog.ctaUrl) && (
            <Card
              sx={{
                backgroundColor: "white",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
                border: "1px solid #e0e0e0",
              }}
            >
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>
                  Extras
                </Typography>
                {blog.excerpt && (
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Excerpt:</strong> {blog.excerpt}
                  </Typography>
                )}
                {blog.ctaText && (
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    <strong>CTA:</strong> {blog.ctaText}
                  </Typography>
                )}
                {blog.ctaUrl && (
                  <Typography variant="body2">
                    <strong>CTA URL:</strong> {blog.ctaUrl}
                  </Typography>
                )}
              </CardContent>
            </Card>
          )}

          {buildImageUrl(blog.featuredImage) && (
            <Card
              sx={{
                backgroundColor: "white",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
                border: "1px solid #e0e0e0",
              }}
            >
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                  Featured Image
                </Typography>
                <Box
                  component="img"
                  src={buildImageUrl(blog.featuredImage)}
                  alt={blog.title}
                  sx={{
                    width: "100%",
                    maxHeight: 420,
                    objectFit: "cover",
                    borderRadius: 2,
                    border: "1px solid #eee",
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

export default BlogView;
