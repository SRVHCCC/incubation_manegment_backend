const { Login, SignUp } = require("../controller/Auth/Auth");

const router = require("express").Router();

const AuthRoutes = ({ upload }) => {
  router.post("/login", Login);
  router.post("/signup", upload.single("photo"), SignUp);
  return router;
};

module.exports.AuthRoute = AuthRoutes;
