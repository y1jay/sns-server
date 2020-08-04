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

// @desc   로그인
// @route   POST /api/v1/sns_users/login
// @paramaeters  email, passwd
// async 는 동시에 처리할 수 있게해라
exports.LoginSns = async (req, res, next) => {
  let email = req.body.email;
  let passwd = req.body.passwd;

  let query = `select * from sns_user where email ="${email}"`;

  try {
    [rows] = await connection.query(query);

    // 비밀번호 체크 : 비밀번호가 서로 맞는지 확인
    let savedPasswd = rows[0].passwd;

    const isMatch = await bcrypt.compare(passwd, savedPasswd);
    if (isMatch == false) {
      res.status(400).json({ succese: false, result: isMatch });
      return;
    }
    let token = jwt.sign(
      { user_id: rows[0].id },
      process.env.ACCESS_TOKEN_SECRET
    );
    query = `insert into sns_token (token,user_id) values(?,?)`;

    let data = [token, rows[0].id];
    try {
      [result] = await connection.query(query, data);
      res.status(200).json({ succese: true, result: isMatch, token: token });
      return;
    } catch {
      res.status(500).json({ error: e });
      return;
    }
  } catch {
    res.status(500).json({ error: e });
  }
};

// @ desc   로그아웃 api: DB에서 해당 유저의 현재 토큰값을 삭제
// @ route  POST /api/v1/users/Logout
// @parameters  X

exports.Logout = async (req, res, next) => {
  // 토큰테이블에서, 현재 이 헤더에 있는 토큰으로, 삭제한다.
  let token = req.user.token;
  let user_id = req.user.id;
  let query = `delete from sns_token where user_id = ${user_id} and token = "${token}"`;

  try {
    [result] = await connection.query(query);
    if (result.affectedRows == 1) {
      res.status(200).json({ succese: true, result: result });
      return;
    } else {
      res.status(400).json({ succese: false });
      return;
    }
  } catch (e) {
    res.status(500).json({ succese: false, error: e });
    return;
  }
};
