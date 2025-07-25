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
const getUserByUserid = db.prepare(`
  SELECT * FROM users WHERE userid = ?
`);
const topUsers = db.prepare(`
  SELECT * FROM users
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

function addUser(user: {
  userid: string;
  name: string;
  avatar: string;
  score: number;
}) {
  insertUser.run(user.userid, user.name, user.avatar, user.score);
}

function getUser(userid: string) {
  return getUserByUserid.get(userid);
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
console.log(getLast3Matches("1"));
// console.log(getLast3Matches("1"));
