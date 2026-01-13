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
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Stack,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Grid,
} from "@mui/material";
import {
  ArrowBack,
  Reply,
  ContactMail,
  Person,
  Email,
  Send,
} from "@mui/icons-material";
import Swal from "sweetalert2";

const PackageInquiryReply = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [inquiry, setInquiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    admin_reply: "",
    status: "",
  });

  useEffect(() => {
    fetchInquiry();
  }, [id]);

  const fetchInquiry = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authentication token found. Please login again.");
        return;
      }

      const res = await fetch(`/api/package-inquiries/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to load inquiry");
      }

      setInquiry(data.data);
      // Pre-fill existing reply if any
      if (data.data.admin_reply) {
        setFormData((prev) => ({
          ...prev,
          admin_reply: data.data.admin_reply,
        }));
      }
      // Set current status as default
      setFormData((prev) => ({
        ...prev,
        status: data.data.status || "",
      }));
    } catch (err) {
      setError(err.message || "Failed to load inquiry");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate reply is provided
    if (!formData.admin_reply.trim()) {
      Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Please provide a reply message.",
      });
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authentication token found. Please login again.");
        return;
      }

      // Prepare request body
      const requestBody = {
        admin_reply: formData.admin_reply.trim(),
      };

      // Only include status if it's different from current or explicitly set
      if (formData.status && formData.status !== inquiry?.status) {
        requestBody.status = formData.status;
      }

      const res = await fetch(`/api/package-inquiries/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to send reply");
      }

      // Show success message
      await Swal.fire({
        icon: "success",
        title: "Reply Sent",
        text: "Your reply has been sent successfully.",
        timer: 1500,
        showConfirmButton: false,
      });

      // Redirect to inquiry view
      navigate(`/package-inquiries/${id}`);
    } catch (err) {
      setError(err.message || "Failed to send reply");
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Failed to send reply",
      });
    } finally {
      setSubmitting(false);
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

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="60vh"
      >
        <CircularProgress sx={{ color: "#6B4E3D" }} />
      </Box>
    );
  }

  if (error && !inquiry) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || "Inquiry not found"}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate("/package-inquiries")}
        >
          Back to Inquiries
        </Button>
      </Container>
    );
  }

  const statusColors = inquiry
    ? getStatusColor(inquiry.status)
    : { color: "#95a5a6", bg: "#ecf0f1" };

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
          <Box
            display="flex"
            alignItems="center"
            gap={2}
            position="relative"
            zIndex={1}
          >
            <IconButton
              onClick={() => navigate(`/package-inquiries/${id}`)}
              sx={{
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                color: "white",
                "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.3)" },
              }}
            >
              <ArrowBack />
            </IconButton>
            <Reply sx={{ fontSize: 40 }} />
            <Box flex={1}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  textShadow: "0 2px 4px rgba(0,0,0,0.3)",
                }}
              >
                Reply to Inquiry
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                {inquiry?.package_title || "Package Inquiry"}
              </Typography>
              {inquiry && (
                <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
                  From: {inquiry.name} • {formatDate(inquiry.created_at)}
                </Typography>
              )}
            </Box>
            {inquiry && (
              <Chip
                label={inquiry.status?.toUpperCase() || "PENDING"}
                sx={{
                  backgroundColor: statusColors.bg,
                  color: statusColors.color,
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
              />
            )}
          </Box>
        </Box>

        <Stack spacing={2}>
          {/* Inquiry Summary */}
          {inquiry && (
            <Card
              sx={{
                backgroundColor: "white",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
                border: "1px solid #e0e0e0",
                borderLeft: "6px solid #B85C38",
              }}
            >
              <CardContent>
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
                >
                  <ContactMail sx={{ color: "#B85C38" }} />
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    Inquiry Summary
                  </Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={4}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 1,
                      }}
                    >
                      <Person sx={{ fontSize: 18, color: "text.secondary" }} />
                      <Typography
                        variant="body2"
                        sx={{ color: "text.secondary" }}
                      >
                        Customer
                      </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {inquiry.name}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 1,
                      }}
                    >
                      <Email sx={{ fontSize: 18, color: "text.secondary" }} />
                      <Typography
                        variant="body2"
                        sx={{ color: "text.secondary" }}
                      >
                        Email
                      </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {inquiry.email}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary" }}
                    >
                      Package
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {inquiry.package_title}
                    </Typography>
                  </Grid>
                </Grid>
                {inquiry.message && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary", mb: 1 }}
                    >
                      Customer Message
                    </Typography>
                    <Paper
                      sx={{
                        p: 2,
                        backgroundColor: "#faf6f2",
                        border: "1px dashed #e0d6c8",
                        borderRadius: 1,
                      }}
                    >
                      <Typography
                        variant="body1"
                        sx={{ whiteSpace: "pre-wrap" }}
                      >
                        {inquiry.message}
                      </Typography>
                    </Paper>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Reply Form */}
          <Card
            sx={{
              backgroundColor: "white",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
              border: "1px solid #e0e0e0",
              borderLeft: "6px solid #3498db",
            }}
          >
            <CardContent>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
              >
                <Reply sx={{ color: "#3498db" }} />
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  Your Reply
                </Typography>
              </Box>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <form onSubmit={handleSubmit}>
                <Stack spacing={2}>
                  <TextField
                    fullWidth
                    multiline
                    rows={8}
                    label="Reply Message"
                    placeholder="Type your reply to the customer here..."
                    value={formData.admin_reply}
                    onChange={(e) =>
                      handleInputChange("admin_reply", e.target.value)
                    }
                    required
                    helperText="This message will be sent to the customer"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        backgroundColor: "#fafafa",
                      },
                    }}
                  />

                  <FormControl fullWidth>
                    <InputLabel>Update Status (Optional)</InputLabel>
                    <Select
                      value={formData.status}
                      label="Update Status (Optional)"
                      onChange={(e) =>
                        handleInputChange("status", e.target.value)
                      }
                    >
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="replied">Replied</MenuItem>
                      <MenuItem value="closed">Closed</MenuItem>
                    </Select>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.secondary",
                        mt: 0.5,
                        display: "block",
                      }}
                    >
                      Note: Status will automatically be set to "Replied" when
                      you send a reply (unless already "Closed")
                    </Typography>
                  </FormControl>

                  <Box
                    sx={{
                      display: "flex",
                      gap: 2,
                      justifyContent: "flex-end",
                      mt: 2,
                    }}
                  >
                    <Button
                      variant="outlined"
                      onClick={() => navigate(`/package-inquiries/${id}`)}
                      disabled={submitting}
                      sx={{
                        borderColor: "#6B4E3D",
                        color: "#6B4E3D",
                        "&:hover": {
                          borderColor: "#8B4225",
                          backgroundColor: "rgba(107, 78, 61, 0.04)",
                        },
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={
                        submitting ? <CircularProgress size={20} /> : <Send />
                      }
                      disabled={submitting || !formData.admin_reply.trim()}
                      sx={{
                        background:
                          "linear-gradient(135deg, #6B4E3D 0%, #B85C38 100%)",
                        "&:hover": {
                          background:
                            "linear-gradient(135deg, #8B4225 0%, #6B4E3D 100%)",
                        },
                        "&:disabled": {
                          background: "#e0e0e0",
                        },
                        px: 4,
                      }}
                    >
                      {submitting ? "Sending..." : "Send Reply"}
                    </Button>
                  </Box>
                </Stack>
              </form>
            </CardContent>
          </Card>
        </Stack>
      </Container>
    </Box>
  );
};

export default PackageInquiryReply;
