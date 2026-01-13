import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
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
  Reply,
  ContactMail,
  Person,
  Email,
  Phone,
  CalendarToday,
  People,
  AttachMoney,
  Description,
  LocationOn,
  Category,
} from "@mui/icons-material";

const PackageInquiryView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [inquiry, setInquiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
    } catch (err) {
      setError(err.message || "Failed to load inquiry");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (value) => {
    if (!value) return "—";
    return new Date(value).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (value) => {
    if (!value) return "—";
    return new Date(value).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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
      <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
        <CircularProgress sx={{ color: "#6B4E3D" }} />
      </Box>
    );
  }

  if (error || !inquiry) {
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

  const statusColors = getStatusColor(inquiry.status);

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
              onClick={() => navigate("/package-inquiries")}
              sx={{
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                color: "white",
                "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.3)" },
              }}
            >
              <ArrowBack />
            </IconButton>
            <ContactMail sx={{ fontSize: 40 }} />
            <Box flex={1}>
              <Typography variant="h4" sx={{ fontWeight: 800, textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}>
                Package Inquiry
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                {inquiry.package_title || "Package Inquiry Details"}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
                From: {inquiry.name} • {formatDate(inquiry.created_at)}
              </Typography>
            </Box>
            <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
              <Chip
                label={inquiry.status?.toUpperCase() || "PENDING"}
                sx={{
                  backgroundColor: statusColors.bg,
                  color: statusColors.color,
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
              />
              {inquiry.status !== "closed" && (
                <Button
                  variant="contained"
                  startIcon={<Reply />}
                  onClick={() => navigate(`/package-inquiries/${inquiry.id}/reply`)}
                  sx={{
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                    color: "white",
                    "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.3)" },
                  }}
                >
                  Reply
                </Button>
              )}
            </Box>
          </Box>
        </Box>

        <Stack spacing={2}>
          {/* Customer Information */}
          <Card
            sx={{
              backgroundColor: "white",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
              border: "1px solid #e0e0e0",
              borderLeft: "6px solid #B85C38",
            }}
          >
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                <Person sx={{ color: "#B85C38" }} />
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  Customer Information
                </Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                    <Person sx={{ fontSize: 18, color: "text.secondary" }} />
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      Name
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {inquiry.name}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                    <Email sx={{ fontSize: 18, color: "text.secondary" }} />
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      Email
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {inquiry.email}
                  </Typography>
                </Grid>
                {inquiry.phone && (
                  <Grid item xs={12} sm={6} md={4}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                      <Phone sx={{ fontSize: 18, color: "text.secondary" }} />
                      <Typography variant="body2" sx={{ color: "text.secondary" }}>
                        Phone
                      </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {inquiry.phone}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>

          {/* Travel Details */}
          <Card
            sx={{
              backgroundColor: "white",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
              border: "1px solid #e0e0e0",
              borderLeft: "6px solid #6B4E3D",
            }}
          >
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                <CalendarToday sx={{ color: "#6B4E3D" }} />
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  Travel Details
                </Typography>
              </Box>
              <Grid container spacing={2}>
                {inquiry.travel_date && (
                  <Grid item xs={12} sm={6} md={4}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                      <CalendarToday sx={{ fontSize: 18, color: "text.secondary" }} />
                      <Typography variant="body2" sx={{ color: "text.secondary" }}>
                        Travel Date
                      </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {formatDate(inquiry.travel_date)}
                    </Typography>
                  </Grid>
                )}
                {inquiry.number_of_travelers && (
                  <Grid item xs={12} sm={6} md={4}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                      <People sx={{ fontSize: 18, color: "text.secondary" }} />
                      <Typography variant="body2" sx={{ color: "text.secondary" }}>
                        Number of Travelers
                      </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {inquiry.number_of_travelers}
                    </Typography>
                  </Grid>
                )}
                {inquiry.budget && (
                  <Grid item xs={12} sm={6} md={4}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                      <AttachMoney sx={{ fontSize: 18, color: "text.secondary" }} />
                      <Typography variant="body2" sx={{ color: "text.secondary" }}>
                        Budget
                      </Typography>
                    </Box>
                    <Chip
                      label={inquiry.budget}
                      size="small"
                      sx={{
                        backgroundColor: "#f0f0f0",
                        fontWeight: 600,
                      }}
                    />
                  </Grid>
                )}
              </Grid>
              {inquiry.message && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                    <Description sx={{ fontSize: 18, color: "text.secondary" }} />
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      Message
                    </Typography>
                  </Box>
                  <Paper
                    sx={{
                      p: 2,
                      backgroundColor: "#faf6f2",
                      border: "1px dashed #e0d6c8",
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                      {inquiry.message}
                    </Typography>
                  </Paper>
                </>
              )}
            </CardContent>
          </Card>

          {/* Package Information */}
          {inquiry.package_data && (
            <Card
              sx={{
                backgroundColor: "white",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
                border: "1px solid #e0e0e0",
                borderLeft: "6px solid #6B4E3D",
              }}
            >
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                  <Description sx={{ color: "#6B4E3D" }} />
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    Package Information
                  </Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                      {inquiry.package_title}
                    </Typography>
                    {inquiry.package_number && (
                      <Chip
                        label={`Package #${inquiry.package_number}`}
                        size="small"
                        sx={{ mb: 1 }}
                      />
                    )}
                    {inquiry.category_name && (
                      <Chip
                        label={inquiry.category_name}
                        size="small"
                        sx={{ ml: 1, mb: 1 }}
                        icon={<Category sx={{ fontSize: 16 }} />}
                      />
                    )}
                  </Grid>
                  {inquiry.package_data.short_description && (
                    <Grid item xs={12}>
                      <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
                        Description
                      </Typography>
                      <Typography variant="body1">
                        {inquiry.package_data.short_description}
                      </Typography>
                    </Grid>
                  )}
                  {Array.isArray(inquiry.package_data.highlights) &&
                    inquiry.package_data.highlights.length > 0 && (
                      <Grid item xs={12}>
                        <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
                          Highlights
                        </Typography>
                        <Box component="ul" sx={{ pl: 2, m: 0 }}>
                          {inquiry.package_data.highlights.map((highlight, idx) => (
                            <Typography key={idx} component="li" variant="body2" sx={{ mb: 0.5 }}>
                              {highlight}
                            </Typography>
                          ))}
                        </Box>
                      </Grid>
                    )}
                  {Array.isArray(inquiry.package_data.pricing_tiers) &&
                    inquiry.package_data.pricing_tiers.length > 0 && (
                      <Grid item xs={12}>
                        <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
                          Pricing
                        </Typography>
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                          {inquiry.package_data.pricing_tiers.map((tier, idx) => (
                            <Chip
                              key={idx}
                              label={`${tier.tier}: ${tier.price_range}`}
                              size="small"
                              sx={{ fontWeight: 600 }}
                            />
                          ))}
                        </Box>
                      </Grid>
                    )}
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* Destination Information */}
          {(inquiry.destination || inquiry.destination_title) && (
            <Card
              sx={{
                backgroundColor: "white",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
                border: "1px solid #e0e0e0",
                borderLeft: "6px solid #B85C38",
              }}
            >
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                  <LocationOn sx={{ color: "#B85C38" }} />
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    Destination
                  </Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      Destination
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {inquiry.destination?.title || inquiry.destination_title || "—"}
                    </Typography>
                  </Grid>
                  {inquiry.destination?.slug && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" sx={{ color: "text.secondary" }}>
                        Slug
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {inquiry.destination.slug}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* Admin Reply Section */}
          {inquiry.admin_reply && (
            <Card
              sx={{
                backgroundColor: "white",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
                border: "1px solid #e0e0e0",
                borderLeft: "6px solid #3498db",
              }}
            >
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                  <Reply sx={{ color: "#3498db" }} />
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    Admin Reply
                  </Typography>
                </Box>
                <Paper
                  sx={{
                    p: 2,
                    backgroundColor: "#ebf5fb",
                    border: "1px solid #bee5eb",
                    borderRadius: 1,
                    mb: 2,
                  }}
                >
                  <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                    {inquiry.admin_reply}
                  </Typography>
                </Paper>
                <Grid container spacing={2}>
                  {inquiry.replier && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" sx={{ color: "text.secondary" }}>
                        Replied By
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {inquiry.replier.full_name || inquiry.replier.name || "—"}
                      </Typography>
                      {inquiry.replier.email && (
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                          {inquiry.replier.email}
                        </Typography>
                      )}
                    </Grid>
                  )}
                  {inquiry.replied_at && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" sx={{ color: "text.secondary" }}>
                        Replied At
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {formatDateTime(inquiry.replied_at)}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* Inquiry Metadata */}
          <Card
            sx={{
              backgroundColor: "white",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
              border: "1px solid #e0e0e0",
              borderLeft: "6px solid #95a5a6",
            }}
          >
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 800 }}>
                Inquiry Metadata
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Created
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {formatDateTime(inquiry.created_at)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Last Updated
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {formatDateTime(inquiry.updated_at)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Status
                  </Typography>
                  <Chip
                    label={inquiry.status?.toUpperCase() || "PENDING"}
                    size="small"
                    sx={{
                      backgroundColor: statusColors.bg,
                      color: statusColors.color,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      mt: 0.5,
                    }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Stack>
      </Container>
    </Box>
  );
};

export default PackageInquiryView;

