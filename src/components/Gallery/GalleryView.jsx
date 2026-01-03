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
  Divider,
  Paper,
} from "@mui/material";
import {
  ArrowBack,
  Edit,
  CalendarToday,
  Image as ImageIcon,
  VideoLibrary as VideoIcon,
  LocationOn,
  Folder,
  Star,
  StarBorder,
  Visibility,
  CloudDownload,
} from "@mui/icons-material";

const GalleryView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [galleryItem, setGalleryItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const buildImageUrl = (path) => {
    if (!path) return null;
    const normalized = path.replace(/\\/g, "/");
    if (normalized.startsWith("http")) return normalized;

    // For debugging video issues, construct full API URL
    if (galleryItem?.type === "video") {
      const apiUrl = `http://localhost:4000/${normalized.startsWith("/") ? normalized.slice(1) : normalized}`;
      console.log("Video URL constructed:", apiUrl);
      return apiUrl;
    }

    if (normalized.startsWith("/")) return normalized;
    return `/${normalized}`;
  };

  // Check if video file exists and try alternative paths if needed
  const getVideoUrl = (filePath) => {
    if (!filePath) return null;

    const baseUrl = buildImageUrl(filePath);

    // For the specific broken video, try the corrected path
    if (filePath.includes("134898_760686085_medium-1767446598786-306006330.mp4")) {
      const correctedPath = filePath.replace("1767446598786-306006330", "1767446750214-590507885");
      console.log("Trying corrected video path:", correctedPath);
      return buildImageUrl(correctedPath);
    }

    return baseUrl;
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

      setGalleryItem(data.data);
    } catch (err) {
      setError(err.message || "Failed to load gallery item");
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

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const getTypeIcon = (type) => {
    return type === "video" ? <VideoIcon fontSize="large" /> : <ImageIcon fontSize="large" />;
  };

  const getTypeColor = (type) => {
    return type === "video" ? "error" : "primary";
  };

  const getCategoryColor = (category) => {
    const colors = {
      wildlife: "success",
      landscapes: "info",
      safari: "warning",
      culture: "secondary",
      accommodation: "primary",
      activities: "default",
      general: "default",
    };
    return colors[category] || "default";
  };

  const testFileAccess = async () => {
    const url = galleryItem.type === "video" ? getVideoUrl(galleryItem.filePath) : buildImageUrl(galleryItem.filePath);
    console.log("Testing file access for URL:", url);

    try {
      const response = await fetch(url, { method: 'HEAD' });
      console.log("File access test result:", {
        url,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      });

      if (response.ok) {
        alert(`File is accessible! Status: ${response.status}`);
      } else {
        alert(`File not accessible. Status: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error("File access test failed:", error);
      alert(`File access failed: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !galleryItem) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || "Gallery item not found"}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate("/gallery")}
        >
          Back to Gallery
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
            mb: 2,
          }}
        >
          <Box display="flex" alignItems="center" gap={2} position="relative" zIndex={1}>
            <IconButton
              onClick={() => navigate("/gallery")}
              sx={{
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                color: "white",
                "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.3)" },
              }}
            >
              <ArrowBack />
            </IconButton>
            {getTypeIcon(galleryItem.type)}
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}>
                {galleryItem.title}
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Gallery item details
              </Typography>
            </Box>
            <Box ml="auto" display="flex" gap={1}>
              <Button
                variant="contained"
                startIcon={<Edit />}
                onClick={() => navigate(`/gallery/${id}/edit`)}
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

        <Stack spacing={1.5}>
          {/* Media Display */}
          <Card
            sx={{
              backgroundColor: "white",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
              border: "1px solid #e0e0e0",
              borderLeft: "6px solid #B85C38",
            }}
          >
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 800 }}>
                Media Preview
              </Typography>
              <Box
                sx={{
                  position: "relative",
                  height: 400,
                  backgroundColor: "#f5f5f5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 2,
                  overflow: "hidden",
                }}
              >
                {galleryItem.type === "video" ? (
                  <video
                    controls
                    src={getVideoUrl(galleryItem.filePath)}
                    style={{
                      maxWidth: "100%",
                      maxHeight: "100%",
                      objectFit: "contain",
                      backgroundColor: "#000",
                      width: "100%",
                      height: "100%",
                    }}
                    poster={galleryItem.thumbnailPath ? buildImageUrl(galleryItem.thumbnailPath) : undefined}
                    onError={(e) => {
                      console.error("Video failed to load:", e.target.src);
                      console.error("Video error:", e.target.error);
                      console.error("Gallery item filePath:", galleryItem.filePath);
                      console.error("Built URL:", buildImageUrl(galleryItem.filePath));
                      console.error("MIME type:", galleryItem.mimeType);
                      // Try to fetch the video directly to see if it's accessible
                      fetch(buildImageUrl(galleryItem.filePath), { method: 'HEAD' })
                        .then(response => {
                          console.log("Video HEAD request result:", response.status, response.statusText);
                          console.log("Video content-type:", response.headers.get('content-type'));
                          console.log("Video content-length:", response.headers.get('content-length'));
                        })
                        .catch(err => console.error("Video HEAD request failed:", err));
                    }}
                    onLoadStart={() => console.log("Video started loading")}
                    onLoadedData={() => console.log("Video loaded successfully")}
                    onCanPlay={() => console.log("Video can play")}
                    preload="metadata"
                  >
                    Your browser does not support the video tag. <a href={getVideoUrl(galleryItem.filePath)} target="_blank">Download video</a>
                  </video>
                ) : (
                  <img
                    src={buildImageUrl(galleryItem.filePath)}
                    alt={galleryItem.altText || galleryItem.title}
                    style={{
                      maxWidth: "100%",
                      maxHeight: "100%",
                      objectFit: "contain",
                    }}
                    onError={(e) => {
                      console.error("Image failed to load:", e.target.src);
                      console.error("Image element:", e.target);
                      console.error("Gallery item filePath:", galleryItem.filePath);
                      console.error("Built URL:", buildImageUrl(galleryItem.filePath));
                    }}
                    onLoad={() => console.log("Image loaded successfully")}
                  />
                )}

                {/* Type Badge */}
                <Box
                  sx={{
                    position: "absolute",
                    top: 16,
                    right: 16,
                    backgroundColor: "rgba(0, 0, 0, 0.7)",
                    color: "white",
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  {getTypeIcon(galleryItem.type)}
                  <Typography variant="body2" fontWeight="bold">
                    {galleryItem.type.toUpperCase()}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Item Details */}
          <Card
            sx={{
              backgroundColor: "white",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
              border: "1px solid #e0e0e0",
              borderLeft: "6px solid #6B4E3D",
            }}
          >
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 800 }}>
                Item Details
              </Typography>

              {galleryItem.description && (
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: "#faf6f2",
                    border: "1px dashed #e0d6c8",
                    mb: 2,
                  }}
                >
                  <Typography variant="body1" sx={{ color: "text.secondary", whiteSpace: "pre-wrap" }}>
                    {galleryItem.description}
                  </Typography>
                </Box>
              )}

              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mb: 2 }}>
                <Chip
                  label={galleryItem.type}
                  color={getTypeColor(galleryItem.type)}
                  size="small"
                  sx={{ textTransform: "capitalize" }}
                />
                <Chip
                  label={galleryItem.category}
                  color={getCategoryColor(galleryItem.category)}
                  size="small"
                  sx={{ textTransform: "capitalize" }}
                />
                <Chip
                  label={galleryItem.isActive ? "Active" : "Inactive"}
                  color={galleryItem.isActive ? "success" : "default"}
                  size="small"
                />
                {galleryItem.isFeatured && (
                  <Chip
                    label="Featured"
                    color="warning"
                    size="small"
                    icon={<Star />}
                  />
                )}
                {galleryItem.location && (
                  <Chip label={`Location: ${galleryItem.location}`} size="small" />
                )}
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Created
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {formatDate(galleryItem.createdAt)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Updated
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {formatDate(galleryItem.updatedAt)}
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              {/* File Information */}
              <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 800 }}>
                File Information
              </Typography>

              <Stack spacing={1}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    File Size:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {formatFileSize(galleryItem.fileSize)}
                  </Typography>
                </Box>

                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    MIME Type:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {galleryItem.mimeType}
                  </Typography>
                </Box>

                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Original Name:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {galleryItem.originalName}
                  </Typography>
                </Box>

                {galleryItem.width && galleryItem.height && (
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Dimensions:
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {galleryItem.width} × {galleryItem.height}
                    </Typography>
                  </Box>
                )}

                {galleryItem.duration && (
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Duration:
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {Math.round(galleryItem.duration)}s
                    </Typography>
                  </Box>
                )}
              </Stack>

              {/* Tags */}
              {galleryItem.tags && galleryItem.tags.length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Box>
                    <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 800 }}>
                      Tags
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={1}>
                      {galleryItem.tags.map((tag, index) => (
                        <Chip
                          key={index}
                          label={tag}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Box>
                </>
              )}

              {/* Associated Content */}
              {(galleryItem.package || galleryItem.destination) && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Box>
                    <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 800 }}>
                      Associated Content
                    </Typography>
                    {galleryItem.package && (
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Folder color="action" />
                        <Typography variant="body2">
                          Package: {galleryItem.package.title}
                        </Typography>
                      </Box>
                    )}
                    {galleryItem.destination && (
                      <Box display="flex" alignItems="center" gap={1}>
                        <LocationOn color="action" />
                        <Typography variant="body2">
                          Destination: {galleryItem.destination.title}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </>
              )}

              {/* Download Button */}
              <Box sx={{ mt: 3 }}>
                <Button
                  variant="outlined"
                  startIcon={<CloudDownload />}
                  href={galleryItem.type === "video" ? getVideoUrl(galleryItem.filePath) : buildImageUrl(galleryItem.filePath)}
                  target="_blank"
                  rel="noopener noreferrer"
                  fullWidth
                  sx={{ mb: 1 }}
                >
                  Download {galleryItem.type === "video" ? "Video" : "Image"}
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={testFileAccess}
                  fullWidth
                >
                  Test File Access
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Stack>
      </Container>
    </Box>
  );
};

export default GalleryView;