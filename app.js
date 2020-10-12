const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const app = express();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

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
    pool
        .query('SELECT * FROM Threads')
        .then((result) => {
            console.log(result.rows[0]);
            res.render('index',{
                //data: result.rows[0]
                title: 'PANDeagle',
                data: result.rows
            });
        })
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