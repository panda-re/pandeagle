const express = require('express');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const app = express();
const conn = require('./database.js');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

const port = process.env.PORT || 3000;

app.get('/executions', (req, res) => {
    conn.getAllExecutions()
        .then((exe) => {
            res.status(200);
            res.json(exe.rows);
        })
        .catch((err) => {
            console.error("ERROR CONNECTING DATABASE");
            res.status(400).json(err);
        });
});

app.get('/executions/:executionId/threadslices/:pageIndex?/:pageSize?', (req, res) => {
    conn.getThreadSlicesByExecutionIdWithPagination(
        req.params.executionId,
        req.params.pageIndex,
        req.params.pageSize,
        req.query.threadIds,
        req.query.start,
        req.query.end)
        .then((exe) => {
            res.status(200);
            res.json(exe.rows);
        })
        .catch((err) => {
            console.log(err);
            res.status(400);
            res.json(err);
        });
});

app.get('/executions/:executionId/syscalls/:pageIndex?/:pageSize?', (req, res) => {
    conn.getSyscallsByExecutionIdWithPagination(
        req.params.executionId,
        req.params.pageIndex,
        req.params.pageSize,
        req.query.threadIds,
        req.query.start,
        req.query.end)
        .then((exe) => {
            res.status(200);
            res.json(exe.rows);
        })
        .catch((err) => {
            console.log(err);
            res.status(400);
            res.json(err);
        });
});

app.get('/executions/:executionId/threads', (req, res) => {
    conn.getThreadsByExecutionId(req.params.executionId)
        .then((exe) => {
            res.status(200);
            res.json(exe.rows);
        })
        .catch((err) => {
            console.log(err);
            res.status(400);
            res.json(err);
        });
});

app.post('/saveDBConfig', (req, res) => {
    const dbInfo = req.body;
    dbInfo.ssl = true;
    const dbInfoStr = JSON.stringify(dbInfo);
    fs.writeFile('config.json', dbInfoStr, (err) => {
        if (err) throw err;
        conn.reconnect(dbInfo)
        .then(() => {
            res.status(200);
            res.send();
        })
        .catch((err) => {
            console.log(err);
            res.status(400);
            res.json(err);
        });
    });
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});