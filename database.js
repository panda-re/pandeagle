const { Pool } = require('pg');

const pool = new Pool({
    user: 'shenx',
    host: 'pandeagle.csse.rose-hulman.edu',
    database: 'pandelephant2',
    password: '123456',
    port: 5432,
    ssl: true
});

pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
});

const conn = {
    getAllExecutions: async function () {
        return pool.query('SELECT * FROM Executions');
    },
    getThreadSlicesByExecutionId: async function (executionId) {
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
    }
};

module.exports = conn;