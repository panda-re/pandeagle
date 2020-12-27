async function init() {
    const dataset = await d3.json('http://localhost:3000/executions/1/threadslices');

    const dimensions = {
        width: 1900,
        height: 20 * dataset.length + 200,
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

function dotPlot(svg, dataset, dimensions) {

    const idAccessor = data => +data["thread_id"];
    const nameAccessor = data => data["names"].join(" ");
    const sliceAccessor = data => data["thread_slices"]; 

    const bounds = svg.append("g")
    .attr("transform", `translate(${dimensions.margin.left}, ${dimensions.margin.top})`);

    const yScale = d3.scaleBand()
    .domain(dataset.map(nameAccessor))
    .range([0, dataset.map(nameAccessor).length * 20]);

    const yAxisGenerator = d3.axisLeft()
    .scale(yScale)
    .tickSize(0);

    bounds.append("g")
    .call(yAxisGenerator)
    .select(".domain")
    .attr("opacity", 0);

    const maxTime = Math.max(...dataset.map(t => Math.max(...t.thread_slices.map(d => d.end_execution_offset))));
    const minTime = Math.min(...dataset.map(t => Math.min(...t.thread_slices.map(d => d.end_execution_offset))));

    const xScale = d3.scaleLinear()
    .domain([minTime, maxTime])
    .range([0, dimensions.xLength]);

    const xAxisGenerator = d3.axisBottom()
    .scale(xScale)
    .tickSize(0);

    bounds.append("g")
    .call(xAxisGenerator)
    .attr("transform", `translate(0,${dimensions.height-200})`)
}