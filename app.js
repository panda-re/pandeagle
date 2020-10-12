const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const app = express();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

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

app.get('/app', (req, res) => {
    pool
        .query('SELECT * FROM Executions')
        .then((exe) => {
            res.status(200);
            res.json(exe.rows);
        })
        .catch((err) => {
            console.log(err);
            console.log("pool.idleCount: " + pool.idleCount);
            res.status(400);
            res.json(err);
        });
});

app.get('/defaultExecution', (req, res) => {
    pool
        .query('SELECT * FROM Threads WHERE process_id IN (SELECT process_id FROM Processes WHERE execution_id = (SELECT execution_id FROM Executions LIMIT 1))')
        .then((thr) => {
            thr.rows.forEach(element => {
                element.name = element.names.join(' ');
            });
            res.status(200);
            res.json(thr.rows);
        })
        .catch((err) => {
            res.status(400);
            res.json(err);
        });
});

app.get('/:executionID', (req, res) => {
    pool
        .query('SELECT * FROM Threads WHERE process_id IN (SELECT process_id FROM Processes WHERE execution_id = $1)', [req.params.executionID])
        .then((thr) => {
            thr.rows.forEach(element => {
                element.name = element.names.join(' ');
            });
            res.status(200);
            res.json(thr.rows);
        })
        .catch((err) => {
            res.status(400);
            res.json(err);
        });
});


app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});