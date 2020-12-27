async function init() {
    const dataset = await d3.json('http://localhost:3000/executions/1/threadslices');

    const svg = d3.select("body").append("svg").attr("width", 1250).attr("height", 600);
    
    dotPlot(svg, dataset);
}

document.addEventListener('DOMContentLoaded', init)

function dotPlot(svg, dataset) {

    const idAccessor = data => +data["thread_id"];
    const nameAccessor = data => data["names"].join(" ");
    const sliceAccessor = data => data["thread_slices"]; 

    const bounds = svg.append("g")
    .attr("transform", "translate(200, 100)");

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
}