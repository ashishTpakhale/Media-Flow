import { API_BASE_URL } from "../../../config/config";
import  { useEffect, useState } from "react";
import { useParams } from "react-router-dom";



const ChannelPageview = () => {
  const { channelId } = useParams();

  const [channel, setChannel] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("home");

  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [subLoading, setSubLoading] = useState(false);

  useEffect(() => {
    fetchChannel();
    fetchSubscriptionStatus();
  }, [channelId]);

  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
  });

  /* ---------------- FETCH CHANNEL ---------------- */
  const fetchChannel = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/channel/${channelId}`);
      const data = await res.json();

      setChannel(data.channel);
      setVideos(data.videos);
      setSubscriberCount(data.channel.subscriberCount || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- SUBSCRIPTION STATUS ---------------- */
  const fetchSubscriptionStatus = async () => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/subscribe/check/${channelId}`,
        { headers: authHeaders() }
      );
      const data = await res.json();
      setIsSubscribed(data.subscribed);
    } catch (err) {
      console.error(err);
    }
  };

  /* ---------------- SUBSCRIBE / UNSUBSCRIBE ---------------- */
  const handleSubscribe = async () => {
    if (subLoading) return;

    setSubLoading(true);
    const prevSubscribed = isSubscribed;

    // optimistic UI
    setIsSubscribed(!prevSubscribed);
    setSubscriberCount((prev) =>
      prevSubscribed ? Math.max(prev - 1, 0) : prev + 1
    );

    try {
      await fetch(`${API_BASE_URL}/subscribe/${channelId}`, {
        method: prevSubscribed ? "DELETE" : "POST",
        headers: authHeaders(),
      });
    } catch (err) {
      console.error(err);

      // rollback on error
      setIsSubscribed(prevSubscribed);
      setSubscriberCount((prev) =>
        prevSubscribed ? prev + 1 : Math.max(prev - 1, 0)
      );
    } finally {
      setSubLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (!num) return 0;
    if (num >= 1e6) return (num / 1e6).toFixed(1) + "M";
    if (num >= 1e3) return (num / 1e3).toFixed(1) + "K";
    return num;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading channel...
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Channel not found
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* BANNER */}
      <div className="w-full h-48 bg-gray-800 overflow-hidden">
        {channel.banner && (
          <img
            src={channel.banner}
            alt="banner"
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* CHANNEL HEADER */}
      <div className="max-w-6xl mx-auto px-6 py-6 flex justify-between items-center">
        <div className="flex gap-6 items-center">
          <img
            src={channel.avatar || "/avatar.png"}
            alt="avatar"
            className="w-24 h-24 rounded-full object-cover border border-gray-700"
          />

          <div>
            <h1 className="text-2xl font-bold">{channel.name}</h1>
            <p className="text-gray-400 text-sm">
              {formatNumber(subscriberCount)} subscribers •{" "}
              {formatNumber(channel.totalViews)} views
            </p>
            <p className="text-gray-500 text-sm mt-1">
              Joined {new Date(channel.joinedAt).toDateString()}
            </p>
          </div>
        </div>

        {/* SUBSCRIBE BUTTON */}
        <button
          onClick={handleSubscribe}
          disabled={subLoading}
          className={`px-6 py-2 rounded-full font-semibold transition ${
            isSubscribed
              ? "bg-gray-700 hover:bg-gray-600"
              : "bg-red-600 hover:bg-red-700 text-white"
          }`}
        >
          {subLoading ? "..." : isSubscribed ? "Subscribed" : "Subscribe"}
        </button>
      </div>

      {/* TABS */}
      <div className="border-b border-gray-800">
        <div className="max-w-6xl mx-auto flex gap-8 px-6">
          {["home", "videos", "about"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 capitalize ${
                activeTab === tab
                  ? "border-b-2 border-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        {activeTab === "home" && (
          <>
            <h2 className="text-xl font-semibold mb-4">Latest Videos</h2>
            <VideoGrid videos={videos.slice(0, 6)} />
          </>
        )}

        {activeTab === "videos" && (
          <>
            <h2 className="text-xl font-semibold mb-4">All Videos</h2>
            <VideoGrid videos={videos} />
          </>
        )}

        {activeTab === "about" && (
          <div className="max-w-2xl space-y-4 text-gray-300">
            <p>{channel.bio || "No description provided."}</p>
            <p>Joined on {new Date(channel.joinedAt).toDateString()}</p>
            <p>{formatNumber(channel.totalVideos)} videos uploaded</p>
            <p>{formatNumber(channel.totalViews)} total views</p>
          </div>
        )}
      </div>
    </div>
  );
};

const VideoGrid = ({ videos }) => {
  return (
    <div className="grid md:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-6">
      {videos.map((video) => (
        <div key={video.id} className="cursor-pointer">
          <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden">
            <img
              src={video.thumbnailUrl}
              alt={video.title}
              className="w-full h-full object-cover hover:scale-105 transition"
            />
          </div>

          <div className="mt-2">
            <h3 className="font-medium line-clamp-2">{video.title}</h3>
            <p className="text-sm text-gray-400">
              {video.views} views •{" "}
              {new Date(video.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChannelPageview;
