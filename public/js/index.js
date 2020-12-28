function setup() {
    getExecutions();
    getThreads();
}

function getExecutions() {
    $.ajax({
        url: 'executions',
        type: 'GET',
        dataType: 'JSON',
        success: (executions) => {
            executions.forEach(execution => {
                $('#processSelect').append('<option value="' + execution.execution_id + '">' + execution.name + '</option>');
            });
        },
        error: (xhr, status, err) => {
            console.log(xhr);
        }
    });
}

function getThreads() {
    $.ajax({
        url: 'executions/1/threadslices',
        type: 'GET',
        dataType: 'JSON',
        success: (threads) => {
            // console.log(JSON.stringify(threads))
            threads.forEach(thread => {
                $('#threadSelect').append('<option value="' + thread.thread_id + '">' + thread.names.join(' ') + '</option>');
            });
        },
        error: (xhr, status, err) => {
            console.log(xhr);
        }
    });
}


$(window).on('load', setup);