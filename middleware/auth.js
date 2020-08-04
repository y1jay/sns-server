const jwt = require("jsonwebtoken");
const connection = require("../db/mysql_connection");

const auth = async (req, res, next) => {
  console.log("인증 미들웨어");
  let token = req.header("Authorization");
  if (!token) {
    res.status(401).json({ error: "Not token" });
    return;
  }
  token = token.replace("Bearer ", "");
  console.log(token);

  // 1. 토큰에 저장된 정보를 디코드 한다.
  let user_id;
  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    console.log(decoded);
    user_id = decoded.user_id;
  } catch (e) {
    // 이상한 토큰은 여기서 다 걸러진다.
    res.status(401).json({ error: "이상한거 보내지마라" });
  }

  // 위의 유저 아이디로, DB에서 token 정보를 가져온다.

  let query = `select * from sns_token where user_id = ${user_id}`;
  try {
    [rows] = await connection.query(query);
    console.log(rows);
  } catch (e) {
    res.status(401).json({ error: "인증해라" });
  }
  let isCorrect = false;
  //   // 반복문 돌면서, 유저아이디와 토큰이 맞는지 체크
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].user_id == user_id && rows[i].token == token) {
      isCorrect = true;
      break;
    }
  }

  // 유효한 토큰이 맞으니까, 유저 정보를 db 에서 가져옵니다.
  if (isCorrect) {
    query = `select * from sns_user where id = ${user_id}`;
    try {
      [rows] = await connection.query(query);

      console.log(rows[0]);
      let user = rows[0];

      delete user.passwd;
      req.user = user;
      req.user.token = token;
      next();
    } catch (e) {
      res.status(500).json({ error: "DB에러" });
    }
  } else {
    res.status(401).json({ error: "인증이 안된 토큰입니다." });
  }
};
module.exports = auth;
