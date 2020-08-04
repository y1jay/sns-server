const connection = require("../db/mysql_connection");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
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

// @desc   사진포스팅 하는 API
// @route  POST /api/v1/sns_users/posting
// @request file
// @response  success

// 클라이언트가 사진을 보낸다. => 서버가 이 사진을 받는다. =>
// 서버가 이 사진을 디렉토리에 저장한다. => 이 사진의 파일명을 DB에 저장한다.

exports.Photo_Posting = async (req, res, next) => {
  let user_id = req.user.id;
  let posting = req.body.posting;
  if (!user_id || !req.files) {
    res.status(400).json({ message: "에러" });
    return;
  }
  console.log(req.files);

  const photo = req.files.photo;
  // 지금 받은 파일이. 이미지 파일인지 체크
  if (photo.mimetype.startsWith("image") == false) {
    res.status(400).json({ message: "이미지가 아닌뒤" });
    return;
  }
  // 파일크기가 정해진 크기보다 큰지 체크 정해진 크기는 process.env.MAX_FILE_SIZE에 넣어놨다.
  if (photo.size > process.env.MAX_FILE_SIZE) {
    res.status(400).json({ message: "파일이 이따시만합니다" });
    return;
  }
  // fall.jpg =>photo_3.jpg  ext==확장자명을 뜻한다
  // abc.png =>photo_#.png
  // path 의 parse는 이름과 확장자명을 파싱하는데 우리는 이름은 버리고 확장자명만 가져옴.
  photo.name = `photo_${user_id}${path.parse(photo.name).ext}`;

  // ./public/upload/photo_3.jpg 로 저장하겠다는 것
  let fileUploadPath = `${process.env.FILE_UPLOAD_PATH}/${photo.name}`;
  photo.mv(fileUploadPath, async (err) => {
    if (err) {
      console.error(err);
      return;
    }
  });

  let query = `insert into sns(user_id,photo_url,posting)values(${user_id},"${photo.name}","${posting}")`;
  try {
    [result] = await connection.query(query);
    res.status(200).json({ message: "사진이 업로드 됐습니다." });
  } catch (e) {
    res.status(500).json({ message: "ㅄ" });
  }
};

// @desc   사진가져오는 API
// @route  GET /api/v1/sns_users/photo
// @request file
// @response  success
exports.get_myphoto = async (req, res, next) => {
  let query = `select photo_url,user_id from sns`;

  try {
    [rows] = await connection.query(query);
    res.status(200).json({ message: "공개된 사진들", rows: rows });
  } catch (e) {
    res.status(500).json({ success: false });
  }
};

// @desc   사진수정하는 API
// @route  GET /api/v1/sns_users/posting
// @request file
// @response  success
exports.update_photo = async (req, res, next) => {
  let user_id = req.user.id;
  let posting = req.body.posting;
  if (!user_id || !req.files) {
    res.status(400).json({ message: "에러" });
    return;
  }

  const photo = req.files.photo;
  if (photo.mimetype.startsWith("image") == false) {
    res.status(400).json({ message: "이미지가 아닌뒙" });
    return;
  }

  if (photo.size > process.env.MAX_FILE_SIZE) {
    res.status(400).json({ message: "파일이 이따시만합니다" });
    return;
  }

  photo.name = `photo_${user_id}${path.parse(photo.name).ext}`;

  let fileUploadPath = `${process.env.FILE_UPLOAD_PATH}/${photo.name}`;
  photo.mv(fileUploadPath, async (err) => {
    if (err) {
      console.error(err);
      return;
    }
  });

  let query = `update sns set photo_url = "${photo.name}",posting = "${posting}" where user_id = ${user_id}`;
  try {
    [result] = await connection.query(query);
    res.status(200).json({ message: "사진이 수정 되었습니다." });
  } catch (e) {
    res.status(500).json({ message: "ㅄ" });
  }
};
