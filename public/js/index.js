function selectThread(thread_id) {
    console.log(thread_id);
    $.ajax({
        url: 'plog_test',
        type: 'GET',
        dataType: 'JSON'
    });

}