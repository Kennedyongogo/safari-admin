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
  Stack,
  CircularProgress,
  Alert,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  OutlinedInput,
  Chip,
} from "@mui/material";
import {
  ArrowBack,
  Save,
  CloudUpload,
  Close as CloseIcon,
  Article,
  Image as ImageIcon,
  Add,
} from "@mui/icons-material";
import Swal from "sweetalert2";

// Reusable component for managing array fields with chips
const ChipArrayField = ({ label, value, onChange, placeholder }) => {
  const [inputValue, setInputValue] = useState("");

  const handleAddItem = () => {
    const trimmedValue = inputValue.trim();
    if (trimmedValue && !value.includes(trimmedValue)) {
      onChange([...value, trimmedValue]);
      setInputValue("");
    }
  };

  const handleRemoveItem = (itemToRemove) => {
    onChange(value.filter((item) => item !== itemToRemove));
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleAddItem();
    }
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 1 }}>
        {label}
      </Typography>
      <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          sx={{
            "& .MuiOutlinedInput-root": {
              backgroundColor: "transparent",
            },
          }}
        />
        <Button
          variant="contained"
          onClick={handleAddItem}
          disabled={!inputValue.trim() || value.includes(inputValue.trim())}
          sx={{
            background: "linear-gradient(135deg, #6B4E3D 0%, #B85C38 100%)",
            color: "white",
            minWidth: "auto",
            px: 2,
            "&:hover": {
              background: "linear-gradient(135deg, #8B4225 0%, #6B4E3D 100%)",
            },
            "&:disabled": {
              background: "#e0e0e0",
              color: "#999",
            },
          }}
        >
          <Add />
        </Button>
      </Box>
      {value.length > 0 && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {value.map((item, index) => (
            <Chip
              key={index}
              label={item}
              onDelete={() => handleRemoveItem(item)}
              sx={{
                backgroundColor: "#6B4E3D",
                color: "white",
                "& .MuiChip-deleteIcon": {
                  color: "rgba(255, 255, 255, 0.7)",
                  "&:hover": {
                    color: "white",
                  },
                },
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const CampEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [galleryFiles, setGalleryFiles] = useState([]);

  const [campForm, setCampForm] = useState({
    name: "",
    location: "",
    destination: "",
    description: "",
    campType: "",
    openMonths: [],
    latitude: "",
    longitude: "",
    whyYouLoveIt: [],
    highlights: [],
    dayAtCamp: [],
    essentials: [],
    amenities: [],
    images: [],
  });

  const buildImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    if (path.startsWith("/")) return path;
    return `/${path}`;
  };

  useEffect(() => {
    fetchLodge();
  }, [id]);

  const fetchLodge = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/lodges/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.message || "Failed to load lodge");

      const l = data.data;
      setCampForm({
        name: l.name || "",
        location: l.location || "",
        destination: l.destination || "",
        description: l.description || "",
        campType: Array.isArray(l.campType) ? l.campType.join(", ") : "",
        openMonths: Array.isArray(l.openMonths) ? l.openMonths : [],
        latitude: l.latitude || "",
        longitude: l.longitude || "",
        whyYouLoveIt: Array.isArray(l.whyYouLoveIt) ? l.whyYouLoveIt : [],
        highlights: Array.isArray(l.highlights) ? l.highlights : [],
        dayAtCamp: Array.isArray(l.dayAtCamp) ? l.dayAtCamp : [],
        essentials: Array.isArray(l.essentials) ? l.essentials : [],
        amenities: Array.isArray(l.amenities) ? l.amenities : [],
        images: Array.isArray(l.images) ? l.images : [],
      });
    } catch (err) {
      setError(err.message || "Failed to load lodge");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setCampForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleGallerySelect = (event) => {
    const files = Array.from(event.target.files || []);
    const valid = files.filter(
      (file) => file.type.startsWith("image/") && file.size <= 10 * 1024 * 1024
    );
    setGalleryFiles((prev) => [...prev, ...valid]);
    event.target.value = "";
  };

  const removeGalleryFile = (index) => {
    setGalleryFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMonthSelect = (event) => {
    const selectedMonth = event.target.value;
    if (selectedMonth && !campForm.openMonths.includes(selectedMonth)) {
      setCampForm((prev) => ({
        ...prev,
        openMonths: [...prev.openMonths, selectedMonth],
      }));
    }
  };

  const handleMonthRemove = (monthToRemove) => {
    setCampForm((prev) => ({
      ...prev,
      openMonths: prev.openMonths.filter((month) => month !== monthToRemove),
    }));
  };

  const isFormValid = () =>
    campForm.name.trim() &&
    campForm.location.trim() &&
    campForm.destination.trim() &&
    campForm.description.trim();

  const parseList = (input) => {
    // Handle arrays directly (from ChipArrayField components)
    if (Array.isArray(input)) {
      return input.filter(Boolean);
    }
    // Handle strings (from text fields)
    if (typeof input === "string") {
      return input
        .split("\n")
        .map((t) => t.split(","))
        .flat()
        .map((t) => t.trim())
        .filter(Boolean);
    }
    // Handle other cases
    return [];
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      const token = localStorage.getItem("token");

      // Always use FormData for consistency
      const formData = new FormData();

      // Add basic fields
      formData.append("name", campForm.name);
      formData.append("location", campForm.location);
      formData.append("destination", campForm.destination);
      formData.append("description", campForm.description);

      // Add images as JSON string to preserve the array
      formData.append("images", JSON.stringify(campForm.images));

      // Add array fields
      parseList(campForm.campType).forEach((v) =>
        formData.append("campType", v)
      );
      campForm.openMonths.forEach((v) => formData.append("openMonths", v));
      parseList(campForm.whyYouLoveIt).forEach((v) =>
        formData.append("whyYouLoveIt", v)
      );
      parseList(campForm.highlights).forEach((v) =>
        formData.append("highlights", v)
      );
      parseList(campForm.dayAtCamp).forEach((v) =>
        formData.append("dayAtCamp", v)
      );
      parseList(campForm.essentials).forEach((v) =>
        formData.append("essentials", v)
      );
      parseList(campForm.amenities).forEach((v) =>
        formData.append("amenities", v)
      );

      // Add optional fields
      if (campForm.latitude) formData.append("latitude", campForm.latitude);
      if (campForm.longitude) formData.append("longitude", campForm.longitude);

      // Add gallery files
      galleryFiles.forEach((file) => formData.append("lodge_gallery", file));

      const res = await fetch(`/api/lodges/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.message || "Failed to update lodge");

      await Swal.fire({
        icon: "success",
        title: "Updated",
        text: "Lodge updated successfully",
        timer: 1400,
        showConfirmButton: false,
      });
      navigate("/camp-lodges");
    } catch (err) {
      setError(err.message || "Failed to update lodge");
      Swal.fire("Error", err.message || "Failed to update lodge", "error");
    } finally {
      setSaving(false);
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
          onClick={() => navigate("/camp-lodges")}
        >
          Back to Camps & Lodges
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
          <Box
            display="flex"
            alignItems="center"
            gap={2}
            position="relative"
            zIndex={1}
          >
            <IconButton
              onClick={() => navigate("/camp-lodges")}
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
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  textShadow: "0 2px 4px rgba(0,0,0,0.3)",
                }}
              >
                Edit Camp / Lodge
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                {campForm.name}
              </Typography>
            </Box>
            <Box ml="auto" display="flex" gap={1}>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleSave}
                disabled={!isFormValid() || saving}
                sx={{
                  background:
                    "linear-gradient(135deg, #6B4E3D 0%, #B85C38 100%)",
                  color: "white",
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, #8B4225 0%, #6B4E3D 100%)",
                  },
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
                label="Name"
                value={campForm.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
              />
              <TextField
                fullWidth
                label="Location"
                value={campForm.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
              />
              <TextField
                fullWidth
                label="Destination (country/region)"
                value={campForm.destination}
                onChange={(e) =>
                  handleInputChange("destination", e.target.value)
                }
              />
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={4}
                value={campForm.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
              />
              <TextField
                fullWidth
                label="Camp Types (comma or newline separated)"
                multiline
                rows={2}
                value={campForm.campType}
                onChange={(e) => handleInputChange("campType", e.target.value)}
              />
              <Box>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Open Months
                </Typography>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Select Month</InputLabel>
                  <Select
                    value=""
                    onChange={handleMonthSelect}
                    input={<OutlinedInput label="Select Month" />}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        "& fieldset": {
                          borderColor: "#6B4E3D",
                        },
                        "&:hover fieldset": {
                          borderColor: "#B85C38",
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: "#6B4E3D",
                        },
                      },
                    }}
                  >
                    {MONTHS.filter(
                      (month) => !campForm.openMonths.includes(month)
                    ).map((month) => (
                      <MenuItem key={month} value={month}>
                        {month}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {campForm.openMonths.length > 0 && (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {campForm.openMonths.map((month) => (
                      <Chip
                        key={month}
                        label={month}
                        onDelete={() => handleMonthRemove(month)}
                        sx={{
                          backgroundColor: "#6B4E3D",
                          color: "white",
                          "& .MuiChip-deleteIcon": {
                            color: "rgba(255, 255, 255, 0.7)",
                            "&:hover": {
                              color: "white",
                            },
                          },
                        }}
                      />
                    ))}
                  </Box>
                )}
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Latitude"
                    value={campForm.latitude}
                    onChange={(e) =>
                      handleInputChange("latitude", e.target.value)
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Longitude"
                    value={campForm.longitude}
                    onChange={(e) =>
                      handleInputChange("longitude", e.target.value)
                    }
                  />
                </Grid>
              </Grid>
              <ChipArrayField
                label="Why you'll love it"
                value={campForm.whyYouLoveIt}
                onChange={(value) => handleInputChange("whyYouLoveIt", value)}
                placeholder="Add a reason why you'll love this camp..."
              />
              <ChipArrayField
                label="Highlights"
                value={campForm.highlights}
                onChange={(value) => handleInputChange("highlights", value)}
                placeholder="Add a key highlight or feature..."
              />
              <ChipArrayField
                label="A day at camp"
                value={campForm.dayAtCamp}
                onChange={(value) => handleInputChange("dayAtCamp", value)}
                placeholder="Add an activity or experience for a typical day..."
              />
              <ChipArrayField
                label="Essentials"
                value={campForm.essentials}
                onChange={(value) => handleInputChange("essentials", value)}
                placeholder="Add an essential item to bring..."
              />
              <ChipArrayField
                label="Amenities & comforts"
                value={campForm.amenities}
                onChange={(value) => handleInputChange("amenities", value)}
                placeholder="Add an amenity or comfort available..."
              />
              <Box>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Gallery Images
                </Typography>

                {/* Existing Images */}
                {Array.isArray(campForm.images) &&
                  campForm.images.length > 0 && (
                    <Box mb={3}>
                      <Typography
                        variant="subtitle2"
                        sx={{ mb: 1, color: "text.secondary" }}
                      >
                        Existing Images ({campForm.images.length})
                      </Typography>
                      <Grid container spacing={2}>
                        {campForm.images.map((image, idx) => (
                          <Grid
                            item
                            xs={12}
                            sm={6}
                            md={4}
                            key={`existing-${idx}`}
                          >
                            <Box
                              sx={{
                                position: "relative",
                                border: "1px solid #e0e0e0",
                                borderRadius: 2,
                                overflow: "hidden",
                                "&:hover .remove-btn": {
                                  opacity: 1,
                                },
                              }}
                            >
                              <Box
                                component="img"
                                src={buildImageUrl(image)}
                                alt={`Existing ${idx + 1}`}
                                sx={{
                                  width: "100%",
                                  height: 150,
                                  objectFit: "cover",
                                }}
                              />
                              <Box
                                className="remove-btn"
                                sx={{
                                  position: "absolute",
                                  top: 4,
                                  right: 4,
                                  opacity: 0,
                                  transition: "opacity 0.2s",
                                }}
                              >
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    const updatedImages =
                                      campForm.images.filter(
                                        (_, i) => i !== idx
                                      );
                                    handleInputChange("images", updatedImages);
                                  }}
                                  sx={{
                                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                                    "&:hover": {
                                      backgroundColor: "rgba(255, 255, 255, 1)",
                                    },
                                  }}
                                >
                                  <CloseIcon fontSize="small" color="error" />
                                </IconButton>
                              </Box>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )}

                {/* Upload New Images */}
                <Box mb={2}>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleGallerySelect}
                    style={{ display: "none" }}
                    id="camp-gallery-upload"
                  />
                  <label htmlFor="camp-gallery-upload">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<CloudUpload />}
                      sx={{
                        color: "#6B4E3D",
                        borderColor: "#6B4E3D",
                        "&:hover": {
                          borderColor: "#B85C38",
                          backgroundColor: "rgba(184, 92, 56, 0.1)",
                        },
                        mb: 2,
                      }}
                    >
                      Upload Gallery Images
                    </Button>
                  </label>
                </Box>

                {/* New Files Preview */}
                {galleryFiles.length > 0 && (
                  <Box>
                    <Typography
                      variant="subtitle2"
                      sx={{ mb: 1, color: "text.secondary" }}
                    >
                      New Images to Upload ({galleryFiles.length})
                    </Typography>
                    <Grid container spacing={2}>
                      {galleryFiles.map((file, idx) => (
                        <Grid item xs={12} sm={6} md={4} key={`new-${idx}`}>
                          <Box
                            sx={{
                              position: "relative",
                              border: "1px solid #e0e0e0",
                              borderRadius: 2,
                              overflow: "hidden",
                              "&:hover .remove-btn": {
                                opacity: 1,
                              },
                            }}
                          >
                            <Box
                              component="img"
                              src={URL.createObjectURL(file)}
                              alt={`New upload ${idx + 1}`}
                              sx={{
                                width: "100%",
                                height: 150,
                                objectFit: "cover",
                              }}
                            />
                            <Box
                              sx={{
                                position: "absolute",
                                bottom: 0,
                                left: 0,
                                right: 0,
                                background:
                                  "linear-gradient(to top, rgba(0,0,0,0.7), transparent)",
                                p: 1,
                              }}
                            >
                              <Typography
                                variant="caption"
                                sx={{
                                  color: "white",
                                  fontWeight: 500,
                                  display: "block",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {file.name}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{ color: "rgba(255,255,255,0.8)" }}
                              >
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </Typography>
                            </Box>
                            <Box
                              className="remove-btn"
                              sx={{
                                position: "absolute",
                                top: 4,
                                right: 4,
                                opacity: 0,
                                transition: "opacity 0.2s",
                              }}
                            >
                              <IconButton
                                size="small"
                                onClick={() => removeGalleryFile(idx)}
                                sx={{
                                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                                  "&:hover": {
                                    backgroundColor: "rgba(255, 255, 255, 1)",
                                  },
                                }}
                              >
                                <CloseIcon fontSize="small" color="error" />
                              </IconButton>
                            </Box>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
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

export default CampEdit;
