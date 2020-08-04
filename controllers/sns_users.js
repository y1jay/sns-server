const connection = require("../db/mysql_connection");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// @desc    회원가입
// @route   POST /api/v1/users
// @route   POST /api/v1/users/register
// @route   POST /api/v1/users/
// @parameters  email, passwd
exports.signUp = async (req, res, next) => {
  let email = req.body.email;
  let passwd = req.body.passwd;

  const hashedPasswd = await bcrypt.hash(passwd, 8);

  // 이메일이 정상적인가 체크
  if (!validator.isEmail(email)) {
    res.status(500).json({ success: false, message: "이게 이메일이냐?" });
    return;
  }
  // 유저 인서트
  let query = "insert into sns_user (email, passwd) values ? ";
  let data = [email, hashedPasswd];
  let user_id;
  try {
    [result] = await connection.query(query, [[data]]);
    user_id = result.insertId;
  } catch (e) {
    if (e.errno == 1062) {
      // 이메일 중복된것 이다.
      res
        .status(400)
        .json({ success: false, errno: 1, message: "이메일 중복" });
      return;
    } else {
      res.status(500).json({ success: false, error: e });
      return;
    }
  }

  let token = jwt.sign({ user_id: user_id }, process.env.ACCESS_TOKEN_SECRET);

  query = "insert into sns_token (token, user_id) values ( ? , ? )";
  data = [token, user_id];

  try {
    [result] = await connection.query(query, data);
    res.status(200).json({ success: true, token: token });
  } catch (e) {
    res.status(500).json({ success: false, error: e });
  }
};
