import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Chip,
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
  IconButton,
  Tooltip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Reply as ReplyIcon,
} from "@mui/icons-material";
import Swal from "sweetalert2";

const PackageInquiries = () => {
  const navigate = useNavigate();
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalInquiries, setTotalInquiries] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchInquiries();
  }, [page, rowsPerPage, statusFilter, searchQuery]);

  const fetchInquiries = async () => {
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
        sortBy: "created_at",
        sortOrder: "DESC",
      });

      if (statusFilter) {
        queryParams.append("status", statusFilter);
      }

      if (searchQuery) {
        queryParams.append("search", searchQuery);
      }

      const response = await fetch(`/api/package-inquiries?${queryParams}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setInquiries(data.data || []);
        setTotalInquiries(data.pagination?.total || data.data?.length || 0);
      } else {
        setError(data.message || "Failed to fetch inquiries");
      }
    } catch (err) {
      setError(err.message || "Error fetching inquiries");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (inquiry) => {
    const result = await Swal.fire({
      title: "Delete inquiry?",
      text: `Inquiry from "${inquiry.name}" will be permanently removed.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authentication token found. Please login again.");
        return;
      }

      const response = await fetch(`/api/package-inquiries/${inquiry.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete inquiry");
      }

      await Swal.fire({
        icon: "success",
        title: "Deleted",
        text: `Inquiry from "${inquiry.name}" removed successfully.`,
        timer: 1400,
        showConfirmButton: false,
      });
      fetchInquiries();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Failed to delete inquiry",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (err) {
      return dateString;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return { color: "#f39c12", bg: "#fef5e7" };
      case "replied":
        return { color: "#3498db", bg: "#ebf5fb" };
      case "closed":
        return { color: "#27ae60", bg: "#eafaf1" };
      default:
        return { color: "#95a5a6", bg: "#ecf0f1" };
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
    setPage(0);
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setPage(0);
  };

  return (
    <Box
      sx={{
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        minHeight: "100vh",
        p: { xs: 0.5, sm: 0.5, md: 0.5 },
      }}
    >
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          overflow: "hidden",
          background: "rgba(255, 255, 255, 0.95)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        }}
      >
        <Box
          sx={{
            background: "linear-gradient(135deg, #6B4E3D 0%, #B85C38 100%)",
            p: 3,
            color: "white",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <Typography
            variant="h4"
            sx={{ fontWeight: 800, textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}
          >
            Package Inquiries
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9 }}>
            Manage and respond to package inquiries from customers
          </Typography>
        </Box>

        <Box sx={{ p: { xs: 1.5, md: 3 } }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Filters */}
          <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
            <TextField
              label="Search"
              variant="outlined"
              size="small"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search by name, email, package..."
              sx={{ minWidth: 200, flexGrow: 1 }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={handleStatusFilterChange}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="replied">Replied</MenuItem>
                <MenuItem value="closed">Closed</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress sx={{ color: "#6B4E3D" }} />
            </Box>
          ) : inquiries.length === 0 ? (
            <Alert severity="info">No inquiries found.</Alert>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight={700}>
                          Customer
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight={700}>
                          Package
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight={700}>
                          Destination
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight={700}>
                          Travelers
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight={700}>
                          Status
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight={700}>
                          Date
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="subtitle2" fontWeight={700}>
                          Actions
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {inquiries.map((inquiry) => {
                      const statusColors = getStatusColor(inquiry.status);
                      return (
                        <TableRow key={inquiry.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {inquiry.name}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {inquiry.email}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {inquiry.package_title}
                            </Typography>
                            {inquiry.package_number && (
                              <Typography variant="caption" color="text.secondary">
                                #{inquiry.package_number}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {inquiry.destination_title || "-"}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {inquiry.number_of_travelers || "-"}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={inquiry.status?.toUpperCase() || "PENDING"}
                              size="small"
                              sx={{
                                backgroundColor: statusColors.bg,
                                color: statusColors.color,
                                fontWeight: 600,
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {formatDate(inquiry.created_at)}
                            </Typography>
                            {inquiry.travel_date && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                display="block"
                              >
                                Travel: {formatDate(inquiry.travel_date)}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() =>
                                  navigate(`/package-inquiries/${inquiry.id}`)
                                }
                                sx={{ color: "#27ae60" }}
                              >
                                <ViewIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {inquiry.status !== "closed" && (
                              <Tooltip title="Reply">
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    navigate(
                                      `/package-inquiries/${inquiry.id}/reply`
                                    )
                                  }
                                  sx={{ color: "#3498db" }}
                                >
                                  <ReplyIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                onClick={() => handleDelete(inquiry)}
                                sx={{ color: "#e74c3c" }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={totalInquiries}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[5, 10, 25, 50]}
              />
            </>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default PackageInquiries;

