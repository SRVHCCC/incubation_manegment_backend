const router = require("express").Router();
const {
  getDashboardData,
  StartupData,
} = require("../controller/startupCotroller/startup");

router.post("/count", getDashboardData);
router.post("/data", StartupData);

module.exports.Startup = router;
