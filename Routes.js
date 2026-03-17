const { AuthRoute } = require("./routes/AuthRoute.js");
const { ExcelFileRoutes } = require("./routes/ExcelFIle.js");
const { Startup } = require("./routes/Stratup.routes.js");
const { WorkForceRoutes } = require("./routes/WorkForce.Route.js");

const AllRoutes = ({ upload }) => {
  var router = require("express").Router();
  router.use("/auth", AuthRoute({ upload: upload }));
  router.use("/excel", ExcelFileRoutes({ upload: upload }));
  router.use("/startup", Startup);
  router.use("/work-force", WorkForceRoutes({ upload: upload }));
  return router;
};

module.exports.AllRoutes = AllRoutes;
