import React, { useEffect, useState } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import Navbar from "./Navbar";
import Settings from "../Pages/Settings";
import NotFound from "../Pages/NotFound";
import Blogs from "./Blogs/Blogs";
import BlogCreate from "./Blogs/BlogCreate";
import BlogView from "./Blogs/BlogView";
import BlogEdit from "./Blogs/BlogEdit";
import Camps from "./Camps&Lodges/Camps";
import CampCreate from "./Camps&Lodges/CampCreate";
import CampView from "./Camps&Lodges/CampView";
import CampEdit from "./Camps&Lodges/CampEdit";
import Destinations from "./destinations/Destinations";
import DestinationCreate from "./destinations/DestinationCreate";
import DestinationView from "./destinations/DestinationView";
import DestinationEdit from "./destinations/DestinationEdit";
import Form from "./Form/Form";
import FormCreate from "./Form/FormCreate";
import FormView from "./Form/FormView";
import FormEdit from "./Form/FormEdit";
import FormSubmission from "./Form/FormSubmissions";
import Review from "./Review/Review";
import CharityMap from "../CharityMap";
import Documents from "./Documents/Documents";
import UsersTable from "./Users/UsersTable";
import Analytics from "./Analytics/Analytics";
import Audit from "./Audit/Audit";
import PublicMembers from "./PublicMembers/PublicMembers";
import Tour from "./Tour/Tour";
import TourCreate from "./Tour/TourCreate";
import TourView from "./Tour/TourView";
import TourEdit from "./Tour/TourEdit";
import GalleryList from "./Gallery/GalleryList";
import GalleryView from "./Gallery/GalleryView";
import GalleryCreate from "./Gallery/GalleryCreate";
import GalleryEdit from "./Gallery/GalleryEdit";

function PageRoutes() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load user from localStorage on component mount
    const savedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
      setLoading(false);
    } else {
      // Redirect to login if no user or token
      window.location.href = "/";
    }
  }, []);

  useEffect(() => {
    if (user) {
      setLoading(false);
    }
  }, [user]);

  return (
    <Box sx={{ display: "flex" }}>
      <Navbar user={user} setUser={setUser} />
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 9 }}>
        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100vh",
            }}
          >
            <CircularProgress />
          </Box>
        ) : (
          <Routes>
            <Route path="home" element={<Navigate to="/analytics" replace />} />
            <Route path="blogs" element={<Blogs />} />
            <Route path="blogs/create" element={<BlogCreate />} />
            <Route path="blogs/:id" element={<BlogView />} />
            <Route path="blogs/:id/edit" element={<BlogEdit />} />
            <Route path="camp-lodges" element={<Camps />} />
            <Route path="camp-lodges/create" element={<CampCreate />} />
            <Route path="camp-lodges/:id" element={<CampView />} />
            <Route path="camp-lodges/:id/edit" element={<CampEdit />} />
            <Route path="forms" element={<Form />} />
            <Route path="forms/create" element={<FormCreate />} />
            <Route path="forms/:id" element={<FormView />} />
            <Route path="forms/:id/edit" element={<FormEdit />} />
            <Route path="forms/:form_id/submissions" element={<FormSubmission />} />
            <Route path="destinations" element={<Destinations />} />
            <Route path="destinations/create" element={<DestinationCreate />} />
            <Route path="destinations/:id" element={<DestinationView />} />
            <Route path="destinations/:id/edit" element={<DestinationEdit />} />
            <Route path="tours" element={<Tour />} />
            <Route path="tours/create" element={<TourCreate />} />
            <Route path="tours/:id" element={<TourView />} />
            <Route path="tours/:id/edit" element={<TourEdit />} />
            <Route path="gallery" element={<GalleryList />} />
            <Route path="gallery/create" element={<GalleryCreate />} />
            <Route path="gallery/:id" element={<GalleryView />} />
            <Route path="gallery/:id/edit" element={<GalleryEdit />} />
            <Route path="testimonies" element={<Navigate to="/reviews" replace />} />
            <Route path="reviews" element={<Review />} />
            <Route path="map" element={<CharityMap />} />
            <Route path="documents" element={<Documents />} />
            <Route path="public-members" element={<PublicMembers />} />
            <Route path="audit" element={<Audit />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="users" element={<UsersTable />} />
            <Route path="settings" element={<Settings user={user} />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        )}
      </Box>
    </Box>
  );
}

export default PageRoutes;
