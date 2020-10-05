const express = require('express');
const { Pool } = require('pg');
const app = express();
//process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

const port = 3000;
const pool = new Pool({
    user: 'shenx',
    host: 'pandeagle.csse.rose-hulman.edu',
    database: 'pandelephant',
    password: '123456',
    port: 5432,
    ssl: true
});

pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
});

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.get('/pgTest', (req, res) => {
    pool
        .query('SELECT * FROM Threads')
        .then(result => res.send(result.rows[0]))
        .catch((err) => {
            console.log(err);
            console.log("pool.idleCount: " + pool.idleCount);
            res.status(400);
            res.json(err);
        });
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});