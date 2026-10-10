const multer = require("multer");
const multerS3 = require("multer-s3");
const s3 = require("../config/s3");

const upload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.S3_USER_MEDIA_BUCKET,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      const ext = file.originalname.split(".").pop();
      const folder =
        file.fieldname === "avatar" ? "avatars" : "banners";

      cb(null, `${folder}/${req.user.id}-${Date.now()}.${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
});

module.exports = upload;
