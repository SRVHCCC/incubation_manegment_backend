const {
  DownloadExcelFile,
  ReadExcelFile,
} = require("../utils/Helpers/ExcelGenerator");

const router = require("express").Router();

const ExcelFileRoutes = ({ upload }) => {
  router.get("/download", DownloadExcelFile);
  router.post("/read-excel", upload.single("excel_file"), ReadExcelFile);
  return router;
};

module.exports.ExcelFileRoutes = ExcelFileRoutes;
