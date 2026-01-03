import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  CircularProgress,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Tooltip,
  InputAdornment,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Image as ImageIcon,
  VideoLibrary as VideoIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import Swal from "sweetalert2";

const GalleryList = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [galleryItems, setGalleryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [isActiveFilter, setIsActiveFilter] = useState("");
  const [isFeaturedFilter, setIsFeaturedFilter] = useState("");
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchGalleryItems();
    fetchStats();
  }, [page, rowsPerPage, searchTerm, typeFilter, categoryFilter, isActiveFilter, isFeaturedFilter]);

  const fetchGalleryItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");

      if (!token) {
        setError("No authentication token found. Please login again.");
        return;
      }

      const queryParams = new URLSearchParams({
        page: (page + 1).toString(),
        limit: rowsPerPage.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(typeFilter && { type: typeFilter }),
        ...(categoryFilter && { category: categoryFilter }),
        ...(isActiveFilter !== "" && { isActive: isActiveFilter }),
        ...(isFeaturedFilter !== "" && { isFeatured: isFeaturedFilter }),
      });

      const response = await fetch(`/api/gallery?${queryParams}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setGalleryItems(data.data.items || []);
        setTotalItems(data.data.pagination?.totalItems || 0);
      } else {
        setError(
          "Failed to fetch gallery items: " + (data.message || "Unknown error")
        );
      }
    } catch (err) {
      setError("Error fetching gallery items: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch("/api/gallery/stats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const buildImageUrl = (path) => {
    if (!path) return null;
    const normalized = path.replace(/\\/g, "/");
    if (normalized.startsWith("http")) return normalized;
    if (normalized.startsWith("/")) return normalized;
    return `/${normalized}`;
  };

  const getTypeIcon = (type) => {
    return type === "video" ? <VideoIcon /> : <ImageIcon />;
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

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewItem = (item) => {
    navigate(`/gallery/${item.id}`);
  };

  const handleEditItem = (item) => {
    navigate(`/gallery/${item.id}/edit`);
  };

  const handleDeleteItem = async (item) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Do you want to delete "${item.title}"? This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`/api/gallery/${item.id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (data.success) {
          Swal.fire("Deleted!", "Gallery item has been deleted.", "success");
          fetchGalleryItems(); // Refresh the list
        } else {
          Swal.fire("Error!", data.message || "Failed to delete gallery item.", "error");
        }
      } catch (error) {
        console.error("Error deleting gallery item:", error);
        Swal.fire("Error!", "Failed to delete gallery item.", "error");
      }
    }
  };

  const handleCreateItem = () => {
    navigate("/gallery/create");
  };

  const clearFilters = () => {
    setSearchTerm("");
    setTypeFilter("");
    setCategoryFilter("");
    setIsActiveFilter("");
    setIsFeaturedFilter("");
    setPage(0);
  };

  if (error && galleryItems.length === 0) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

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
                Gallery Management
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Manage tour and travel images and videos
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateItem}
              sx={{
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.3)",
                  transform: "translateY(-2px)",
                },
                transition: "all 0.3s ease",
                fontWeight: 600,
                px: 3,
              }}
            >
              Add Gallery Item
            </Button>
          </Box>
        </Box>

        {/* Content Section */}
        <Box
          sx={{ p: { xs: 1, sm: 2, md: 3 }, minHeight: "calc(100vh - 200px)" }}
        >


          {/* Gallery Items Table */}
          <TableContainer
            sx={{
              borderRadius: 3,
              overflowX: "auto",
              backgroundColor: "rgba(255, 255, 255, 0.8)",
              border: "1px solid rgba(102, 126, 234, 0.1)",
              "&::-webkit-scrollbar": {
                height: 8,
              },
              "&::-webkit-scrollbar-track": {
                backgroundColor: "rgba(102, 126, 234, 0.1)",
                borderRadius: 4,
              },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "rgba(102, 126, 234, 0.3)",
                borderRadius: 4,
                "&:hover": {
                  backgroundColor: "rgba(102, 126, 234, 0.5)",
                },
              },
            }}
          >
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow
                  sx={{
                    background:
                      "linear-gradient(135deg, #6B4E3D 0%, #B85C38 100%)",
                    "& .MuiTableCell-head": {
                      color: "white",
                      fontWeight: 700,
                      fontSize: { xs: "0.8rem", sm: "0.95rem" },
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      border: "none",
                      whiteSpace: "nowrap",
                      textAlign: "center",
                    },
                  }}
                >
                  <TableCell align="center">No</TableCell>
                  <TableCell align="center">Title</TableCell>
                  <TableCell align="center">Type</TableCell>
                  <TableCell align="center">Category</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <CircularProgress sx={{ color: "#B85C38" }} />
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                      </Alert>
                      <Button
                        variant="contained"
                        onClick={fetchGalleryItems}
                        sx={{
                          background:
                            "linear-gradient(135deg, #B85C38 0%, #6B4E3D 100%)",
                          "&:hover": {
                            background:
                              "linear-gradient(135deg, #8B4225 0%, #3D2817 100%)",
                          },
                        }}
                      >
                        Retry
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : galleryItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography variant="h6" color="text.secondary">
                        No gallery items found.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  galleryItems.map((item, idx) => (
                    <TableRow
                      key={item.id}
                      sx={{
                        "&:nth-of-type(even)": {
                          backgroundColor: "rgba(102, 126, 234, 0.02)",
                        },
                        "&:hover": {
                          backgroundColor: "rgba(102, 126, 234, 0.08)",
                          transform: { xs: "none", sm: "scale(1.01)" },
                        },
                        transition: "all 0.2s ease",
                        cursor: "pointer",
                        "& .MuiTableCell-root": {
                          fontSize: { xs: "0.75rem", sm: "0.875rem" },
                          padding: { xs: "8px 4px", sm: "16px" },
                        },
                      }}
                    >
                      <TableCell
                        sx={{ fontWeight: 600, color: "#667eea" }}
                        align="center"
                      >
                        {page * rowsPerPage + idx + 1}
                      </TableCell>
                      <TableCell align="center">
                        <Box display="flex" alignItems="center" gap={1}>
                          {getTypeIcon(item.type)}
                          <Box>
                            <Typography
                              variant="body2"
                              fontWeight="600"
                              sx={{ color: "#2c3e50" }}
                            >
                              {item.title}
                            </Typography>
                            {item.location && (
                              <Typography
                                variant="caption"
                                sx={{ color: "#7f8c8d" }}
                              >
                                📍 {item.location}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={item.type}
                          color={getTypeColor(item.type)}
                          size="small"
                          sx={{
                            textTransform: "capitalize",
                            fontWeight: 600,
                            borderRadius: 2,
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={item.category}
                          color={getCategoryColor(item.category)}
                          size="small"
                          sx={{
                            textTransform: "capitalize",
                            fontWeight: 600,
                            borderRadius: 2,
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box display="flex" flexDirection="column" gap={0.5} alignItems="center">
                          <Chip
                            label={item.isActive ? "Active" : "Inactive"}
                            color={item.isActive ? "success" : "default"}
                            size="small"
                            sx={{
                              fontWeight: 600,
                              borderRadius: 2,
                            }}
                          />
                          {item.isFeatured && (
                            <Chip
                              label="Featured"
                              color="warning"
                              size="small"
                              sx={{
                                fontWeight: 600,
                                borderRadius: 2,
                                fontSize: "0.7rem",
                              }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Box display="flex" gap={0.5} justifyContent="center">
                          <Tooltip title="View Gallery Item" arrow>
                            <IconButton
                              size="small"
                              onClick={() => handleViewItem(item)}
                              sx={{
                                color: "#27ae60",
                                backgroundColor: "rgba(39, 174, 96, 0.1)",
                                "&:hover": {
                                  backgroundColor: "rgba(39, 174, 96, 0.2)",
                                  transform: "scale(1.1)",
                                },
                                transition: "all 0.2s ease",
                                borderRadius: 2,
                              }}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit Gallery Item" arrow>
                            <IconButton
                              size="small"
                              onClick={() => handleEditItem(item)}
                              sx={{
                                color: "#3498db",
                                backgroundColor: "rgba(52, 152, 219, 0.1)",
                                "&:hover": {
                                  backgroundColor: "rgba(52, 152, 219, 0.2)",
                                  transform: "scale(1.1)",
                                },
                                transition: "all 0.2s ease",
                                borderRadius: 2,
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Gallery Item" arrow>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteItem(item)}
                              sx={{
                                color: "#e74c3c",
                                backgroundColor: "rgba(231, 76, 60, 0.1)",
                                "&:hover": {
                                  backgroundColor: "rgba(231, 76, 60, 0.2)",
                                  transform: "scale(1.1)",
                                },
                                transition: "all 0.2s ease",
                                borderRadius: 2,
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={totalItems}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
            sx={{
              backgroundColor: "rgba(255, 255, 255, 0.8)",
              borderTop: "1px solid rgba(102, 126, 234, 0.1)",
              "& .MuiTablePagination-toolbar": {
                color: "#667eea",
                fontWeight: 600,
              },
              "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
                {
                  color: "#2c3e50",
                  fontWeight: 600,
                },
            }}
          />
        </Box>
      </Paper>
    </Box>
  );
};

export default GalleryList;
