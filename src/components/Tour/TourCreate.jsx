import React, { useState } from "react";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  CircularProgress,
  Alert,
  IconButton,
  Checkbox,
  FormControlLabel,
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

// Route Stage Form Component for TourCreate
const RouteStageForm = ({ editingStage, routeStages, onSave, onCancel }) => {
  const [stageForm, setStageForm] = useState({
    stage: editingStage ? editingStage.stage : (Math.max(...[0, ...routeStages.map(s => s.stage)]) + 1),
    name: editingStage ? editingStage.name : "",
    description: editingStage ? editingStage.description : "",
    longitude: editingStage ? editingStage.longitude || "" : "",
    latitude: editingStage ? editingStage.latitude || "" : "",
    duration: editingStage ? editingStage.duration : "",
    activities: editingStage ? (editingStage.activities || []) : [],
    accommodation: editingStage ? editingStage.accommodation || "" : "",
    meals: editingStage ? editingStage.meals || "" : "",
    transportation: editingStage ? editingStage.transportation || "" : "",
    highlights: editingStage ? (editingStage.highlights || []) : [],
    tips: editingStage ? editingStage.tips || "" : "",
    wildlife: editingStage ? (editingStage.wildlife || []) : [],
  });
  const [saving, setSaving] = useState(false);

  const handleStageInputChange = (field, value) => {
    setStageForm((prev) => ({ ...prev, [field]: value }));
  };

  const isStageFormValid = () =>
    stageForm.stage &&
    stageForm.name.trim() &&
    stageForm.description.trim() &&
    stageForm.duration.trim();

  return (
    <Box sx={{ bgcolor: "white", p: 3, borderRadius: 2, border: "1px solid #e0e0e0" }}>
      <Typography variant="h6" sx={{ mb: 3 }}>
        {editingStage ? "Edit Stage" : "Add New Stage"}
      </Typography>

      <Stack spacing={3}>
        <TextField
          fullWidth
          label="Stage Number"
          type="number"
          value={stageForm.stage}
          onChange={(e) => handleStageInputChange("stage", parseInt(e.target.value) || 1)}
          inputProps={{ min: 1 }}
          required
        />
        <TextField
          fullWidth
          label="Duration"
          value={stageForm.duration}
          onChange={(e) => handleStageInputChange("duration", e.target.value)}
          placeholder="e.g., 2 Days"
          required
        />

        <TextField
          fullWidth
          label="Stage Name"
          value={stageForm.name}
          onChange={(e) => handleStageInputChange("name", e.target.value)}
          placeholder="e.g., Maasai Mara National Reserve"
          required
        />

        <TextField
          fullWidth
          label="Description"
          multiline
          rows={3}
          value={stageForm.description}
          onChange={(e) => handleStageInputChange("description", e.target.value)}
          placeholder="Detailed description of this stage..."
          required
        />

        <LocationMapPicker
          latitude={stageForm.latitude}
          longitude={stageForm.longitude}
          onLocationChange={(lat, lng) => {
            handleStageInputChange("latitude", lat);
            handleStageInputChange("longitude", lng);
          }}
        />

        <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
          <TextField
            fullWidth
            label="Latitude"
            type="number"
            value={stageForm.latitude || ""}
            onChange={(e) => handleStageInputChange("latitude", e.target.value)}
            placeholder="e.g., -1.4167"
            step="any"
            helperText="Auto-filled when you select a location"
          />
          <TextField
            fullWidth
            label="Longitude"
            type="number"
            value={stageForm.longitude || ""}
            onChange={(e) => handleStageInputChange("longitude", e.target.value)}
            placeholder="e.g., 35.4167"
            step="any"
            helperText="Auto-filled when you select a location"
          />
        </Box>

        <TextField
          fullWidth
          label="Accommodation"
          value={stageForm.accommodation}
          onChange={(e) => handleStageInputChange("accommodation", e.target.value)}
          placeholder="e.g., Luxury tented camp in the heart of Maasai Mara"
        />

        <TextField
          fullWidth
          label="Meals Included"
          value={stageForm.meals}
          onChange={(e) => handleStageInputChange("meals", e.target.value)}
          placeholder="e.g., All meals included (breakfast, lunch, dinner)"
        />

        <TextField
          fullWidth
          label="Transportation"
          value={stageForm.transportation}
          onChange={(e) => handleStageInputChange("transportation", e.target.value)}
          placeholder="e.g., 4x4 safari vehicle with pop-up roof"
        />

        <ChipArrayField
          label="Wildlife to Spot"
          value={stageForm.wildlife}
          onChange={(value) => handleStageInputChange("wildlife", value)}
          placeholder="Add wildlife (e.g., Lions)"
        />

        <TextField
          fullWidth
          label="Travel Tips"
          multiline
          rows={2}
          value={stageForm.tips}
          onChange={(e) => handleStageInputChange("tips", e.target.value)}
          placeholder="e.g., Best time: July-October for migration. Bring binoculars and warm layers."
        />

        <ChipArrayField
          label="Activities"
          value={stageForm.activities}
          onChange={(value) => handleStageInputChange("activities", value)}
          placeholder="Add an activity (e.g., Game Drives)"
        />

        <ChipArrayField
          label="Key Highlights"
          value={stageForm.highlights}
          onChange={(value) => handleStageInputChange("highlights", value)}
          placeholder="Add a highlight (e.g., Big Five sightings)"
        />

        <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
          <Button
            variant="outlined"
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              if (editingStage) {
                // Update existing stage
                setRouteStages(prev =>
                  prev.map(s => s.id === editingStage.id ? { ...stageForm, id: editingStage.id } : s)
                    .sort((a, b) => a.stage - b.stage)
                );
              } else {
                // Add new stage
                setRouteStages(prev => [...prev, { ...stageForm, id: Date.now() }].sort((a, b) => a.stage - b.stage));
              }
              onSave();
            }}
            disabled={!isStageFormValid() || saving}
            sx={{
              background: "linear-gradient(135deg, #6B4E3D 0%, #B85C38 100%)",
              "&:hover": { background: "linear-gradient(135deg, #8B4225 0%, #6B4E3D 100%)" },
            }}
          >
            {editingStage ? "Update Stage" : "Add Stage"}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
};

const TourCreate = () => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [featuredFile, setFeaturedFile] = useState(null);
  const [featuredPreview, setFeaturedPreview] = useState(null);

  const [packageForm, setPackageForm] = useState({
    title: "",
    description: "",
    duration: "",
    price: "",
    pricePerPerson: "per person",
    groupSize: "",
    type: "All-inclusive",
    rating: 0,
    highlights: [],
    included: [],
    isActive: true,
  });

  const [routeStages, setRouteStages] = useState([]);
  const [editingStage, setEditingStage] = useState(null);
  const [showStageForm, setShowStageForm] = useState(false);

  const categoryOptions = ["Wildlife", "Travel Tips", "Conservation", "Photography", "Guides", "Other"];

  const handleInputChange = (field, value) => {
    setPackageForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      Swal.fire({
        icon: "error",
        title: "File too large",
        text: `${file.name} is larger than 10MB`,
      });
      return;
    }
    if (!file.type.startsWith("image/")) {
      Swal.fire({
        icon: "error",
        title: "Invalid file type",
        text: `${file.name} is not an image`,
      });
      return;
    }
    const reader = new FileReader();
    setFeaturedFile(file);
    reader.onloadend = () => setFeaturedPreview(reader.result);
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const removeFeaturedFile = () => {
    setFeaturedFile(null);
    setFeaturedPreview(null);
  };


  const isFormValid = () =>
    packageForm.title.trim() &&
    packageForm.description.trim() &&
    packageForm.duration.trim() &&
    packageForm.price.trim() &&
    packageForm.groupSize.trim();

  const handleCreate = async () => {
    try {
      setSaving(true);
      setError(null);

      const token = localStorage.getItem("token");
      const formData = new FormData();

      // Map package fields
      formData.append("title", packageForm.title);
      formData.append("description", packageForm.description);
      formData.append("duration", packageForm.duration);
      formData.append("price", packageForm.price);
      formData.append("pricePerPerson", packageForm.pricePerPerson);
      formData.append("groupSize", packageForm.groupSize);
      formData.append("type", packageForm.type);
      formData.append("rating", packageForm.rating || 0);
      formData.append("isActive", packageForm.isActive);

      // Process highlights array
      if (packageForm.highlights && packageForm.highlights.length > 0) {
        formData.append("highlights", JSON.stringify(packageForm.highlights));
      }

      // Process included array
      if (packageForm.included && packageForm.included.length > 0) {
        formData.append("included", JSON.stringify(packageForm.included));
      }

      if (featuredFile) {
        formData.append("image", featuredFile);
      }

      const response = await fetch("/api/packages", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        const packageId = result.data.id;

        // Create route stages if any were added
        if (routeStages.length > 0) {
          try {
            const stagesToCreate = routeStages.map(stage => ({
              packageId,
              stage: stage.stage,
              name: stage.name,
              description: stage.description,
              duration: stage.duration,
              longitude: stage.longitude ? parseFloat(stage.longitude) : null,
              latitude: stage.latitude ? parseFloat(stage.latitude) : null,
              activities: stage.activities,
              accommodation: stage.accommodation || null,
              meals: stage.meals || null,
              transportation: stage.transportation || null,
              highlights: stage.highlights,
              tips: stage.tips || null,
              wildlife: stage.wildlife || null,
            }));

            const stagesResponse = await fetch("/api/route-stages/bulk", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                packageId,
                stages: stagesToCreate,
              }),
            });

            const stagesResult = await stagesResponse.json();

            if (!stagesResult.success) {
              console.warn("Package created but some route stages failed:", stagesResult.errors);
              // Don't throw error here, package was created successfully
            }
          } catch (stagesError) {
            console.warn("Package created but route stages creation failed:", stagesError);
            // Don't throw error here, package was created successfully
          }
        }

        setFeaturedFile(null);
        setFeaturedPreview(null);

        const successMessage = routeStages.length > 0
          ? `Package created successfully with ${routeStages.length} itinerary stage${routeStages.length > 1 ? 's' : ''}!`
          : "Package created successfully!";

        await Swal.fire({
          title: "Success!",
          text: successMessage,
          icon: "success",
          confirmButtonColor: "#667eea",
        });

        // Navigate to view the created package
        navigate(`/tours/${packageId}`);
      } else {
        throw new Error(result.message || "Failed to create package");
      }
    } catch (err) {
      console.error("Error creating package:", err);
      setError(err.message || "Failed to create package");
      await Swal.fire({
        title: "Error!",
        text: err.message || "Failed to create package",
        icon: "error",
        confirmButtonColor: "#667eea",
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
              onClick={() => navigate("/tours")}
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
              Create Safari Package
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
                label="Package Title"
                value={packageForm.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                required
              />
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={4}
                value={packageForm.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                required
              />
              <TextField
                fullWidth
                label="Duration"
                value={packageForm.duration}
                onChange={(e) => handleInputChange("duration", e.target.value)}
                placeholder="e.g., 8 Days / 7 Nights"
                required
              />
              <TextField
                fullWidth
                label="Group Size"
                value={packageForm.groupSize}
                onChange={(e) => handleInputChange("groupSize", e.target.value)}
                placeholder="e.g., 2-6 People"
                required
              />
              <TextField
                fullWidth
                label="Price"
                value={packageForm.price}
                onChange={(e) => handleInputChange("price", e.target.value)}
                placeholder="e.g., $2,500"
                required
              />
              <FormControl fullWidth>
                <InputLabel>Package Type</InputLabel>
                <Select
                  value={packageForm.type}
                  label="Package Type"
                  onChange={(e) => handleInputChange("type", e.target.value)}
                >
                  <MenuItem value="All-inclusive">All-inclusive</MenuItem>
                  <MenuItem value="Full board">Full board</MenuItem>
                  <MenuItem value="Half board">Half board</MenuItem>
                  <MenuItem value="Bed & breakfast">Bed & breakfast</MenuItem>
                </Select>
              </FormControl>
              <ChipArrayField
                label="Highlights"
                value={packageForm.highlights}
                onChange={(value) => handleInputChange("highlights", value)}
                placeholder="Add a highlight (e.g., Big Five Safari)"
              />
              <ChipArrayField
                label="What's Included"
                value={packageForm.included}
                onChange={(value) => handleInputChange("included", value)}
                placeholder="Add an included item (e.g., Accommodation)"
              />
              <TextField
                fullWidth
                label="Rating"
                type="number"
                value={packageForm.rating}
                onChange={(e) => handleInputChange("rating", parseFloat(e.target.value) || 0)}
                inputProps={{ min: 0, max: 5, step: 0.1 }}
                helperText="Rating out of 5.0"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={packageForm.isActive}
                    onChange={(e) => handleInputChange("isActive", e.target.checked)}
                  />
                }
                label="Active (available for booking)"
              />
              <Box>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Package Image
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
                  Main hero image for the package (recommended: 1200x800px)
                </Typography>
                <Box mb={2}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    style={{ display: "none" }}
                    id="package-image-upload"
                  />
                  <label htmlFor="package-image-upload">
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
                      Upload Package Image
                    </Button>
                  </label>
                </Box>

                {featuredPreview ? (
                  <Box
                    sx={{
                      p: 2,
                      backgroundColor: "#f8f9fa",
                      borderRadius: 2,
                      border: "1px solid #e0e0e0",
                      position: "relative",
                      maxWidth: 400,
                    }}
                  >
                    <IconButton
                      onClick={removeFeaturedFile}
                      sx={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                        color: "white",
                        "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.7)" },
                        zIndex: 2,
                      }}
                      size="small"
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                    <img
                      src={featuredPreview}
                      alt="Package"
                      style={{
                        width: "100%",
                        height: "200px",
                        objectFit: "cover",
                        borderRadius: "8px",
                        marginBottom: "8px",
                      }}
                    />
                    <Typography variant="caption" sx={{ color: "#333" }}>
                      {featuredFile?.name}
                    </Typography>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      border: "2px dashed #ccc",
                      borderRadius: 2,
                      p: 3,
                      textAlign: "center",
                      bgcolor: "#f9f9f9",
                      maxWidth: 400,
                    }}
                  >
                    <ImageIcon sx={{ fontSize: 48, opacity: 0.3 }} />
                    <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>
                      No image selected. Click "Upload Package Image" to add one.
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Route Stages Management Section */}
              <Box sx={{ mt: 4, p: 3, bgcolor: "#f8f6f2", borderRadius: 2, border: "1px solid #e0d6c8" }}>
                <Typography variant="h6" sx={{ mb: 2, color: "#6B4E3D", fontWeight: 700 }}>
                  Safari Itinerary (Optional)
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
                  Build your safari itinerary by adding route stages. You can also add stages later from the edit page.
                </Typography>

                {/* Route Stages List */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                    Current Itinerary ({routeStages.length} stages)
                  </Typography>

                  {routeStages.length === 0 ? (
                    <Box sx={{ textAlign: "center", py: 4, bgcolor: "white", borderRadius: 2, border: "2px dashed #e0d6c8" }}>
                      <Typography variant="body2" color="text.secondary">
                        No itinerary stages added yet.
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Click "Add Stage" below to start building your safari itinerary.
                      </Typography>
                    </Box>
                  ) : (
                    <Stack spacing={2}>
                      {routeStages
                        .sort((a, b) => a.stage - b.stage)
                        .map((stage, index) => (
                        <Box
                          key={stage.id}
                          sx={{
                            p: 2,
                            bgcolor: "white",
                            borderRadius: 2,
                            border: "1px solid #e0e0e0",
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                          }}
                        >
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: "50%",
                              bgcolor: "#6B4E3D",
                              color: "white",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 700,
                              fontSize: "1.1rem",
                            }}
                          >
                            {stage.stage}
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {stage.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {stage.duration} • {stage.description?.slice(0, 80)}...
                            </Typography>
                          </Box>
                          <Box sx={{ display: "flex", gap: 1 }}>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => {
                                setEditingStage(stage);
                                setShowStageForm(true);
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              size="small"
                              color="error"
                              variant="outlined"
                              onClick={() => {
                                setRouteStages(prev => prev.filter(s => s.id !== stage.id));
                              }}
                            >
                              Remove
                            </Button>
                          </Box>
                        </Box>
                      ))}
                    </Stack>
                  )}
                </Box>

                {/* Add/Edit Stage Form */}
                <Box sx={{ mb: 3 }}>
                  <Button
                    variant="contained"
                    onClick={() => {
                      setEditingStage(null);
                      setShowStageForm(!showStageForm);
                    }}
                    sx={{
                      bgcolor: "#6B4E3D",
                      "&:hover": { bgcolor: "#8B4225" },
                    }}
                  >
                    {showStageForm ? "Cancel" : "+ Add Stage"}
                  </Button>
                </Box>

                {showStageForm && (
                  <RouteStageForm
                    editingStage={editingStage}
                    routeStages={routeStages}
                    onSave={() => {
                      setShowStageForm(false);
                      setEditingStage(null);
                    }}
                    onCancel={() => {
                      setShowStageForm(false);
                      setEditingStage(null);
                    }}
                  />
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
                  background: "linear-gradient(135deg, #6B4E3D 0%, #B85C38 100%)",
                  color: "white",
                  "&:hover": {
                    background: "linear-gradient(135deg, #8B4225 0%, #6B4E3D 100%)",
                  },
                  "&:disabled": {
                    background: "#e0e0e0",
                    color: "#999",
                  },
                }}
              >
                {saving ? "Creating..." : "Create Safari Package"}
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate("/tours")}
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

export default TourCreate;

