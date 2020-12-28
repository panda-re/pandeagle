async function init() {
    const dataset = await d3.json('http://localhost:3000/executions/1/threadslices');

    const dimensions = {
        width: 1900,
        lineHeight: 30,
        height: 30 * dataset.length + 200,
        xLength: 1500,
        margin: {
            top: 100,
            left: 200,
        },
    }

    const svg = d3.select("body").append("svg").attr("width", dimensions.width).attr("height", dimensions.height);
    
    dotPlot(svg, dataset, dimensions);
}

document.addEventListener('DOMContentLoaded', init)

function renameDuplicates(threadNames) {
    const nameCounts = new Map();
    const newNames = [];

    threadNames.forEach(name => {
        let count = nameCounts.get(name); 
        if (count == undefined) {
            nameCounts.set(name, 1);
            newNames.push(name);
        } else {
            count++;
            nameCounts.set(name, count);
            newNames.push(name + count.toString());
        }
    });

    return newNames;
}

function dotPlot(svg, dataset, dimensions) {

    let threadNames = dataset.map(data => data["names"].join(" "));
    threadNames = renameDuplicates(threadNames);

    for (let i = 0; i < dataset.length ; i++) {
        dataset[i].newName = threadNames[i];
    }

    const nameAccessor = data => data["newName"];
    const startAccessor = data => data["thread_slices"].map(d => d.start_execution_offset);
    const endAccessor = data => data["thread_slices"].map(d => d.end_execution_offset);

    // create new graph
    const graph = svg.append("g")
    .attr("transform", `translate(${dimensions.margin.left}, ${dimensions.margin.top})`);

    // y-axis
    const yScale = d3.scaleBand()
    .domain(threadNames)
    .range([0, threadNames.length * dimensions.lineHeight]);

    const yAxisGenerator = d3.axisLeft()
    .scale(yScale)
    .tickSize(0);

    graph.append("g")
    .attr("transform", "translate(-20, 0)")
    .call(yAxisGenerator)
    .select(".domain")
    .attr("opacity", 0);

    // x-axis
    const maxTime = Math.max(...dataset.map(t => Math.max(...t.thread_slices.map(d => d.end_execution_offset))));
    const minTime = Math.min(...dataset.map(t => Math.min(...t.thread_slices.map(d => d.end_execution_offset))));

    const xScale = d3.scaleLinear()
    .domain([minTime, maxTime])
    .range([0, dimensions.xLength]);

    const xAxisGenerator = d3.axisBottom()
    .scale(xScale)

    graph.append("g")
    .call(xAxisGenerator)
    .attr("transform", `translate(0,${dimensions.height-dimensions.margin.top*2})`)

    // gray axis line
    const lineGenerator = d3.line()
    const axisLine = d => lineGenerator([[0, yScale(d) + dimensions.lineHeight/2], [dimensions.xLength, yScale(d) + dimensions.lineHeight/2]])

    graph.append("g")
    .selectAll("path")
    .data(yScale.domain())
    .enter().append("path")
    .attr("class", "grid-line")
    .attr("d", axisLine)

    // slices
    const slicePath = d => {
        const startPoints = startAccessor(d);
        const endPoints = endAccessor(d);

        const context = d3.path()

        for (let i = 0 ; i < startPoints.length ; i++) {
            context.moveTo(xScale(startPoints[i]),0);
            context.lineTo(xScale(endPoints[i]),0);
        }

        return context;        
    }

    const slicesGroup = graph.append("g")
    .attr("class", "dots")

    const slices = slicesGroup.selectAll("g")
    .data(dataset)
    .enter().append("g")
    .attr("transform", d => `translate(0, ${(yScale(nameAccessor(d)) + (yScale.bandwidth() / 2))})`)

    slices.append("path")
    .attr("class", "slice")
    .attr("d", slicePath)
}