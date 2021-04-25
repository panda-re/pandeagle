const { Pool } = require('pg');
const fs = require('fs');

let dbConfig = {
    host: "pandeagle.csse.rose-hulman.edu",
    port: "5432",
    database: "pandelephant",
    user: "shenx",
    password: "123456",
    ssl: true
}

try {
    dbConfig = JSON.parse(fs.readFileSync('config.json'));
} catch (err) {
    console.log("No config.json, using default database configuration");   
}

let pool = new Pool({
    user: dbConfig.user,
    host: dbConfig.host,
    database: dbConfig.database,
    password: dbConfig.password,
    port: +dbConfig.port,
    ssl: dbConfig.ssl
});

const conn = {
    getAllExecutions: async function (){
        return pool.query('SELECT * FROM Executions');
    },
    getThreadSlicesByExecutionId: async function (executionId){
        return pool.query(
            `SELECT t.thread_id, t.names, json_agg(ts ORDER BY start_execution_offset) as thread_slices FROM ThreadSlice ts 
                    JOIN Threads t ON ts.thread_id = t.thread_id 
                    JOIN processes p ON t.process_id = p.process_id 
                    JOIN executions e ON p.execution_id = e.execution_id 
                    WHERE e.execution_id = $1
                    GROUP BY t.thread_id, t.names 
                    ORDER BY thread_id`, [executionId]);
    },
    getThreadsByExecutionId: async function (executionId) {
        return pool.query(
            `SELECT t.thread_id, t.names FROM Threads t
                JOIN processes p ON t.process_id = p.process_id 
                JOIN executions e ON p.execution_id = e.execution_id 
                WHERE e.execution_id = $1
                ORDER BY thread_id`, [executionId]);
    },
    getThreadSlicesByExecutionIdWithPagination: async function (executionId, pageIndex, pageSize, threadIds, start, end) {
        threadIds = threadIds || null;
        return pool.query(
            `SELECT t.thread_id, t.names, json_agg(
                (SELECT thread_slices FROM
                (SELECT 
                    ts.threadslice_id
                    ,ts.thread_id
                    ,CASE WHEN ($3::int IS NULL) OR (ts.start_execution_offset >= $3) 
                        THEN ts.start_execution_offset ELSE $3 END AS start_execution_offset
                    , CASE WHEN ($4::int IS NULL) OR (ts.end_execution_offset <= $4) 
                        THEN ts.end_execution_offset ELSE $4 END AS end_execution_offset
                    ORDER BY start_execution_offset
                    ) AS thread_slices))             
                 as thread_slices FROM ThreadSlice ts 
                    JOIN Threads t ON ts.thread_id = t.thread_id 
                    JOIN processes p ON t.process_id = p.process_id 
                    JOIN executions e ON p.execution_id = e.execution_id 
                    WHERE e.execution_id = $1 
                    AND (($3::int IS NULL OR ts.end_execution_offset >= $3)
                        AND ($4::int IS NULL OR ts.start_execution_offset <= $4))
                    AND ($2::int[] IS NULL OR t.thread_id = ANY($2::int[]))
                    GROUP BY t.thread_id, t.names 
                    ORDER BY thread_id ` + (!pageSize ? "" : `LIMIT $5 OFFSET $6`), (!pageSize ? [executionId, threadIds, start, end] : [executionId, threadIds, start, end, pageSize, pageSize * pageIndex]));
    },
    getSyscallsByExecutionIdWithPagination: async function (executionId, pageIndex, pageSize, threadIds, start, end) {
        threadIds = threadIds || null;
        return pool.query(
            `SELECT t.thread_id, t.names, json_agg(sc ORDER BY execution_offset) as syscalls FROM syscalls sc 
                JOIN Threads t ON sc.thread_id = t.thread_id 
                JOIN processes p ON t.process_id = p.process_id 
                JOIN executions e ON p.execution_id = e.execution_id 
                WHERE e.execution_id = $1 
                AND (($3::int IS NULL OR sc.execution_offset >= $3)
                    AND ($4::int IS NULL OR sc.execution_offset <= $4))
                AND ($2::int[] IS NULL OR t.thread_id = ANY($2::int[]))
                GROUP BY t.thread_id, t.names 
                ORDER BY thread_id ` + (!pageSize ? "" : `LIMIT $5 OFFSET $6`), (!pageSize ? [executionId, threadIds, start, end] : [executionId, threadIds, start, end, pageSize, pageSize * pageIndex]));
    },
    getScArgByExecutionId: async function(executionId) {
        return pool.query(
            `SELECT sc.syscall_id, json_agg(scarg ORDER BY scarg.position) AS arguments
                FROM syscall_arguments scarg
                JOIN syscalls sc ON sc.syscall_id = scarg.syscall_id
                JOIN threads t ON t.thread_id = sc.thread_id  
                JOIN processes p ON p.process_id = t.process_id 
                JOIN executions e ON e.execution_id = p.execution_id 
                WHERE e.execution_id = $1
                GROUP BY sc.syscall_id`
                , [executionId]
        )
    },
    reconnect: async function (dbInfo) {
        pool.end().then(() => pool = new Pool(dbInfo));
    }
};

module.exports = conn;