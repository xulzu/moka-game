import { DatabaseSync } from "node:sqlite";
const db = new DatabaseSync("./gamedb.sqlite");
import { Config } from "./Configs";

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

//体力表
db.exec(`
  CREATE TABLE IF NOT EXISTS player_stamina (
      player_id     TEXT PRIMARY KEY,
      stamina       INTEGER NOT NULL,
      last_update   INTEGER NOT NULL
  );
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
    (player1_id = @userid AND player2_id != 'roobot') 
      or 
    (player2_id = @userid and player1_id != 'roobot')
  ORDER BY datetime(created_at) DESC
  LIMIT 3
`);

const last1Matche = db.prepare(`
  SELECT *
  FROM matches
  ORDER BY datetime(created_at) DESC
  LIMIT 1
`);
function addUser(user: {
  userid: string;
  name: string;
  avatar: string;
  score: number;
}) {
  insertUser.run(user.userid, user.name, user.avatar, user.score);
}

function getUser(userid: string) {
  return getUserByUserid.get(userid) as any;
}

function updateUserScore(userId: string, add_score: number) {
  const user = getUser(userId) as any;
  if (!user) {
    throw "用户不存在，更新分数失败";
  }
  updateScore.run(Math.max(0, add_score + (user.score as number)), userId);
}
function updateUserAvatar(userid: string, avatar: string) {
  db.prepare(
    `
    UPDATE users SET avatar = ? WHERE userid = ?
    `
  ).run(avatar, userid);
}
function getTopUsers() {
  return topUsers.all();
}
function addMatch(match: {
  player1_id: string;
  player2_id: string;
  winner_id: string;
  score1: number;
  score2: number;
}) {
  insertMatch.run(
    match.player1_id,
    match.player2_id,
    match.winner_id,
    match.score1,
    match.score2
  );
}

function getLast3Matches(userid: string) {
  return last3Matches.all({ userid });
}
function getLast1Match() {
  return last1Matche.all();
}
//查询签到情况
function getSigins(userid: string) {
  const length = Config.SIGN_START_DAY?.length || 0;
  const data = db
    .prepare(
      `
    SELECT * FROM signins
    WHERE userid = ?
    ORDER BY timestamp DESC
    LIMIT ${length}
  `
    )
    .all(userid) as any[];
  return data;
}
function getSignin(userid: string, date: string) {
  return db
    .prepare(
      `
    SELECT 1 FROM signins WHERE userid = ? AND date = ?
  `
    )
    .get(userid, date);
}
function addSignin(userid: string, date: string) {
  db.prepare(
    `
    INSERT INTO signins (userid, date) VALUES (?, ?)
  `
  ).run(userid, date);
}
function getStamina(userid: string) {
  return db
    .prepare(
      `
    SELECT * FROM player_stamina WHERE player_id = ?
  `
    )
    .get(userid) as any;
}
function updateStamina(userid: string, stamina: number) {
  const currentTime = Date.now();
  db.prepare(
    `
    UPDATE player_stamina SET stamina = ?, last_update = ? WHERE player_id = ?
  `
  ).run(stamina, currentTime, userid);
}
function addStamina(userid: string, stamina: number) {
  const currentTime = Date.now();
  db.prepare(
    `
    INSERT INTO player_stamina (player_id, stamina, last_update) VALUES (?, ?, ?)
  `
  ).run(userid, stamina, currentTime);
}
export const DataStore = {
  addUser,
  getUser,
  getTopUsers,
  addMatch,
  getLast3Matches,
  getLast1Match,
  updateUserScore,
  updateUserAvatar,
  addSignin,
  getSigins,
  getSignin,

  getStamina,
  updateStamina,
  addStamina,
};
