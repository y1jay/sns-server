const express = require("express");
const auth = require("../middleware/auth");
const {
  signUp,
  LoginSns,
  Logout,
  Photo_Posting,
  get_myphoto,
} = require("../controllers/sns_users");

const router = express.Router();

router.route("/").post(signUp);
router.route("/login").post(LoginSns);
router.route("/logout").post(auth, Logout);
router.route("/posting").put(auth, Photo_Posting);
router.route("/photo").get(get_myphoto);
module.exports = router;
