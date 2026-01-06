import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  Grid,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
} from "@mui/icons-material";
import { Tabs, Tab } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import Swal from "sweetalert2";

const PublicMembers = () => {
  const theme = useTheme();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberForm, setMemberForm] = useState({
    status: "Pending",
  });
  const [activeTab, setActiveTab] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalMembers, setTotalMembers] = useState(0);
  const [tabCounts, setTabCounts] = useState({
    all: 0,
    Pending: 0,
    Approved: 0,
    Rejected: 0,
  });

  // Status tabs configuration
  const statusTabs = [
    { label: "All Applications", value: "all", count: tabCounts.all },
    { label: "Pending", value: "Pending", count: tabCounts.Pending },
    { label: "Approved", value: "Approved", count: tabCounts.Approved },
    { label: "Rejected", value: "Rejected", count: tabCounts.Rejected },
  ];

  useEffect(() => {
    fetchMembers();
  }, [page, rowsPerPage, activeTab]);

  // Fetch all members for tab counts on component mount and when activeTab changes
  useEffect(() => {
    fetchAllMembersForCounts();
  }, [activeTab]);

  const fetchMembers = async () => {
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
      });

      const currentStatus = statusTabs[activeTab]?.value;
      if (currentStatus && currentStatus !== "all") {
        queryParams.append("status", currentStatus);
      }

      const response = await fetch(`/api/members?${queryParams}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setMembers(data.data || []);
        setTotalMembers(data.pagination?.total || 0);
        // Update tab counts after fetching members to reflect any new members
        fetchAllMembersForCounts();
      } else {
        setError(
          "Failed to fetch applications: " + (data.message || "Unknown error")
        );
      }
    } catch (err) {
      setError("Error fetching applications: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllMembersForCounts = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`/api/members?limit=1000`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        updateTabCounts(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching member counts:", err);
    }
  };

  const updateTabCounts = (membersData) => {
    const counts = {
      all: 0,
      Pending: 0,
      Approved: 0,
      Rejected: 0,
    };

    membersData.forEach((member) => {
      counts.all++;
      if (counts.hasOwnProperty(member.status)) {
        counts[member.status]++;
      }
    });

    setTabCounts(counts);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return "warning";
      case "Approved":
        return "success";
      case "Rejected":
        return "error";
      default:
        return "default";
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setPage(0);
  };

  const handleViewMember = (member) => {
    try {
      setSelectedMember(member);
      setOpenViewDialog(true);
    } catch (error) {
      console.error("Error in handleViewMember:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to open view dialog. Please try again.",
        customClass: {
          container: "swal-z-index-fix",
        },
        didOpen: () => {
          const swalContainer = document.querySelector(".swal-z-index-fix");
          if (swalContainer) {
            swalContainer.style.zIndex = "9999";
          }
        },
      });
    }
  };

  const handleEditMember = (member) => {
    try {
      setSelectedMember(member);
      setMemberForm({
        status: member.status || "Pending",
      });
      setOpenEditDialog(true);
    } catch (error) {
      console.error("Error in handleEditMember:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to open edit dialog. Please try again.",
        customClass: {
          container: "swal-z-index-fix",
        },
        didOpen: () => {
          const swalContainer = document.querySelector(".swal-z-index-fix");
          if (swalContainer) {
            swalContainer.style.zIndex = "9999";
          }
        },
      });
    }
  };

  const handleUpdateMember = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        setError("No authentication token found. Please login again.");
        return;
      }

      const response = await fetch(`/api/members/${selectedMember.id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: memberForm.status }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to update application status"
        );
      }

      // Reset form and close dialog
      setOpenEditDialog(false);
      setSelectedMember(null);
      setMemberForm({
        status: "Pending",
      });

      // Refresh members list
      fetchMembers();
      fetchAllMembersForCounts();

      Swal.fire({
        icon: "success",
        title: "Status Updated!",
        text: `Application status has been updated to ${memberForm.status}.`,
        timer: 1500,
        showConfirmButton: false,
        customClass: {
          container: "swal-z-index-fix",
        },
        didOpen: () => {
          const swalContainer = document.querySelector(".swal-z-index-fix");
          if (swalContainer) {
            swalContainer.style.zIndex = "9999";
          }
        },
      });
    } catch (err) {
      console.error("Error updating member status:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to update application status. Please try again.",
        customClass: {
          container: "swal-z-index-fix",
        },
        didOpen: () => {
          const swalContainer = document.querySelector(".swal-z-index-fix");
          if (swalContainer) {
            swalContainer.style.zIndex = "9999";
          }
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (memberId, newStatus) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        setError("No authentication token found. Please login again.");
        return;
      }

      const response = await fetch(`/api/members/${memberId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to update member status");
      }

      // Refresh members list
      fetchMembers();
      fetchAllMembersForCounts();

      Swal.fire({
        icon: "success",
        title: "Status Updated!",
        text: `Application status has been updated to ${newStatus}.`,
        timer: 1500,
        showConfirmButton: false,
        customClass: {
          container: "swal-z-index-fix",
        },
        didOpen: () => {
          const swalContainer = document.querySelector(".swal-z-index-fix");
          if (swalContainer) {
            swalContainer.style.zIndex = "9999";
          }
        },
      });
    } catch (err) {
      console.error("Error updating member status:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to update application status. Please try again.",
        customClass: {
          container: "swal-z-index-fix",
        },
        didOpen: () => {
          const swalContainer = document.querySelector(".swal-z-index-fix");
          if (swalContainer) {
            swalContainer.style.zIndex = "9999";
          }
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMember = async (member) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Do you want to delete the application from "${member.full_name}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
      customClass: {
        container: "swal-z-index-fix",
      },
      didOpen: () => {
        const swalContainer = document.querySelector(".swal-z-index-fix");
        if (swalContainer) {
          swalContainer.style.zIndex = "9999";
        }
      },
    });

    if (result.isConfirmed) {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        if (!token) {
          setError("No authentication token found. Please login again.");
          return;
        }

        const response = await fetch(`/api/members/${member.id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to delete member");
        }

        // Refresh members list
        fetchMembers();
        fetchAllMembersForCounts();

        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Application has been deleted successfully.",
          timer: 1500,
          showConfirmButton: false,
          customClass: {
            container: "swal-z-index-fix",
          },
          didOpen: () => {
            const swalContainer = document.querySelector(".swal-z-index-fix");
            if (swalContainer) {
              swalContainer.style.zIndex = "9999";
            }
          },
        });
      } catch (err) {
        console.error("Error deleting member:", err);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to delete application. Please try again.",
          customClass: {
            container: "swal-z-index-fix",
          },
          didOpen: () => {
            const swalContainer = document.querySelector(".swal-z-index-fix");
            if (swalContainer) {
              swalContainer.style.zIndex = "9999";
            }
          },
        });
      } finally {
        setLoading(false);
      }
    }
  };

  if (error) {
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
          background: "rgba(255, 255, 255, 0.95)",
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
                Agent Applications Management
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Manage agent applications from the public portal
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Content Section */}
        <Box
          sx={{ p: { xs: 1, sm: 2, md: 3 }, minHeight: "calc(100vh - 200px)" }}
        >
          {/* Status Tabs */}
          <Box mb={3}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                "& .MuiTabs-indicator": {
                  backgroundColor: "#B85C38",
                  height: 3,
                  borderRadius: "3px 3px 0 0",
                },
                "& .MuiTab-root": {
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  minHeight: 48,
                  color: "#666",
                  "&.Mui-selected": {
                    color: "#B85C38",
                  },
                  "&:hover": {
                    color: "#B85C38",
                    backgroundColor: "rgba(184, 92, 56, 0.04)",
                  },
                },
              }}
            >
              {statusTabs.map((tab, index) => (
                <Tab
                  key={tab.value}
                  label={
                    <Box display="flex" alignItems="center" gap={1}>
                      <span>{tab.label}</span>
                      <Chip
                        label={tab.count}
                        size="small"
                        sx={{
                          backgroundColor:
                            activeTab === index ? "#B85C38" : "#e0e0e0",
                          color: activeTab === index ? "white" : "#666",
                          fontWeight: 600,
                          fontSize: "0.75rem",
                          height: 20,
                          minWidth: 20,
                        }}
                      />
                    </Box>
                  }
                />
              ))}
            </Tabs>
          </Box>

          {/* Members Table */}
          <TableContainer
            sx={{
              borderRadius: 3,
              overflowX: "auto",
              backgroundColor: "rgba(255, 255, 255, 0.8)",
              border: "1px solid rgba(184, 92, 56, 0.1)",
              "&::-webkit-scrollbar": {
                height: 8,
              },
              "&::-webkit-scrollbar-track": {
                backgroundColor: "rgba(184, 92, 56, 0.1)",
                borderRadius: 4,
              },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "rgba(184, 92, 56, 0.3)",
                borderRadius: 4,
                "&:hover": {
                  backgroundColor: "rgba(184, 92, 56, 0.5)",
                },
              },
            }}
          >
            <Table sx={{ minWidth: 700 }}>
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
                    },
                  }}
                >
                  <TableCell>No</TableCell>
                  <TableCell>Applicant Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Business Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
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
                      <Typography color="error" variant="h6">
                        {error}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : members.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography variant="h6" color="text.secondary">
                        No applications found.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  members.map((member, idx) => (
                    <TableRow
                      key={member.id}
                      sx={{
                        "&:nth-of-type(even)": {
                          backgroundColor: "rgba(184, 92, 56, 0.02)",
                        },
                        "&:hover": {
                          backgroundColor: "rgba(184, 92, 56, 0.08)",
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
                      <TableCell sx={{ fontWeight: 600, color: "#B85C38" }}>
                        {page * rowsPerPage + idx + 1}
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          fontWeight="600"
                          sx={{ color: "#2c3e50" }}
                        >
                          {member.full_name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <EmailIcon sx={{ color: "#3498db", fontSize: 18 }} />
                          <Typography variant="body2" sx={{ color: "#7f8c8d" }}>
                            {member.email}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: "#7f8c8d" }}>
                          {member.business_type || "N/A"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={member.status}
                          color={getStatusColor(member.status)}
                          size="small"
                          sx={{
                            textTransform: "capitalize",
                            fontWeight: 600,
                            borderRadius: 2,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={0.5}>
                          <Tooltip title="View Application Details" arrow>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewMember(member);
                              }}
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
                          <Tooltip title="Edit Application" arrow>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditMember(member);
                              }}
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
                          <Tooltip title="Delete Application" arrow>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteMember(member);
                              }}
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
            count={totalMembers}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
            sx={{
              backgroundColor: "rgba(255, 255, 255, 0.8)",
              borderTop: "1px solid rgba(184, 92, 56, 0.1)",
              "& .MuiTablePagination-toolbar": {
                color: "#B85C38",
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

        {/* View Member Dialog */}
        <Dialog
          open={openViewDialog && !!selectedMember}
          onClose={() => {
            setOpenViewDialog(false);
            setSelectedMember(null);
          }}
          maxWidth={false}
          sx={{
            "& .MuiDialog-paper": {
              borderRadius: 4,
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
              maxHeight: "90vh",
              maxWidth: "50%",
              width: "50%",
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(184, 92, 56, 0.2)",
              overflow: "hidden",
            },
            "& .MuiBackdrop-root": {
              backgroundColor: "rgba(0, 0, 0, 0.5)",
            },
          }}
        >
          <DialogTitle
            sx={{
              background: "linear-gradient(135deg, #6B4E3D 0%, #B85C38 100%)",
              color: "white",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              gap: 2,
              p: 3,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <PersonIcon sx={{ fontSize: 28 }} />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                Agent Application Details
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                View complete application information
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent
            sx={{ p: 3, pt: 3, maxHeight: "70vh", overflowY: "auto" }}
          >
            {selectedMember ? (
              <Box>
                {/* Member Header Section */}
                <Box
                  sx={{
                    background:
                      "linear-gradient(135deg, #6B4E3D 0%, #B85C38 100%)",
                    borderRadius: 3,
                    p: 3,
                    mb: 4,
                    mt: 2,
                    position: "relative",
                    overflow: "hidden",
                    color: "white",
                  }}
                >
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 800,
                      mb: 1,
                      textShadow: "0 2px 4px rgba(0,0,0,0.3)",
                    }}
                  >
                    {selectedMember.full_name}
                  </Typography>
                  <Box display="flex" gap={2} flexWrap="wrap">
                    <Chip
                      label={selectedMember.business_type || "N/A"}
                      sx={{
                        backgroundColor: "rgba(255, 255, 255, 0.2)",
                        color: "white",
                        fontWeight: 600,
                      }}
                    />
                    <Chip
                      label={selectedMember.status}
                      sx={{
                        backgroundColor: "rgba(255, 255, 255, 0.2)",
                        color: "white",
                        fontWeight: 600,
                      }}
                    />
                  </Box>
                </Box>

                {/* Contact Information Cards */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6}>
                    <Card
                      sx={{
                        background:
                          "linear-gradient(135deg, #B85C38 0%, #8B4225 100%)",
                        color: "white",
                        borderRadius: 3,
                        p: 2,
                        height: "100%",
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={2}>
                        <EmailIcon sx={{ fontSize: 24 }} />
                        <Box>
                          <Typography variant="caption" sx={{ opacity: 0.8 }}>
                            Email
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {selectedMember.email}
                          </Typography>
                        </Box>
                      </Box>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Card
                      sx={{
                        background:
                          "linear-gradient(135deg, #6B4E3D 0%, #3D2817 100%)",
                        color: "white",
                        borderRadius: 3,
                        p: 2,
                        height: "100%",
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={2}>
                        <PhoneIcon sx={{ fontSize: 24 }} />
                        <Box>
                          <Typography variant="caption" sx={{ opacity: 0.8 }}>
                            Phone
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {selectedMember.phone}
                          </Typography>
                        </Box>
                      </Box>
                    </Card>
                  </Grid>
                </Grid>

                {/* Business Information */}
                <Box
                  sx={{
                    background: "rgba(255, 255, 255, 0.8)",
                    borderRadius: 3,
                    p: 3,
                    mb: 3,
                    border: "1px solid rgba(184, 92, 56, 0.1)",
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      color: "#B85C38",
                      mb: 2,
                    }}
                  >
                    Business Information
                  </Typography>

                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">
                        Company Name
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedMember.company_name || "N/A"}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">
                        Business Type
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedMember.business_type || "N/A"}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">
                        Years of Experience
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedMember.years_of_experience
                          ? `${selectedMember.years_of_experience} years`
                          : "N/A"}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">
                        Motivation
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{ fontWeight: 500, whiteSpace: "pre-wrap" }}
                      >
                        {selectedMember.motivation || "N/A"}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">
                        Target Market
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedMember.target_market || "N/A"}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">
                        Application Submitted
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {selectedMember.createdAt
                          ? (() => {
                              try {
                                const date = new Date(selectedMember.createdAt);
                                return !isNaN(date.getTime())
                                  ? date.toLocaleString()
                                  : "N/A";
                              } catch (e) {
                                return "N/A";
                              }
                            })()
                          : "N/A"}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              </Box>
            ) : (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  No application data available
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions
            sx={{ p: 3, gap: 2, backgroundColor: "rgba(184, 92, 56, 0.05)" }}
          >
            <Button
              onClick={() => {
                setOpenViewDialog(false);
                setSelectedMember(null);
              }}
              variant="outlined"
              sx={{
                borderColor: "#B85C38",
                color: "#B85C38",
                fontWeight: 600,
                borderRadius: 2,
                px: 3,
                py: 1,
                "&:hover": {
                  borderColor: "#8B4225",
                  backgroundColor: "rgba(184, 92, 56, 0.1)",
                },
              }}
            >
              Close
            </Button>
            {selectedMember && (
              <>
                <Button
                  onClick={() => {
                    setOpenViewDialog(false);
                    handleEditMember(selectedMember);
                  }}
                  variant="contained"
                  sx={{
                    backgroundColor: "#3498db",
                    fontWeight: 600,
                    borderRadius: 2,
                    px: 3,
                    py: 1,
                    "&:hover": {
                      backgroundColor: "#2980b9",
                    },
                  }}
                >
                  Edit Application
                </Button>
                {selectedMember.status === "Pending" && (
                  <Button
                    onClick={() => {
                      handleUpdateStatus(selectedMember.id, "Approved");
                      setOpenViewDialog(false);
                      setSelectedMember(null);
                    }}
                    variant="contained"
                    sx={{
                      backgroundColor: "#27ae60",
                      fontWeight: 600,
                      borderRadius: 2,
                      px: 3,
                      py: 1,
                      "&:hover": {
                        backgroundColor: "#229954",
                      },
                    }}
                  >
                    Approve
                  </Button>
                )}
              </>
            )}
          </DialogActions>
        </Dialog>

        {/* Edit Member Dialog */}
        <Dialog
          open={openEditDialog && !!selectedMember}
          onClose={() => {
            setOpenEditDialog(false);
            setSelectedMember(null);
            setMemberForm({
              status: "Pending",
            });
          }}
          maxWidth={false}
          sx={{
            "& .MuiDialog-paper": {
              borderRadius: 4,
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
              maxHeight: "90vh",
              maxWidth: "50%",
              width: "50%",
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(184, 92, 56, 0.2)",
              overflow: "hidden",
            },
            "& .MuiBackdrop-root": {
              backgroundColor: "rgba(0, 0, 0, 0.5)",
            },
          }}
        >
          <DialogTitle
            sx={{
              background: "linear-gradient(135deg, #6B4E3D 0%, #B85C38 100%)",
              color: "white",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              gap: 2,
              p: 3,
            }}
          >
            <EditIcon sx={{ fontSize: 28 }} />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                Manage Application Status
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                Approve or reject application for agent program
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent
            sx={{ p: 3, pt: 3, maxHeight: "70vh", overflowY: "auto" }}
          >
            <Stack spacing={3} sx={{ mt: 1 }}>
              {/* Display Application Details (Read-only) */}
              <Box
                sx={{
                  p: 2,
                  backgroundColor: "rgba(184, 92, 56, 0.05)",
                  borderRadius: 2,
                  border: "1px solid rgba(184, 92, 56, 0.1)",
                }}
              >
                <Typography variant="h6" gutterBottom>
                  {selectedMember?.full_name}
                </Typography>
                <Stack spacing={1}>
                  <Typography variant="body2">
                    <strong>Email:</strong> {selectedMember?.email || "-"}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Phone:</strong> {selectedMember?.phone || "-"}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Business Type:</strong>{" "}
                    {selectedMember?.business_type || "-"}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Company:</strong>{" "}
                    {selectedMember?.company_name || "-"}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Years of Experience:</strong>{" "}
                    {selectedMember?.years_of_experience
                      ? `${selectedMember.years_of_experience} years`
                      : "-"}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Target Market:</strong>{" "}
                    {selectedMember?.target_market || "-"}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Current Status:</strong>{" "}
                    {selectedMember?.status || "-"}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Submitted:</strong>{" "}
                    {selectedMember?.createdAt
                      ? new Date(selectedMember.createdAt).toLocaleString()
                      : "-"}
                  </Typography>
                </Stack>
                {selectedMember?.motivation && (
                  <Typography
                    variant="body2"
                    sx={{ color: "#666", fontStyle: "italic", mt: 2 }}
                  >
                    "{selectedMember.motivation}"
                  </Typography>
                )}
              </Box>

              {/* Status Field (Only Editable Field) */}
              <FormControl fullWidth variant="outlined" size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={memberForm.status}
                  onChange={(e) =>
                    setMemberForm({ ...memberForm, status: e.target.value })
                  }
                  label="Status"
                  required
                >
                  <MenuItem value="Pending">Pending</MenuItem>
                  <MenuItem value="Approved">Approved</MenuItem>
                  <MenuItem value="Rejected">Rejected</MenuItem>
                </Select>
              </FormControl>

              <Typography
                variant="body2"
                sx={{ color: "#666", fontStyle: "italic", textAlign: "center" }}
              >
                Note: Only the status can be modified. The application content
                is preserved as submitted by the applicant.
              </Typography>
            </Stack>
          </DialogContent>
          <DialogActions
            sx={{ p: 3, gap: 2, backgroundColor: "rgba(184, 92, 56, 0.05)" }}
          >
            <Button
              onClick={() => {
                setOpenEditDialog(false);
                setSelectedMember(null);
                setMemberForm({
                  status: "Pending",
                });
              }}
              variant="outlined"
              sx={{
                borderColor: "#B85C38",
                color: "#B85C38",
                fontWeight: 600,
                borderRadius: 2,
                px: 3,
                py: 1,
                "&:hover": {
                  borderColor: "#8B4225",
                  backgroundColor: "rgba(184, 92, 56, 0.1)",
                },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateMember}
              variant="contained"
              disabled={loading}
              sx={{
                background: "linear-gradient(135deg, #B85C38 0%, #6B4E3D 100%)",
                fontWeight: 600,
                borderRadius: 2,
                px: 3,
                py: 1,
                "&:hover": {
                  background:
                    "linear-gradient(135deg, #8B4225 0%, #3D2817 100%)",
                },
              }}
            >
              {loading ? <CircularProgress size={20} /> : "Update Status"}
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Box>
  );
};

export default PublicMembers;
