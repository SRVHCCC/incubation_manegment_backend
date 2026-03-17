var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var helmet = require("helmet");
var rateLimit = require("express-rate-limit");
var multer = require("multer");
var cors = require("cors");
var fs = require("fs");
var path = require("path");
require("dotenv").config();
const { ConnectDB } = require("./utils/DB/Connection");
const { AllRoutes } = require("./Routes");
var app = express();
ConnectDB();

// ALLOWED URL TO ACCESS THE BACKEND
const allowedOrigins =
  process.env.MODE === "local"
    ? [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://192.168.0.204:3000",
      ]
    : [
        "https://incubation-manegment-frontend.vercel.app/",
        "https://incubation-manegment-frontend.vercel.app",
      ];

const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

const uploadPath = path.join(__dirname, "public");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let filePath = uploadPath;

    if (req.originalUrl.includes("/auth/signup")) {
      filePath = path.join(uploadPath, "profile_photos");
    } else if (req.originalUrl.includes("/excel/read-excel")) {
      filePath = path.join(uploadPath, "excel_files");
    } else {
      filePath = uploadPath;
    }

    if (!fs.existsSync(filePath)) {
      fs.mkdirSync(filePath, { recursive: true });
    }

    cb(null, filePath);
  },

  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
var upload = multer({ storage: storage });

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");
app.use(logger("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(helmet());
// CORS--------------
app.use(
  cors({
    origin: allowedOrigins,
  }),
);
app.use(rateLimiter);
app.use(express.static(path.join(__dirname, "public")));
//API calling -----------
app.use("/api", AllRoutes({ upload: upload }));
//API calling -----------
app.use(function (req, res, next) {
  next(createError(404));
});
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
