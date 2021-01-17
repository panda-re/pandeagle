# PANDeagle API
This document provides explanations for the PANDeagle APIs.

<hr />

### All Executions
==**GET**== /executions

##### Response Schema
JSON
```json
[
    {
        "execution_id": 0,
        "name": "string",
        "description": "string",
        "start_time": "2020-09-21T17:46:56.053Z",
        "end_time": "2020-09-21T17:46:56.053Z"
    }
]
```

Name | Description | type
---- | ----------- | ----
execution_id | ID of execution | int
name | Name of execution | string
description | Description of execution | string or null
start_time | Start time of execution | datetime
end_time | End time of execution | datetime or null

<hr />

### Thread names in one execution
==**GET**== /executions/{executionId}/threads

&nbsp; | executionId
------ | -----------
type   | int
description | ID of execution
required?   | Yes

##### Response Schema
JSON
```json
[
    {
        "thread_id": 0,
        "names": [
            "string"
        ]
    }
]
```
Name | Description | type
---- | ----------- | ----
thread_id | ID of thread | int
names     | An array of all the components in the thread name | array of string

<hr />

### Thread slices in one execution
==**GET**== /executions/{executionId}/threadslices/{pageIndex}/{pageSize}?threadIds[]={threadId}&start={start}&end={end}

NOTE: There can be multiple threadId.
EXAMPLE: /executions/1/threadslices?threadIds[]=1&threadIds[]=2

&nbsp; | executionId | pageIndex | pageSize
------ | ----------- | --------- | --------
type   | int         | int       | int
description | ID of execution | Page number (0-based) | Number of threads on each page
required?   | Yes | No | No

###### Query Parameters

&nbsp; | threadId | start | end
------ | -------- | ----- | ---
type   | int      | int   | int
description | ID of thread | Minimum instruction count | Maximum instruction count
required?   | No | No | No

NOTE: A thread slice will be included if part of it is between start and end. The start_execution_offset and end_execution_offset will be cut to the start and end that is passed in.

##### Response Schema
JSON
```json
[
    {
        "thread_id": 0,
        "names": [
            "string"
        ],
        "thread_slices": [
            {
                "threadslice_id": 0,
                "thread_id": 0,
                "start_execution_offset": 0,
                "end_execution_offset": 0
            }
        ]
    }
]
```
Name | Description | type
---- | ----------- | ----
thread_id | ID of thread | int
names     | An array of all the components in the thread name | array of string
thread_slices | An array of all thread_slices that belong to the thread | array of objects
threadslice_id | ID of thread slice | int
start_execution_offset | The start instruction count of the thread slice | int
end_execution_offset | The end instruction count of the thread slice | int 