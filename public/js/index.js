function setup() {
    getExecutions();
    getThreads();
}

function getExecutions() {
    $.ajax({
        url: 'app',
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

function getThreads(executionID) {
    $.ajax({
        url: 'defaultExecution',
        type: 'GET',
        dataType: 'JSON',
        success: (threads) => {
            threads.forEach(thread => {
                $('#threadSelect').append('<option value="' + thread.thread_id + '">' + thread.name + '</option>');
            });
        },
        error: (xhr, status, err) => {
            console.log(xhr);
        }
    });
}


$(window).on('load', setup);