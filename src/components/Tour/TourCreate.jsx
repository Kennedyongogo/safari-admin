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
  Tabs,
  Tab,
  Stepper,
  Step,
  StepLabel,
} from "@mui/material";
import {
  Save,
  ArrowBack,
  CloudUpload,
  Image as ImageIcon,
  Close as CloseIcon,
  Article,
  Add,
  CheckCircle,
  RadioButtonUnchecked,
  Delete,
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
const RouteStageForm = ({ editingStage, routeStages, setRouteStages, onSave, onCancel }) => {
  const [stageImagePreviews, setStageImagePreviews] = useState([]);
  const [stageImageFiles, setStageImageFiles] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(new Set()); // Track which images are uploading

  // Helper function to build proper image URLs
  const buildStageImageUrl = (imagePath) => {
    if (!imagePath) return null;
    // Don't display blob URLs as they are temporary and invalid when retrieved from database
    if (imagePath.startsWith("blob:")) return null;
    if (imagePath.startsWith("http")) return imagePath; // Full URLs
    if (imagePath.startsWith("/")) return imagePath; // Absolute paths
    return `/${imagePath}`; // Relative paths
  };

  // Upload images to server and get permanent URLs
  const uploadStageImages = async (files) => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('stage_images', file);
    });

    const token = localStorage.getItem("token");
    const response = await fetch("/api/uploads/stage-images", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || "Failed to upload images");
    }

    return result.data.urls; // Return array of permanent URLs
  };

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
    images: editingStage ? (editingStage.images || []) : [],
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

        {/* Stage Images Gallery */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: "#6B4E3D" }}>
            Stage Images Gallery
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
            Upload multiple images showcasing what visitors can expect at this stage
          </Typography>

          <Box sx={{ mb: 2 }}>
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="stage-images-upload"
              multiple
              type="file"
              onChange={async (e) => {
                const files = Array.from(e.target.files);
                if (files.length > 0) {
                  // Create unique IDs for tracking uploads
                  const uploadIds = files.map((_, index) => `upload-${Date.now()}-${index}`);

                  // Create instant previews
                  const previews = [];
                  const fileObjects = [];

                  files.forEach((file, index) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      previews[index] = { id: uploadIds[index], url: reader.result };
                      fileObjects[index] = { id: uploadIds[index], file };

                      // Update state when all previews are ready
                      if (previews.filter(p => p).length === files.length) {
                        setStageImagePreviews(prev => [...prev, ...previews]);
                        setStageImageFiles(prev => [...prev, ...fileObjects]);
                        // Mark all as uploading
                        setUploadingImages(new Set(uploadIds));
                      }
                    };
                    reader.readAsDataURL(file);
                  });

                  // Upload images in background
                  try {
                    const permanentUrls = await uploadStageImages(files);
                    handleStageInputChange("images", [...(stageForm.images || []), ...permanentUrls]);

                    // Remove previews for successfully uploaded images
                    setUploadingImages(new Set());
                    setStageImagePreviews([]);
                    setStageImageFiles([]);
                  } catch (error) {
                    console.error("Failed to upload images:", error);
                    Swal.fire({
                      icon: "error",
                      title: "Upload Failed",
                      text: error.message || "Failed to upload images",
                    });
                    // Remove failed previews and reset uploading state
                    setUploadingImages(new Set());
                    setStageImagePreviews([]);
                    setStageImageFiles([]);
                  }
                }
                e.target.value = null; // Reset input
              }}
            />
            <label htmlFor="stage-images-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<CloudUpload />}
                sx={{
                  borderColor: "#6B4E3D",
                  color: "#6B4E3D",
                  "&:hover": {
                    borderColor: "#B85C38",
                    backgroundColor: "rgba(184, 92, 56, 0.04)",
                  },
                }}
              >
                Upload Images
              </Button>
            </label>
          </Box>

          {/* Display image previews and uploaded images */}
          {stageImagePreviews.length > 0 || (stageForm.images && stageForm.images.filter(img => img !== null).length > 0) ? (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
              {/* Show instant previews for uploading images */}
              {stageImagePreviews.map((preview) => (
                uploadingImages.has(preview.id) && (
                  <Box
                    key={`preview-${preview.id}`}
                    sx={{
                      position: "relative",
                      width: 120,
                      height: 120,
                      borderRadius: 2,
                      overflow: "hidden",
                      border: "2px solid #4caf50",
                      backgroundColor: "#f5f5f5",
                    }}
                  >
                    <Box
                      component="img"
                      src={preview.url}
                      alt={`Preview ${preview.id}`}
                      sx={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                    <Box
                      sx={{
                        position: "absolute",
                        top: 4,
                        right: 4,
                        backgroundColor: "rgba(76, 175, 80, 0.9)",
                        borderRadius: "50%",
                        width: 24,
                        height: 24,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <CircularProgress size={16} sx={{ color: "white" }} />
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{
                        position: "absolute",
                        bottom: 4,
                        left: 4,
                        right: 4,
                        color: "white",
                        backgroundColor: "rgba(0, 0, 0, 0.6)",
                        borderRadius: 1,
                        px: 1,
                        textAlign: "center",
                        fontSize: "0.7rem",
                      }}
                    >
                      Uploading...
                    </Typography>
                  </Box>
                )
              ))}

              {/* Show uploaded images only when not uploading */}
              {uploadingImages.size === 0 && stageForm.images && stageForm.images.map((imageUrl, index) =>
                imageUrl !== null && (
                  <Box
                    key={`uploaded-${index}-${imageUrl}`}
                    sx={{
                      position: "relative",
                      width: 120,
                      height: 120,
                      borderRadius: 2,
                      overflow: "hidden",
                      border: "2px solid #e0e0e0",
                    }}
                  >
                    <Box
                      component="img"
                      src={imageUrl}
                      alt={`Stage image ${index + 1}`}
                      sx={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                      onError={(e) => {
                        console.error(`Failed to load image: ${imageUrl}`);
                        e.target.style.display = 'none';
                      }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => {
                        const newImages = stageForm.images.filter((_, i) => i !== index);
                        handleStageInputChange("images", newImages);
                      }}
                      sx={{
                        position: "absolute",
                        top: 4,
                        right: 4,
                        backgroundColor: "rgba(0, 0, 0, 0.6)",
                        color: "white",
                        "&:hover": {
                          backgroundColor: "rgba(0, 0, 0, 0.8)",
                        },
                      }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                )
              )}
            </Box>
          ) : null}
        </Box>

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
            onClick={async () => {
              setSaving(true);
              try {
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
              } finally {
                setSaving(false);
              }
            }}
            disabled={!isStageFormValid() || saving}
            sx={{
              background: "linear-gradient(135deg, #6B4E3D 0%, #B85C38 100%)",
              "&:hover": { background: "linear-gradient(135deg, #8B4225 0%, #6B4E3D 100%)" },
            }}
          >
            {saving ? "Saving..." : (editingStage ? "Update Stage" : "Add Stage")}
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

  // Tab management
  const [activeTab, setActiveTab] = useState(0);
  const [createdPackageId, setCreatedPackageId] = useState(null);
  const [packageCreated, setPackageCreated] = useState(false);

  const [packageForm, setPackageForm] = useState({
    title: "",
    description: "",
    duration: "",
    price: "",
    pricePerPerson: "",
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

  const handleTabChange = (event, newValue) => {
    // Prevent switching to route stages tab if package not created
    if (newValue === 1 && !packageCreated) {
      Swal.fire({
        icon: "warning",
        title: "Create Package First",
        text: "Please create and save the package details before adding route stages.",
        confirmButtonColor: "#667eea",
      });
      return;
    }
    setActiveTab(newValue);
  };

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

  const handleCreatePackage = async () => {
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
        setCreatedPackageId(packageId);
        setPackageCreated(true);
        // Don't clear featuredFile and featuredPreview so user can still see the image when going back

        await Swal.fire({
          title: "Package Created!",
          text: "Package created successfully! You can now add route stages.",
          icon: "success",
          confirmButtonColor: "#667eea",
        });

        // Automatically switch to route stages tab
        setActiveTab(1);
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

  const handleUpdatePackage = async () => {
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

      const response = await fetch(`/api/packages/${createdPackageId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        await Swal.fire({
          title: "Package Updated!",
          text: "Package details have been updated successfully.",
          icon: "success",
          confirmButtonColor: "#667eea",
        });

        // Switch to stages tab
        setActiveTab(1);
      } else {
        throw new Error(result.message || "Failed to update package");
      }
    } catch (err) {
      console.error("Error updating package:", err);
      setError(err.message || "Failed to update package");
      await Swal.fire({
        title: "Error!",
        text: err.message || "Failed to update package",
        icon: "error",
        confirmButtonColor: "#667eea",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateRouteStages = async () => {
    if (!createdPackageId) {
      Swal.fire({
        icon: "error",
        title: "Package Not Found",
        text: "Please create the package first.",
      });
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const token = localStorage.getItem("token");

      if (routeStages.length === 0) {
        await Swal.fire({
          title: "No Route Stages",
          text: "No route stages to create. Add some stages first.",
          icon: "info",
          confirmButtonColor: "#667eea",
        });
        return;
      }

      const stagesToCreate = routeStages.map(stage => ({
        packageId: createdPackageId,
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
        images: stage.images || [],
      }));


      const stagesResponse = await fetch("/api/route-stages/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          packageId: createdPackageId,
          stages: stagesToCreate,
        }),
      });

      const stagesResult = await stagesResponse.json();

      if (stagesResult.success) {
        const successMessage = `Route stages created successfully! ${stagesResult.data.length} stage${stagesResult.data.length > 1 ? 's' : ''} added to the package.`;

        await Swal.fire({
          title: "Success!",
          text: successMessage,
          icon: "success",
          confirmButtonColor: "#667eea",
        });

        // Navigate to view the completed package
        navigate(`/tours/${createdPackageId}`);
      } else {
        throw new Error(stagesResult.message || "Failed to create route stages");
      }
    } catch (err) {
      console.error("Error creating route stages:", err);
      setError(err.message || "Failed to create route stages");
      await Swal.fire({
        title: "Error!",
        text: err.message || "Failed to create route stages",
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
        <Card
          sx={{
            backgroundColor: "white",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
            border: "1px solid #e0e0e0",
          }}
        >
          <CardContent sx={{ p: 0 }}>
            {/* Header Section */}
            <Box
              sx={{
                background: "linear-gradient(135deg, #6B4E3D 0%, #B85C38 100%)",
                p: 3,
                color: "white",
                position: "relative",
                overflow: "hidden",
                borderRadius: "8px 8px 0 0",
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

            {/* Content Section */}
            <Box sx={{ p: 3 }}>
            {/* Progress Indicator */}
            <Box sx={{ mb: 3 }}>
              <Stepper activeStep={packageCreated ? 1 : 0} alternativeLabel>
                <Step>
                  <StepLabel
                    StepIconComponent={() => (
                      <Box sx={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        bgcolor: packageCreated ? '#4caf50' : '#e0e0e0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {packageCreated ? <CheckCircle sx={{ color: 'white', fontSize: 16 }} /> : <RadioButtonUnchecked sx={{ color: 'white', fontSize: 16 }} />}
                      </Box>
                    )}
                  >
                    Create Package
                  </StepLabel>
                </Step>
                <Step>
                  <StepLabel
                    StepIconComponent={() => (
                      <Box sx={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        bgcolor: routeStages.length > 0 ? '#4caf50' : activeTab === 1 ? '#2196f3' : '#e0e0e0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {routeStages.length > 0 ? <CheckCircle sx={{ color: 'white', fontSize: 16 }} /> : <RadioButtonUnchecked sx={{ color: 'white', fontSize: 16 }} />}
                      </Box>
                    )}
                  >
                    Add Route Stages
                  </StepLabel>
                </Step>
              </Stepper>
            </Box>

            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                aria-label="tour creation tabs"
                sx={{
                  '& .MuiTab-root': {
                    minHeight: 48,
                    textTransform: 'none',
                    fontWeight: 600,
                  }
                }}
              >
                <Tab
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Article sx={{ fontSize: 18 }} />
                      Package Details
                      {packageCreated && <CheckCircle sx={{ color: '#4caf50', fontSize: 16 }} />}
                    </Box>
                  }
                  disabled={false}
                />
                <Tab
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Add sx={{ fontSize: 18 }} />
                      Route Stages
                      {routeStages.length > 0 && (
                        <Chip
                          label={routeStages.length}
                          size="small"
                          sx={{ height: 18, fontSize: '0.7rem', minWidth: 18 }}
                        />
                      )}
                    </Box>
                  }
                  disabled={!packageCreated}
                />
              </Tabs>
            </Box>

            {/* Tab Content */}
            {activeTab === 0 && (
              <Stack spacing={3}>
                <Typography variant="h6" sx={{ color: "#6B4E3D", fontWeight: 600 }}>
                  Package Information
                </Typography>
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
                <TextField
                  fullWidth
                  label="Price Description"
                  value={packageForm.pricePerPerson}
                  onChange={(e) => handleInputChange("pricePerPerson", e.target.value)}
                  placeholder="e.g., per person, per couple, per 10 people"
                  helperText="How the price should be displayed"
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

                <Box display="flex" gap={2} justifyContent="flex-end" sx={{ mt: 3 }}>
                  {packageCreated ? (
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<Save />}
                      onClick={handleUpdatePackage}
                      disabled={!isFormValid() || saving}
                      sx={{
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
                      {saving ? "Updating..." : "Update & Continue to Stages"}
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={saving ? <CircularProgress size={20} /> : <Save />}
                      onClick={handleCreatePackage}
                      disabled={!isFormValid() || saving}
                      sx={{
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
                      {saving ? "Creating Package..." : "Create Package"}
                    </Button>
                  )}
                </Box>
              </Stack>
            )}

            {/* Route Stages Tab */}
            {activeTab === 1 && (
              <Stack spacing={3}>
                <Typography variant="h6" sx={{ color: "#6B4E3D", fontWeight: 600 }}>
                  Safari Itinerary for: {packageForm.title || "Untitled Package"}
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
                  Build your safari itinerary by adding route stages. Each stage represents a day or location in your tour.
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
                              onClick={async () => {
                                const result = await Swal.fire({
                                  title: "Remove stage?",
                                  text: "This stage will be removed from the itinerary.",
                                  icon: "warning",
                                  showCancelButton: true,
                                  confirmButtonColor: "#d33",
                                  cancelButtonColor: "#3085d6",
                                  confirmButtonText: "Yes, remove it",
                                });

                                if (result.isConfirmed) {
                                  setRouteStages(prev => prev.filter(s => s.id !== stage.id));
                                  Swal.fire({
                                    icon: "success",
                                    title: "Removed",
                                    text: "Stage removed from itinerary.",
                                    timer: 1400,
                                    showConfirmButton: false,
                                  });
                                }
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
                    setRouteStages={setRouteStages}
                    onSave={() => {
                      Swal.fire({
                        icon: "success",
                        title: editingStage ? "Stage Updated!" : "Stage Added!",
                        text: editingStage ? "The route stage has been updated successfully." : "The route stage has been added to your package.",
                        timer: 2000,
                        showConfirmButton: false,
                      });
                      setShowStageForm(false);
                      setEditingStage(null);
                    }}
                    onCancel={() => {
                      setShowStageForm(false);
                      setEditingStage(null);
                    }}
                  />
                )}

                <Box display="flex" gap={2} justifyContent="space-between" sx={{ mt: 3 }}>
                  <Button
                    variant="outlined"
                    onClick={() => setActiveTab(0)}
                    sx={{
                      color: "#6B4E3D",
                      borderColor: "#6B4E3D",
                      "&:hover": {
                        borderColor: "#B85C38",
                        backgroundColor: "rgba(107, 78, 61, 0.1)",
                      },
                    }}
                  >
                    ← Back to Package
                  </Button>
                  <Box display="flex" gap={2}>
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={saving ? <CircularProgress size={20} /> : <Save />}
                      onClick={handleCreateRouteStages}
                      disabled={routeStages.length === 0 || saving}
                      sx={{
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
                      {saving ? "Creating Stages..." : `Create ${routeStages.length} Stage${routeStages.length !== 1 ? 's' : ''}`}
                    </Button>
                    <Button
                      variant="outlined"
                      size="large"
                      onClick={() => navigate("/tours")}
                      sx={{
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
                </Box>
              </Stack>
            )}
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default TourCreate;

