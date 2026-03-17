const {
  DownloadUserExcelFile,
  ReadUserExcelFile,
} = require("../controller/HR/HumanResource");
const { WorkForceData } = require("../controller/HR/WorkForceController");

const router = require("express").Router();

const WorkForceRoutes = ({ upload }) => {
  router.get("/download", DownloadUserExcelFile);
  router.post(
    "/read-user-excel",
    upload.single("user_excel_file"),
    ReadUserExcelFile,
  );
  router.post("/data", WorkForceData);
  return router;
};

module.exports.WorkForceRoutes = WorkForceRoutes;
