const express = require("express");
const auth = require("../middleware/auth");
const {
  send_friend,
  check_friend,
  get_friend,
  friends,
} = require("../controllers/sns_friends");

const router = express.Router();

router.route("/send_friend").post(auth, send_friend);
router.route("/:id/check_friend").put(auth, check_friend);
router.route("/:id/get_friend").get(auth, get_friend);
router.route("/friends").get(auth, friends);

module.exports = router;
