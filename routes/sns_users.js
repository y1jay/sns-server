const express = require("express");
const auth = require("../middleware/auth");
const { signUp, LoginSns, Logout } = require("../controllers/sns_users");

const router = express.Router();

router.route("/").post(signUp);
router.route("/login").post(LoginSns);
router.route("/logout").post(auth, Logout);
module.exports = router;
