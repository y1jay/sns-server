const express = require("express");

const { signUp, LoginSns } = require("../controllers/sns_users");

const router = express.Router();

router.route("/").post(signUp);
router.route("/login").post(LoginSns);
module.exports = router;
