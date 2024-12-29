require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const pg = require('pg');
const cors = require('cors');

const app = express();
const corsOptions = {
  origin: process.env.UI_URL,
  methods: 'GET,POST,PUT,DELETE',
  allowedHeaders: 'Content-Type,Authorization',
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Middleware to parse JSON and URL-encoded form data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

let statDetails = "";
let leaderboard;
let username;
let score = 0;
let rank;

const urlConnection = process.env.DATABASE_URL;

// Gets the stat details
app.get("/statdetails", async (req, res) => {
  try {
    res.json({ statDetails });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Gets the leaderboard details and the user's ranking
app.get("/leaderboard", async (req, res) => {
  try {
    const client = new pg.Client(urlConnection)
    client.connect();
    const leaderboardResult = await client.query('Select * From GetLeaderboard()');
    const rankResult = await client.query("Select * From GetRanking(" + score + ")");
    
    leaderboard = leaderboardResult.rows;
    rank = rankResult.rows[0];
    client.end();

    res.json({ leaderboard, rank });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Post the questions details based on the quiz type and question number
app.post('/quizparameters', async (req, res) => {
  try {
    const data = req.body;
    const client = new pg.Client(urlConnection)
    client.connect();
    const result = await client.query("Select * From GetStat('" + data.field + "', '" + data.count + "')");
    client.end();

    statDetails = result.rows[0];

    res.json({ success: true, message: 'Data posted successfully' });
  } catch (error) {
    console.error('Error with quiz parameters:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// Post the user's score to the database
app.post("/leaderboardparameters", async (req, res) => {
  try {
    username = req.body.username;
    score = req.body.score;
    const client = new pg.Client(urlConnection)
    client.connect();
    await client.query("Select * From SaveScore('" + username + "', " + score + ")");
    client.end();

    res.json({ success: true, message: 'Data posted successfully' });
  } catch (error) {
    console.error('Error with leaderboard parameters:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
