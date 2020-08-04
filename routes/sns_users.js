const express = require("express");
const auth = require("../middleware/auth");
const {
  signUp,
  LoginSns,
  Logout,
  Photo_Posting,
  get_myphoto,
  update_photo,
  delete_photo,
} = require("../controllers/sns_users");

const router = express.Router();

router.route("/").post(signUp);
router.route("/login").post(LoginSns);
router.route("/logout").post(auth, Logout);
router.route("/posting").post(auth, Photo_Posting);
router.route("/photo").get(get_myphoto);
router.route("/update_photo").put(auth, update_photo);
router.route("/del_photo").delete(auth, delete_photo);
module.exports = router;
