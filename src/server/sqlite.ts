import Database from "better-sqlite3";
const db = new Database("./gamedb.sqlite");

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

function updateUserScore(userId: string, score: number) {
  const user = getUser(userId) as any;
  if (!user) {
    throw "用户不存在，更新分数失败";
  }
  updateScore.run(Math.max(0, score + (user.score as number)), userId);
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

export const DataStore = {
  addUser,
  getUser,
  getTopUsers,
  addMatch,
  getLast3Matches,
  getLast1Match,
  updateUserScore,
};
