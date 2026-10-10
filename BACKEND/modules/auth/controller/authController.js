const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../../../prisma/client"); 


const registerUser = async (req, res) => {
  try {
    const { email, username, password, displayName } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({
        message: "Email, username and password are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long",
      });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Email or username already exists",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        displayName: displayName || username,
      },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        isVerified: true,
        createdAt: true,
      },
    });

    return res.status(201).json({
      message: "User registered successfully",
      user,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};



const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};




const updateUser = async (req, res) => {
  try {
    const { displayName, bio } = req.body;

    const avatarFile = req.files?.avatar?.[0];
    const bannerFile = req.files?.banner?.[0];

    const data = {
      displayName,
      bio,
    };

  if (avatarFile) {
  data.avatarUrl =
    `${process.env.SUPABASE_PUBLIC_STORAGE_URL}/${process.env.S3_USER_MEDIA_BUCKET}/${avatarFile.key}`;
}

if (bannerFile) {
  data.channelBanner =
    `${process.env.SUPABASE_PUBLIC_STORAGE_URL}/${process.env.S3_USER_MEDIA_BUCKET}/${bannerFile.key}`;
}

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data,
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        channelBanner: true,
        updatedAt: true,
      },
    });

    res.json({
      message: "User updated successfully",
      user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};


const aboutme = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        channelBanner: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("AboutMe Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


const deleteUser = async (req, res) => {
  try {
    await prisma.user.delete({
      where: { id: req.user.id },
    });

    return res.json({
      message: "User deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
const getMyUploadedVideos = async (req, res) => {
  try {
    const userId = req.user.id; // from auth middleware

    const videos = await prisma.video.findMany({
      where: {
        userId: userId, 
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      count: videos.length,
      videos,
    });
  } catch (error) {
    console.error("Fetch user videos error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching uploaded videos",
    });
  }
};

const getChannelDetails = async (req, res) => {
  try {
    const { channelId } = req.params;

    // 1️ Get channel info
    const channel = await prisma.user.findUnique({
      where: { id: channelId },
      select: {
        id: true,
        displayName: true,
        avatarUrl: true,
        channelBanner: true,
        bio: true,
        createdAt: true,
        subscribers: true,
        videos: {
          where: {
            visibility: "PUBLIC"
          },
          select: {
            id: true,
            title: true,
            thumbnailUrl: true,
            views: true,
            visibility: true,
            createdAt: true,
            duration: true
          },
          orderBy: {
            createdAt: "desc"
          }
        }
      }
    });

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: "Channel not found"
      });
    }

    // 2️ Subscriber Count
    const subscriberCount = channel.subscribers.length;

    // 3️ Total Views
    const totalViews = channel.videos.reduce(
      (sum, video) => sum + video.views,
      0
    );

    return res.json({
      success: true,
      channel: {
        id: channel.id,
        name: channel.displayName,
        avatar: channel.avatarUrl,
        banner: channel.channelBanner,
        bio: channel.bio,
        joinedAt: channel.createdAt,
        subscriberCount,
        totalVideos: channel.videos.length,
        totalViews
      },
      videos: channel.videos
    });

  } catch (error) {
    console.error("Channel details error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};


module.exports={registerUser,loginUser,updateUser,deleteUser,aboutme,getMyUploadedVideos,getChannelDetails};