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
  send_friend,
  check_friend,
  get_friend,
} = require("../controllers/sns_users");

const router = express.Router();

router.route("/").post(signUp);
router.route("/login").post(LoginSns);
router.route("/logout").post(auth, Logout);
router.route("/posting").post(auth, Photo_Posting);
router.route("/photo").get(get_myphoto);
router.route("/update_photo").put(auth, update_photo);
router.route("/del_photo").delete(auth, delete_photo);
router.route("/send_friend").post(auth, send_friend);
router.route("/:id/check_friend").put(auth, check_friend);
router.route("/:id/get_friend").get(auth, get_friend);
module.exports = router;
