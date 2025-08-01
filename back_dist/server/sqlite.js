import { DatabaseSync } from "node:sqlite";
const db = new DatabaseSync("./gamedb.sqlite");
import { Config } from "./Configs.js";
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userid TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    avatar TEXT NOT NULL,
    score INTEGER
  )
`);
db.exec(`
  CREATE TABLE IF NOT EXISTS matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player1_id TEXT NOT NULL,
    player2_id TEXT NOT NULL,
    winner_id TEXT,
    score1 INTEGER,
    score2 INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player1_id) REFERENCES users(userid),
    FOREIGN KEY (player2_id) REFERENCES users(userid),
    FOREIGN KEY (winner_id) REFERENCES users(userid)
  )
`);
db.exec(`
  CREATE TABLE IF NOT EXISTS signins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userid TEXT NOT NULL,
    date TEXT NOT NULL, 
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(userid, date)
  )
`);
const insertUser = db.prepare(`
  INSERT INTO users (userid, name,avatar, score) VALUES (?, ?, ?, ?)
`);
const updateScore = db.prepare(`
  UPDATE users SET score = ? WHERE userid = ?
`);
const getUserByUserid = db.prepare(`
  SELECT * FROM users WHERE userid = ?
`);
const topUsers = db.prepare(`
  SELECT * FROM users
  WHERE
    userid != 'roobot'
  ORDER BY score DESC
  LIMIT 100
`);
//对局表
const insertMatch = db.prepare(`
  INSERT INTO matches (player1_id, player2_id, winner_id, score1, score2)
  VALUES (?, ?, ?, ?, ?)
`);
const last3Matches = db.prepare(`
  SELECT *
  FROM matches
  WHERE
    player1_id = @userid
    AND player2_id != 'roobot'
  ORDER BY datetime(created_at) DESC
  LIMIT 3
`);
const last1Matche = db.prepare(`
  SELECT *
  FROM matches
  ORDER BY datetime(created_at) DESC
  LIMIT 1
`);
function addUser(user) {
    insertUser.run(user.userid, user.name, user.avatar, user.score);
}
function getUser(userid) {
    return getUserByUserid.get(userid);
}
function updateUserScore(userId, score) {
    const user = getUser(userId);
    if (!user) {
        throw "用户不存在，更新分数失败";
    }
    updateScore.run(Math.max(0, score + user.score), userId);
}
function getTopUsers() {
    return topUsers.all();
}
function addMatch(match) {
    insertMatch.run(match.player1_id, match.player2_id, match.winner_id, match.score1, match.score2);
}
function getLast3Matches(userid) {
    return last3Matches.all({ userid });
}
function getLast1Match() {
    return last1Matche.all();
}
//查询签到情况
function getSigins(userid) {
    const length = Config.SIGN_START_DAY?.length || 0;
    const data = db
        .prepare(`
    SELECT * FROM signins
    WHERE userid = ?
    ORDER BY timestamp DESC
    LIMIT ${length}
  `)
        .all(userid);
    return data;
}
function getSignin(userid, date) {
    return db
        .prepare(`
    SELECT 1 FROM signins WHERE userid = ? AND date = ?
  `)
        .get(userid, date);
}
function addSignin(userid, date) {
    db.prepare(`
    INSERT INTO signins (userid, date) VALUES (?, ?)
  `).run(userid, date);
}
export const DataStore = {
    addUser,
    getUser,
    getTopUsers,
    addMatch,
    getLast3Matches,
    getLast1Match,
    updateUserScore,
    addSignin,
    getSigins,
    getSignin,
};
