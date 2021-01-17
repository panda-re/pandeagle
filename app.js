const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const app = express();
const conn = require('./database.js');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

const port = 3000;

app.get('/executions', (req, res) => {
    conn.getAllExecutions()
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

app.get('/executions/:executionId/threadslices', (req, res) => {
    conn.getThreadSlicesByExecutionId(req.params.executionId)
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

// app.get('/defaultExecution', (req, res) => {
//     pool
//         .query('SELECT * FROM Threads WHERE process_id IN (SELECT process_id FROM Processes WHERE execution_id = (SELECT execution_id FROM Executions LIMIT 1))')
//         .then((thr) => {
//             thr.rows.forEach(element => {
//                 element.name = element.names.join(' ');
//             });
//             res.status(200);
//             res.json(thr.rows);
//         })
//         .catch((err) => {
//             res.status(400);
//             res.json(err);
//         });
// });

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});