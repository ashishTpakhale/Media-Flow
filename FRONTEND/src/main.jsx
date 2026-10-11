import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import Layout from "./layout";
import AuthWrapper from "./wrapper/AuthWrapper";
// Pages
import Home from "./page/home/Home";
import Watch from "./page/watch/Watch";
import HistoryPage from "./page/history/HistoryPage";
import LikedVideos from "./page/likedvideos/LikedVideos";
import Subscriptions from "./page/subscriptions/Subscriptions";
import SearchResults from "./page/searches/SearchResults";
import SearchResultsPage from "./page/searches/SearchContext";
import ChannelPage from "./page/yourchannel/channnel";
import UploadPage from "./page/videoUpload/UploadPage";
import ChannelPageview from "./page/viewchannel/channelpage";
// Auth / standalone pages
import Signin from "./AUTH/Signin";
import Signup from "./AUTH/Signup";
import VideoAnalyticsPage from "./page/yourchannel/VideoAnalyticsPage";
createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Routes>
      {/* ================= PUBLIC ROUTES ================= */}
      <Route path="/signin" element={<Signin />} />
      <Route path="/signup" element={<Signup />} />
      {/* ================= PROTECTED ROUTES (NO LAYOUT) ================= */}
      <Route
        path="/channel"
        element={
          <AuthWrapper>
            <ChannelPage />
          </AuthWrapper>
        }
      /> 
      <Route
        path="/studio/analytics/video/:videoId"
        element={
          <AuthWrapper>
            <VideoAnalyticsPage />
          </AuthWrapper>
        }
      />
      {/* ================= ROUTES WITH LAYOUT ================= */}
      <Route element={<Layout />}>

        {/* Public with layout */}
<Route
  path="/"
  element={
    <AuthWrapper>
      <Home />
    </AuthWrapper>
  }
/>        <Route path="/videos/:id" element={<Watch />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/results" element={<SearchResultsPage />} />
        {/* Protected with layout */}
        <Route
          path="/feed/history"
          element={
            <AuthWrapper>
              <HistoryPage />
            </AuthWrapper>
          }
        />
        <Route
          path="/liked-videos"
          element={
            <AuthWrapper>
              <LikedVideos />
            </AuthWrapper>
          }
        />
        <Route
          path="/subscriptions"
          element={
            <AuthWrapper>
              <Subscriptions />
            </AuthWrapper>
          }
        />
        <Route
          path="/upload"
          element={
            <AuthWrapper>
              <UploadPage />
            </AuthWrapper>
          }
        />
      <Route
          path="/channel/:channelId"
          element={
            <AuthWrapper>
              <ChannelPageview />
            </AuthWrapper>
          }
        />
      </Route>
    </Routes>
  </BrowserRouter>
);
