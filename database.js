const { Pool } = require('pg');

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
    getThreadSlicesByExecutionIdWithPagination: async function (executionId, pageIndex, pageSize) {
        return pool.query(
            `SELECT t.thread_id, t.names, json_agg(ts ORDER BY start_execution_offset) as thread_slices FROM ThreadSlice ts 
                    JOIN Threads t ON ts.thread_id = t.thread_id 
                    JOIN processes p ON t.process_id = p.process_id 
                    JOIN executions e ON p.execution_id = e.execution_id 
                    WHERE e.execution_id = $1
                    GROUP BY t.thread_id, t.names 
                    ORDER BY thread_id
                    LIMIT $2
                    OFFSET $3`, [executionId, pageSize, pageSize * pageIndex]);
    }
};

module.exports = conn;