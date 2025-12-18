import React, { useState } from "react";
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
  Save,
  ArrowBack,
  CloudUpload,
  Image as ImageIcon,
  Close as CloseIcon,
  Article,
  Add,
  Collections,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import LocationMapPicker from "./LocationMapPicker";

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

const CAMP_TYPES = [
  "Remote",
  "Family Friendly",
  "Romantic",
  "Private",
  "Spa & Wellness",
];

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

const CampCreate = () => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [galleryFiles, setGalleryFiles] = useState([]);

  const [campForm, setCampForm] = useState({
    name: "",
    location: "",
    destination: "",
    description: "",
    campType: [],
    openMonths: [],
    latitude: "",
    longitude: "",
    whyYouLoveIt: [],
    highlights: [],
    dayAtCamp: [],
    essentials: [],
    amenities: [],
  });

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

  const handleCreate = async () => {
    try {
      setSaving(true);
      setError(null);

      const token = localStorage.getItem("token");

      // Prepare data payload
      const payload = {
        name: campForm.name,
        location: campForm.location,
        destination: campForm.destination,
        description: campForm.description,
        campType: campForm.campType,
        openMonths: campForm.openMonths,
        whyYouLoveIt: campForm.whyYouLoveIt,
        highlights: campForm.highlights,
        dayAtCamp: campForm.dayAtCamp,
        essentials: campForm.essentials,
        amenities: campForm.amenities,
      };

      // Add optional fields
      if (campForm.latitude) payload.latitude = campForm.latitude;
      if (campForm.longitude) payload.longitude = campForm.longitude;

      // Always use FormData for consistency
      const formData = new FormData();

      // Add all payload fields to FormData
      Object.entries(payload).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach((v) => formData.append(key, v));
        } else {
          formData.append(key, value);
        }
      });

      // Add gallery files
      galleryFiles.forEach((file) => formData.append("lodge_gallery", file));

      const response = await fetch("/api/lodges", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setGalleryFiles([]);
        await Swal.fire({
          title: "Success!",
          text: "Lodge created successfully!",
          icon: "success",
          confirmButtonColor: "#6B4E3D",
        });
        navigate("/camp-lodges");
      } else {
        throw new Error(result.message || "Failed to create lodge");
      }
    } catch (err) {
      console.error("Error creating lodge:", err);
      setError(err.message || "Failed to create lodge");
      await Swal.fire({
        title: "Error!",
        text: err.message || "Failed to create lodge",
        icon: "error",
        confirmButtonColor: "#6B4E3D",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, rgba(245, 241, 232, 0.95) 0%, rgba(255, 255, 255, 0.98) 50%, rgba(232, 224, 209, 0.95) 100%)",
        py: 4,
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            background: "linear-gradient(135deg, #6B4E3D 0%, #B85C38 100%)",
            p: 3,
            color: "white",
            position: "relative",
            overflow: "hidden",
            borderRadius: 2,
            mb: 4,
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
            }}
          />
          <Stack
            direction="row"
            alignItems="center"
            spacing={2}
            sx={{ position: "relative", zIndex: 1 }}
          >
            <IconButton
              onClick={() => navigate("/camp-lodges")}
              sx={{
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                color: "white",
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.3)",
                },
              }}
            >
              <ArrowBack />
            </IconButton>
            <Article sx={{ fontSize: 40 }} />
            <Typography
              variant="h3"
              sx={{
                fontWeight: "bold",
                textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
              }}
            >
              Create Camp / Lodge
            </Typography>
          </Stack>

          {error && (
            <Alert
              severity="error"
              sx={{ mt: 2, position: "relative", zIndex: 1 }}
            >
              {error}
            </Alert>
          )}
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
              <Box>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Camp Types
                </Typography>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                    gap: 1,
                  }}
                >
                  {CAMP_TYPES.map((type) => {
                    const selected = campForm.campType.includes(type);
                    return (
                      <Button
                        key={type}
                        variant={selected ? "contained" : "outlined"}
                        size="small"
                        onClick={() =>
                          setCampForm((prev) => ({
                            ...prev,
                            campType: selected
                              ? prev.campType.filter((t) => t !== type)
                              : [...prev.campType, type],
                          }))
                        }
                        sx={{
                          width: "100%",
                          justifyContent: "center",
                          borderColor: "#6B4E3D",
                          color: selected ? "white" : "#6B4E3D",
                          backgroundColor: selected ? "#6B4E3D" : "transparent",
                          "&:hover": {
                            borderColor: "#B85C38",
                            backgroundColor: selected
                              ? "#B85C38"
                              : "rgba(184, 92, 56, 0.12)",
                          },
                        }}
                      >
                        {type}
                      </Button>
                    );
                  })}
                </Box>
              </Box>
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
              <LocationMapPicker
                latitude={campForm.latitude}
                longitude={campForm.longitude}
                onLocationChange={(lat, lng) => {
                  handleInputChange("latitude", lat);
                  handleInputChange("longitude", lng);
                }}
              />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Latitude"
                    value={campForm.latitude || ""}
                    InputProps={{
                      readOnly: true,
                    }}
                    sx={{
                      "& .MuiInputBase-input": {
                        backgroundColor: "#f5f5f5",
                      },
                    }}
                    helperText="Click on the map above to set latitude"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Longitude"
                    value={campForm.longitude || ""}
                    InputProps={{
                      readOnly: true,
                    }}
                    sx={{
                      "& .MuiInputBase-input": {
                        backgroundColor: "#f5f5f5",
                      },
                    }}
                    helperText="Click on the map above to set longitude"
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
                  <Collections sx={{ mr: 1, verticalAlign: "middle" }} />
                  Gallery Images
                </Typography>
                <Box mb={2}>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleGallerySelect}
                    style={{ display: "none" }}
                    id="gallery-upload"
                  />
                  <label htmlFor="gallery-upload">
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
                      Upload Gallery Images
                    </Button>
                  </label>
                </Box>

                {galleryFiles.length > 0 ? (
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{ mb: 2, color: "text.secondary" }}
                    >
                      {galleryFiles.length} image
                      {galleryFiles.length !== 1 ? "s" : ""} selected
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                      {galleryFiles.map((file, index) => (
                        <Box
                          key={index}
                          sx={{
                            position: "relative",
                            width: 120,
                            height: 120,
                            borderRadius: 2,
                            overflow: "hidden",
                            border: "1px solid #e0e0e0",
                          }}
                        >
                          <IconButton
                            onClick={() => removeGalleryFile(index)}
                            sx={{
                              position: "absolute",
                              top: 4,
                              right: 4,
                              backgroundColor: "rgba(0, 0, 0, 0.5)",
                              color: "white",
                              "&:hover": {
                                backgroundColor: "rgba(0, 0, 0, 0.7)",
                              },
                              zIndex: 2,
                              width: 24,
                              height: 24,
                            }}
                            size="small"
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Gallery ${index + 1}`}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                          <Box
                            sx={{
                              position: "absolute",
                              bottom: 0,
                              left: 0,
                              right: 0,
                              backgroundColor: "rgba(0, 0, 0, 0.7)",
                              color: "white",
                              padding: "2px 6px",
                              fontSize: "0.75rem",
                            }}
                          >
                            {file.name.length > 15
                              ? `${file.name.substring(0, 12)}...`
                              : file.name}
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      border: "2px dashed #ccc",
                      borderRadius: 2,
                      p: 3,
                      textAlign: "center",
                      bgcolor: "#f9f9f9",
                    }}
                  >
                    <ImageIcon sx={{ fontSize: 48, opacity: 0.3, mb: 1 }} />
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary" }}
                    >
                      No gallery images selected. Click "Upload Gallery Images"
                      to add multiple images.
                    </Typography>
                  </Box>
                )}
              </Box>

              <Box display="flex" gap={2}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={saving ? <CircularProgress size={20} /> : <Save />}
                  onClick={handleCreate}
                  disabled={!isFormValid() || saving}
                  sx={{
                    flex: 1,
                    background:
                      "linear-gradient(135deg, #6B4E3D 0%, #B85C38 100%)",
                    color: "white",
                    "&:hover": {
                      background:
                        "linear-gradient(135deg, #8B4225 0%, #6B4E3D 100%)",
                    },
                    "&:disabled": {
                      background: "#e0e0e0",
                      color: "#999",
                    },
                  }}
                >
                  {saving ? "Creating..." : "Create Lodge"}
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate("/camp-lodges")}
                  sx={{
                    flex: 1,
                    color: "#6B4E3D",
                    borderColor: "#6B4E3D",
                    "&:hover": {
                      borderColor: "#B85C38",
                      backgroundColor: "rgba(107, 78, 61, 0.1)",
                    },
                  }}
                >
                  Cancel
                </Button>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default CampCreate;
