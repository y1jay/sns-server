const connection = require("../db/mysql_connection");

//@ desc    친구요청
//@ route   POST/api/v1/sns_friends/send_friend
exports.send_friend = async (req, res, next) => {
  let user_id = req.user.id;
  let friend_id = req.body.friend_id;
  let query = `select * from  sns_user where id = ${friend_id}`;

  try {
    [rows] = await connection.query(query);

    if (rows.length == 0) {
      res.status(400).json({ message: "찾을 수 없음" });
      return;
    } else {
      query = `insert into sns_friends(user_id,friend_id)values(${user_id},${friend_id})`;
      try {
        [result] = await connection.query(query);

        res.status(200).json({
          success: true,
          message: "친구요청이 전송되었습니다.",
          rows: rows,
        });
      } catch (e) {
        if (e.errno == 1062) {
          res.status(500).json({ message: "이미 친구요청을 보냈습니다" });
        }
      }
    }
  } catch (e) {
    res.status(500).json({ error: e, message: "에러" });
  }
};

//@ desc    친구수락
//@ route    PUT/api/v1/sns_friends/:id/check_friend
exports.check_friend = async (req, res, next) => {
  let user_id = req.user.id;
  let friend_id = req.params.id;
  let query = `update sns_friends set ok = 1 
    where user_id = ${friend_id} and friend_id = ${user_id}`;

  try {
    [rows] = await connection.query(query);
    if (rows.changedRows == 1) {
      res
        .status(200)
        .json({ success: true, message: "친구요청을 수락하였습니다." });
    } else if (rows.changedRows == 0) {
      res.status(400).json({ success: false, message: "친구요청이 없습니다." });
    }
  } catch (e) {
    res.status(500).json({ success: false });
  }
};

// @ desc   지정 친구의 사진을 가져오는 API
// @ route  GET/api/v1/sns_friends/:id/get_friend
exports.get_friend = async (req, res, next) => {
  let user_id = req.user.id;
  let friend_id = req.params.id;
  let query = `select s.user_id,s.photo_url,s.posting from sns as s
  join sns_friends as sf on s.user_id = sf.user_id 
  where sf.friend_id = ${user_id} and sf.user_id= ${friend_id} and share = 0 `;

  try {
    [rows] = await connection.query(query);
    res.status(200).json({ success: true, rows: rows });
  } catch (e) {
    res.status(500).json({ error: e });
  }
};

//@ desc    친구들의 포스팅을 시간순으로 가져오는 API (최신글부터)
//@ route   GET/api/v1/sns_friends/friends
exports.friends = async (req, res, next) => {
  let user_id = req.user.id;
  let offset = req.query.offset;
  let query = `select s.user_id, s.photo_url, s.posting, s.created_at from sns as s 
  join sns_friends as sf on s.user_id = sf.friend_id 
  where sf.user_id = ${user_id} or sf.friend_id= ${user_id} and sf.ok = 1
  order by s.created_at desc limit ${offset},25 ;`;

  try {
    [rows] = await connection.query(query);
    res.status(200).json({ success: true, rows: rows });
    return;
  } catch (e) {
    res.status(500).json({ error: e, message: "에러" });
  }
};
