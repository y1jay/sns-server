const express = require("express");
const auth = require("../middleware/auth");
const {
  signUp,
  LoginSns,
  Logout,
  Photo_Posting,
  update_photo,
  delete_photo,
  on_delete,
  shared_photo,
} = require("../controllers/sns_users");

const router = express.Router();

router.route("/").post(signUp);
router.route("/login").post(LoginSns);
router.route("/logout").delete(auth, Logout);
router.route("/posting").post(auth, Photo_Posting);
router.route("/photo").get(shared_photo);
router.route("/update_photo").put(auth, update_photo);
router.route("/del_photo").delete(auth, delete_photo);
router.route("/on_delete").delete(auth, on_delete);
module.exports = router;
