import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  IconButton,
  Stack,
  Grid,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  CloudUpload,
  Image as ImageIcon,
  LocationOn as LocationOnIcon,
} from "@mui/icons-material";
import LocationPicker from "./LocationPicker";

// Predefined package categories based on TOC structure
// Includes categories for Uganda, Kenya, Tanzania, and Rwanda destinations
const PACKAGE_CATEGORIES = [
  // Uganda categories
  "CLASSIC UGANDA SAFARI TOURS",
  "PRIMATE SAFARIS",
  "ADVENTURE & NATURE EXPERIENCES",
  "COMBINED SAFARI & PRIMATE HOLIDAYS",
  "SPECIAL INTEREST & SLOW TRAVEL",
  // Kenya categories
  "SAFARI TOURS",
  "CLIMB MOUNT KENYA PACKAGES",
  "BEACH EXTENSION PACKAGES",
  "COMBINED SAFARI & BEACH HOLIDAYS",
  "SPECIAL INTEREST SAFARI",
  // Tanzania categories
  "NORTHERN CIRCUIT SAFARI TOURS",
  "SOUTHERN & WESTERN CIRCUIT SAFARIS",
  "MOUNT KILIMANJARO CLIMBS",
  "ZANZIBAR BEACH EXTENSIONS",
  "COMBINED SAFARI & BEACH HOLIDAYS",
  // Rwanda categories
  "GORILLA & PRIMATE SAFARIS",
  "WILDLIFE & SCENIC SAFARIS",
  "CULTURE, SCENERY & RELAXATION"
];

const PackageManager = ({ packages, onChange, buildImageUrl }) => {
  const [expandedCategories, setExpandedCategories] = useState({});

  const handleCategoryToggle = (catIndex) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [catIndex]: !prev[catIndex],
    }));
  };

  const addCategory = () => {
    const newCategory = {
      category_name: "",
      category_order: packages.length + 1,
      packages: [],
    };
    onChange([...packages, newCategory]);
  };

  const updateCategory = (catIndex, field, value) => {
    const updated = [...packages];
    updated[catIndex] = { ...updated[catIndex], [field]: value };
    onChange(updated);
  };

  const deleteCategory = (catIndex) => {
    onChange(packages.filter((_, i) => i !== catIndex));
  };

  const addPackage = (catIndex) => {
    const updated = [...packages];
    const category = updated[catIndex];
    const newPackage = {
      number: (category.packages.length + 1),
      title: "",
      short_description: "",
      highlights: [],
      pricing_tiers: [],
      gallery: [],
      itinerary: [],
    };
    category.packages = [...category.packages, newPackage];
    onChange(updated);
  };

  const updatePackage = (catIndex, pkgIndex, field, value) => {
    const updated = [...packages];
    updated[catIndex].packages[pkgIndex] = {
      ...updated[catIndex].packages[pkgIndex],
      [field]: value,
    };
    onChange(updated);
  };

  const deletePackage = (catIndex, pkgIndex) => {
    const updated = [...packages];
    updated[catIndex].packages = updated[catIndex].packages.filter(
      (_, i) => i !== pkgIndex
    );
    onChange(updated);
  };

  const addHighlight = (catIndex, pkgIndex) => {
    const updated = [...packages];
    const pkg = updated[catIndex].packages[pkgIndex];
    pkg.highlights = [...(pkg.highlights || []), ""];
    onChange(updated);
  };

  const updateHighlight = (catIndex, pkgIndex, highlightIndex, value) => {
    const updated = [...packages];
    const pkg = updated[catIndex].packages[pkgIndex];
    pkg.highlights[highlightIndex] = value;
    onChange(updated);
  };

  const removeHighlight = (catIndex, pkgIndex, highlightIndex) => {
    const updated = [...packages];
    const pkg = updated[catIndex].packages[pkgIndex];
    pkg.highlights = pkg.highlights.filter((_, i) => i !== highlightIndex);
    onChange(updated);
  };

  const addPricingTier = (catIndex, pkgIndex) => {
    const updated = [...packages];
    const pkg = updated[catIndex].packages[pkgIndex];
    pkg.pricing_tiers = [
      ...(pkg.pricing_tiers || []),
      { tier: "", price_range: "" },
    ];
    onChange(updated);
  };

  const updatePricingTier = (catIndex, pkgIndex, tierIndex, field, value) => {
    const updated = [...packages];
    const pkg = updated[catIndex].packages[pkgIndex];
    pkg.pricing_tiers[tierIndex] = {
      ...pkg.pricing_tiers[tierIndex],
      [field]: value,
    };
    onChange(updated);
  };

  const removePricingTier = (catIndex, pkgIndex, tierIndex) => {
    const updated = [...packages];
    const pkg = updated[catIndex].packages[pkgIndex];
    pkg.pricing_tiers = pkg.pricing_tiers.filter((_, i) => i !== tierIndex);
    onChange(updated);
  };

  const handlePackageGalleryUpload = (catIndex, pkgIndex, event) => {
    const files = Array.from(event.target.files || []);
    const valid = files.filter(
      (file) => file.type.startsWith("image/") && file.size <= 10 * 1024 * 1024
    );
    if (valid.length > 0) {
      const updated = [...packages];
      const pkg = updated[catIndex].packages[pkgIndex];
      pkg.gallery = [...(pkg.gallery || []), ...valid];
      onChange(updated);
    }
    event.target.value = "";
  };

  const removePackageGalleryImage = (catIndex, pkgIndex, imgIndex) => {
    const updated = [...packages];
    const pkg = updated[catIndex].packages[pkgIndex];
    pkg.gallery = pkg.gallery.filter((_, i) => i !== imgIndex);
    onChange(updated);
  };

  // Itinerary management functions
  const addItineraryDay = (catIndex, pkgIndex) => {
    const updated = [...packages];
    const pkg = updated[catIndex].packages[pkgIndex];
    const currentItinerary = pkg.itinerary || [];
    const nextDayNumber = currentItinerary.length > 0 
      ? Math.max(...currentItinerary.map(d => d.day)) + 1 
      : 1;
    const newDay = {
      day: nextDayNumber,
      description: "",
      start_location: {
        latitude: 0,
        longitude: 0,
      },
    };
    pkg.itinerary = [...currentItinerary, newDay];
    onChange(updated);
  };

  const updateItineraryDay = (catIndex, pkgIndex, dayIndex, field, value) => {
    const updated = [...packages];
    const pkg = updated[catIndex].packages[pkgIndex];
    const day = pkg.itinerary[dayIndex];
    
    // Handle nested location fields
    if (field === "start_latitude" || field === "start_longitude") {
      const locationType = field.replace("start_", "");
      day.start_location = day.start_location || { latitude: 0, longitude: 0 };
      day.start_location[locationType] = value;
    } else if (field === "end_latitude" || field === "end_longitude") {
      const locationType = field.replace("end_", "");
      day.end_location = day.end_location || { latitude: 0, longitude: 0 };
      day.end_location[locationType] = value;
    } else {
      day[field] = value;
    }
    
    pkg.itinerary[dayIndex] = day;
    onChange(updated);
  };

  const removeItineraryDay = (catIndex, pkgIndex, dayIndex) => {
    const updated = [...packages];
    const pkg = updated[catIndex].packages[pkgIndex];
    pkg.itinerary = pkg.itinerary.filter((_, i) => i !== dayIndex);
    onChange(updated);
  };

  const addEndLocation = (catIndex, pkgIndex, dayIndex) => {
    const updated = [...packages];
    const pkg = updated[catIndex].packages[pkgIndex];
    const day = pkg.itinerary[dayIndex];
    // Initialize end_location with same as start if not exists
    if (!day.end_location) {
      day.end_location = {
        latitude: day.start_location?.latitude || 0,
        longitude: day.start_location?.longitude || 0,
      };
      onChange(updated);
    }
  };

  const removeEndLocation = (catIndex, pkgIndex, dayIndex) => {
    const updated = [...packages];
    const pkg = updated[catIndex].packages[pkgIndex];
    const day = pkg.itinerary[dayIndex];
    delete day.end_location;
    onChange(updated);
  };

  const [locationPickerState, setLocationPickerState] = useState({
    open: false,
    catIndex: null,
    pkgIndex: null,
    dayIndex: null,
    locationType: null, // 'start' or 'end'
  });

  const openLocationPicker = (catIndex, pkgIndex, dayIndex, locationType) => {
    setLocationPickerState({
      open: true,
      catIndex,
      pkgIndex,
      dayIndex,
      locationType,
    });
  };

  const handleLocationSelect = (location) => {
    if (locationPickerState.catIndex !== null && 
        locationPickerState.pkgIndex !== null && 
        locationPickerState.dayIndex !== null &&
        locationPickerState.locationType) {
      const { catIndex, pkgIndex, dayIndex, locationType } = locationPickerState;
      updateItineraryDay(catIndex, pkgIndex, dayIndex, `${locationType}_latitude`, location.latitude);
      updateItineraryDay(catIndex, pkgIndex, dayIndex, `${locationType}_longitude`, location.longitude);
    }
    setLocationPickerState({ open: false, catIndex: null, pkgIndex: null, dayIndex: null, locationType: null });
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Packages by Category
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={addCategory}
          sx={{
            background: "linear-gradient(135deg, #6B4E3D 0%, #B85C38 100%)",
            color: "white",
            "&:hover": {
              background: "linear-gradient(135deg, #8B4225 0%, #6B4E3D 100%)",
            },
          }}
        >
          Add Category
        </Button>
      </Box>

      {packages.map((category, catIndex) => (
        <Accordion
          key={catIndex}
          expanded={expandedCategories[catIndex] !== false}
          onChange={() => handleCategoryToggle(catIndex)}
          sx={{ mb: 2 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: "flex", alignItems: "center", width: "100%", gap: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {category.category_name || `Category ${catIndex + 1}`}
              </Typography>
              <Chip
                label={`${category.packages?.length || 0} packages`}
                size="small"
                sx={{ ml: "auto" }}
              />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Card sx={{ mb: 2, border: "1px solid #e0e0e0" }}>
              <CardContent>
                <Stack spacing={2}>
                  <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
                    <FormControl fullWidth>
                      <InputLabel>Category Name</InputLabel>
                      <Select
                        value={category.category_name || ""}
                        onChange={(e) =>
                          updateCategory(catIndex, "category_name", e.target.value)
                        }
                        label="Category Name"
                      >
                        {PACKAGE_CATEGORIES.map((cat) => (
                          <MenuItem key={cat} value={cat}>
                            {cat}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <TextField
                      type="number"
                      label="Order"
                      value={category.category_order || catIndex + 1}
                      onChange={(e) =>
                        updateCategory(
                          catIndex,
                          "category_order",
                          parseInt(e.target.value) || catIndex + 1
                        )
                      }
                      sx={{ width: 120 }}
                    />
                    <IconButton
                      color="error"
                      onClick={() => deleteCategory(catIndex)}
                      sx={{ mt: 1 }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>

                  <Divider />

                  <Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        Packages in this Category
                      </Typography>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={() => addPackage(catIndex)}
                        sx={{
                          color: "#6B4E3D",
                          borderColor: "#6B4E3D",
                          "&:hover": {
                            borderColor: "#B85C38",
                            backgroundColor: "rgba(107, 78, 61, 0.1)",
                          },
                        }}
                      >
                        Add Package
                      </Button>
                    </Box>

                    {category.packages?.map((pkg, pkgIndex) => (
                      <Card
                        key={pkgIndex}
                        sx={{
                          mb: 2,
                          p: 2,
                          border: "1px solid #e0e0e0",
                          backgroundColor: "#fafafa",
                        }}
                      >
                        <Stack spacing={2}>
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              Package #{pkg.number || pkgIndex + 1}
                            </Typography>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => deletePackage(catIndex, pkgIndex)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>

                          <Grid container spacing={2}>
                            <Grid item xs={12} md={2}>
                              <TextField
                                fullWidth
                                type="number"
                                label="Number"
                                value={pkg.number || pkgIndex + 1}
                                onChange={(e) =>
                                  updatePackage(
                                    catIndex,
                                    pkgIndex,
                                    "number",
                                    parseInt(e.target.value) || pkgIndex + 1
                                  )
                                }
                                size="small"
                              />
                            </Grid>
                            <Grid item xs={12} md={10}>
                              <TextField
                                fullWidth
                                label="Package Title"
                                value={pkg.title || ""}
                                onChange={(e) =>
                                  updatePackage(catIndex, pkgIndex, "title", e.target.value)
                                }
                                placeholder="e.g., 3-Day Murchison Falls Wildlife & Nile Safari"
                                size="small"
                              />
                            </Grid>
                            <Grid item xs={12}>
                              <TextField
                                fullWidth
                                label="Short Description"
                                value={pkg.short_description || ""}
                                onChange={(e) =>
                                  updatePackage(
                                    catIndex,
                                    pkgIndex,
                                    "short_description",
                                    e.target.value
                                  )
                                }
                                multiline
                                rows={2}
                                placeholder="Brief description of the package"
                                size="small"
                              />
                            </Grid>
                          </Grid>

                          {/* Highlights */}
                          <Box>
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                              Highlights
                            </Typography>
                            {(pkg.highlights || []).map((highlight, highlightIndex) => (
                              <Box key={highlightIndex} sx={{ display: "flex", gap: 1, mb: 1 }}>
                                <TextField
                                  fullWidth
                                  size="small"
                                  value={highlight}
                                  onChange={(e) =>
                                    updateHighlight(
                                      catIndex,
                                      pkgIndex,
                                      highlightIndex,
                                      e.target.value
                                    )
                                  }
                                  placeholder="Enter a highlight"
                                />
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() =>
                                    removeHighlight(catIndex, pkgIndex, highlightIndex)
                                  }
                                >
                                  <CloseIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            ))}
                            <Button
                              size="small"
                              startIcon={<AddIcon />}
                              onClick={() => addHighlight(catIndex, pkgIndex)}
                              sx={{ mt: 1 }}
                            >
                              Add Highlight
                            </Button>
                          </Box>

                          {/* Pricing Tiers */}
                          <Box>
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                              Pricing Tiers
                            </Typography>
                            {(pkg.pricing_tiers || []).map((tier, tierIndex) => (
                              <Box key={tierIndex} sx={{ display: "flex", gap: 1, mb: 1 }}>
                                <TextField
                                  size="small"
                                  label="Tier"
                                  value={tier.tier || ""}
                                  onChange={(e) =>
                                    updatePricingTier(
                                      catIndex,
                                      pkgIndex,
                                      tierIndex,
                                      "tier",
                                      e.target.value
                                    )
                                  }
                                  placeholder="e.g., Mid-range"
                                  sx={{ flex: 1 }}
                                />
                                <TextField
                                  size="small"
                                  label="Price Range"
                                  value={tier.price_range || ""}
                                  onChange={(e) =>
                                    updatePricingTier(
                                      catIndex,
                                      pkgIndex,
                                      tierIndex,
                                      "price_range",
                                      e.target.value
                                    )
                                  }
                                  placeholder="e.g., USD 750–1,100 per person"
                                  sx={{ flex: 2 }}
                                />
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() =>
                                    removePricingTier(catIndex, pkgIndex, tierIndex)
                                  }
                                >
                                  <CloseIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            ))}
                            <Button
                              size="small"
                              startIcon={<AddIcon />}
                              onClick={() => addPricingTier(catIndex, pkgIndex)}
                              sx={{ mt: 1 }}
                            >
                              Add Pricing Tier
                            </Button>
                          </Box>

                          {/* Package Gallery */}
                          <Box>
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                              Package Gallery Images
                            </Typography>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={(e) =>
                                handlePackageGalleryUpload(catIndex, pkgIndex, e)
                              }
                              style={{ display: "none" }}
                              id={`package-gallery-${catIndex}-${pkgIndex}`}
                            />
                            <label htmlFor={`package-gallery-${catIndex}-${pkgIndex}`}>
                              <Button
                                variant="outlined"
                                component="span"
                                startIcon={<CloudUpload />}
                                size="small"
                                sx={{
                                  color: "#667eea",
                                  borderColor: "#667eea",
                                  mb: 1,
                                  "&:hover": {
                                    borderColor: "#667eea",
                                    backgroundColor: "rgba(102, 126, 234, 0.1)",
                                  },
                                }}
                              >
                                Upload Gallery Images
                              </Button>
                            </label>
                            {(pkg.gallery || []).length > 0 && (
                              <Grid container spacing={1} sx={{ mt: 1 }}>
                                {pkg.gallery.map((img, imgIndex) => (
                                  <Grid item xs={6} sm={4} md={3} key={imgIndex}>
                                    <Box
                                      sx={{
                                        position: "relative",
                                        border: "1px solid #e0e0e0",
                                        borderRadius: 1,
                                        overflow: "hidden",
                                      }}
                                    >
                                      <Box
                                        component="img"
                                        src={
                                          typeof img === "string"
                                            ? buildImageUrl(img)
                                            : URL.createObjectURL(img)
                                        }
                                        alt={`Package ${pkgIndex + 1} - Image ${imgIndex + 1}`}
                                        sx={{
                                          width: "100%",
                                          height: 80,
                                          objectFit: "cover",
                                        }}
                                      />
                                      <IconButton
                                        size="small"
                                        onClick={() =>
                                          removePackageGalleryImage(catIndex, pkgIndex, imgIndex)
                                        }
                                        sx={{
                                          position: "absolute",
                                          top: 2,
                                          right: 2,
                                          backgroundColor: "rgba(255, 255, 255, 0.9)",
                                          width: 20,
                                          height: 20,
                                        }}
                                      >
                                        <CloseIcon fontSize="small" color="error" />
                                      </IconButton>
                                    </Box>
                                  </Grid>
                                ))}
                              </Grid>
                            )}
                          </Box>

                          {/* Itinerary Section */}
                          <Box>
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                              Day-by-Day Itinerary with Locations
                            </Typography>
                            {(pkg.itinerary || []).map((day, dayIndex) => (
                              <Card
                                key={dayIndex}
                                sx={{
                                  mb: 2,
                                  p: 2,
                                  border: "1px solid #e0e0e0",
                                  backgroundColor: "#fafafa",
                                }}
                              >
                                <Stack spacing={2}>
                                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                      Day {day.day}
                                    </Typography>
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => removeItineraryDay(catIndex, pkgIndex, dayIndex)}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Box>
                                  <TextField
                                    fullWidth
                                    size="small"
                                    label="Day Description"
                                    value={day.description || ""}
                                    onChange={(e) =>
                                      updateItineraryDay(
                                        catIndex,
                                        pkgIndex,
                                        dayIndex,
                                        "description",
                                        e.target.value
                                      )
                                    }
                                    placeholder="e.g., Nairobi to Maasai Mara, afternoon game drive"
                                    multiline
                                    rows={2}
                                  />
                                  
                                  {/* Start Location */}
                                  <Box>
                                    <Typography variant="caption" sx={{ fontWeight: 600, mb: 1, display: "block" }}>
                                      Start Location *
                                    </Typography>
                                    <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
                                      <TextField
                                        size="small"
                                        label="Latitude"
                                        type="number"
                                        value={day.start_location?.latitude || ""}
                                        onChange={(e) =>
                                          updateItineraryDay(
                                            catIndex,
                                            pkgIndex,
                                            dayIndex,
                                            "start_latitude",
                                            parseFloat(e.target.value) || 0
                                          )
                                        }
                                        sx={{ flex: 1 }}
                                        inputProps={{ step: "0.000001" }}
                                      />
                                      <TextField
                                        size="small"
                                        label="Longitude"
                                        type="number"
                                        value={day.start_location?.longitude || ""}
                                        onChange={(e) =>
                                          updateItineraryDay(
                                            catIndex,
                                            pkgIndex,
                                            dayIndex,
                                            "start_longitude",
                                            parseFloat(e.target.value) || 0
                                          )
                                        }
                                        sx={{ flex: 1 }}
                                        inputProps={{ step: "0.000001" }}
                                      />
                                      <Button
                                        variant="outlined"
                                        size="small"
                                        startIcon={<LocationOnIcon />}
                                        onClick={() => openLocationPicker(catIndex, pkgIndex, dayIndex, "start")}
                                        sx={{
                                          color: "#6B4E3D",
                                          borderColor: "#6B4E3D",
                                          "&:hover": {
                                            borderColor: "#B85C38",
                                            backgroundColor: "rgba(107, 78, 61, 0.1)",
                                          },
                                        }}
                                      >
                                        Pick on Map
                                      </Button>
                                    </Box>
                                    {day.start_location?.latitude && day.start_location?.longitude && (
                                      <Typography variant="caption" sx={{ color: "text.secondary", mt: 0.5, display: "block" }}>
                                        Start: {day.start_location.latitude.toFixed(6)}, {day.start_location.longitude.toFixed(6)}
                                      </Typography>
                                    )}
                                  </Box>

                                  {/* End Location - Optional */}
                                  {day.end_location ? (
                                    <Box>
                                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                                        <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                          End Location (optional)
                                        </Typography>
                                        <Button
                                          size="small"
                                          onClick={() => removeEndLocation(catIndex, pkgIndex, dayIndex)}
                                          sx={{ minWidth: "auto", p: 0.5 }}
                                        >
                                          <CloseIcon fontSize="small" />
                                        </Button>
                                      </Box>
                                      <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
                                        <TextField
                                          size="small"
                                          label="Latitude"
                                          type="number"
                                          value={day.end_location?.latitude || ""}
                                          onChange={(e) =>
                                            updateItineraryDay(
                                              catIndex,
                                              pkgIndex,
                                              dayIndex,
                                              "end_latitude",
                                              parseFloat(e.target.value) || 0
                                            )
                                          }
                                          sx={{ flex: 1 }}
                                          inputProps={{ step: "0.000001" }}
                                        />
                                        <TextField
                                          size="small"
                                          label="Longitude"
                                          type="number"
                                          value={day.end_location?.longitude || ""}
                                          onChange={(e) =>
                                            updateItineraryDay(
                                              catIndex,
                                              pkgIndex,
                                              dayIndex,
                                              "end_longitude",
                                              parseFloat(e.target.value) || 0
                                            )
                                          }
                                          sx={{ flex: 1 }}
                                          inputProps={{ step: "0.000001" }}
                                        />
                                        <Button
                                          variant="outlined"
                                          size="small"
                                          startIcon={<LocationOnIcon />}
                                          onClick={() => openLocationPicker(catIndex, pkgIndex, dayIndex, "end")}
                                          sx={{
                                            color: "#6B4E3D",
                                            borderColor: "#6B4E3D",
                                            "&:hover": {
                                              borderColor: "#B85C38",
                                              backgroundColor: "rgba(107, 78, 61, 0.1)",
                                            },
                                          }}
                                        >
                                          Pick on Map
                                        </Button>
                                      </Box>
                                      {day.end_location?.latitude && day.end_location?.longitude && (
                                        <Typography variant="caption" sx={{ color: "text.secondary", mt: 0.5, display: "block" }}>
                                          End: {day.end_location.latitude.toFixed(6)}, {day.end_location.longitude.toFixed(6)}
                                        </Typography>
                                      )}
                                    </Box>
                                  ) : (
                                    <Button
                                      size="small"
                                      variant="text"
                                      startIcon={<AddIcon />}
                                      onClick={() => addEndLocation(catIndex, pkgIndex, dayIndex)}
                                      sx={{ mt: -1 }}
                                    >
                                      Add End Location (for routes)
                                    </Button>
                                  )}
                                </Stack>
                              </Card>
                            ))}
                            <Button
                              size="small"
                              startIcon={<AddIcon />}
                              onClick={() => addItineraryDay(catIndex, pkgIndex)}
                              sx={{ mt: 1 }}
                            >
                              Add Day
                            </Button>
                          </Box>
                        </Stack>
                      </Card>
                    ))}
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </AccordionDetails>
        </Accordion>
      ))}

      {/* Location Picker Dialog */}
      {locationPickerState.open && (
        <LocationPicker
          open={locationPickerState.open}
          onClose={() => setLocationPickerState({ open: false, catIndex: null, pkgIndex: null, dayIndex: null, locationType: null })}
          onSelect={handleLocationSelect}
          initialLat={
            locationPickerState.catIndex !== null &&
            locationPickerState.pkgIndex !== null &&
            locationPickerState.dayIndex !== null &&
            locationPickerState.locationType
              ? (locationPickerState.locationType === "start"
                  ? packages[locationPickerState.catIndex]?.packages[locationPickerState.pkgIndex]?.itinerary?.[locationPickerState.dayIndex]?.start_location?.latitude
                  : packages[locationPickerState.catIndex]?.packages[locationPickerState.pkgIndex]?.itinerary?.[locationPickerState.dayIndex]?.end_location?.latitude)
              : null
          }
          initialLng={
            locationPickerState.catIndex !== null &&
            locationPickerState.pkgIndex !== null &&
            locationPickerState.dayIndex !== null &&
            locationPickerState.locationType
              ? (locationPickerState.locationType === "start"
                  ? packages[locationPickerState.catIndex]?.packages[locationPickerState.pkgIndex]?.itinerary?.[locationPickerState.dayIndex]?.start_location?.longitude
                  : packages[locationPickerState.catIndex]?.packages[locationPickerState.pkgIndex]?.itinerary?.[locationPickerState.dayIndex]?.end_location?.longitude)
              : null
          }
        />
      )}

      {packages.length === 0 && (
        <Card sx={{ p: 4, textAlign: "center", border: "2px dashed #e0e0e0" }}>
          <ImageIcon sx={{ fontSize: 48, opacity: 0.3, mb: 1 }} />
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            No categories yet. Click "Add Category" to get started.
          </Typography>
        </Card>
      )}
    </Box>
  );
};

export default PackageManager;

