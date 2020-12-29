async function init() {
  const dataset = await d3.json('http://localhost:3000/executions/1/threadslices');

  const dimensions = {
    margin: {
      top: 10,
      right: 20,
      bottom: 30,
      left: 120
    },
    width: 1000,
    height: 500,
  }
  const { width, height, margin } = dimensions

  const svg = d3.select("body").append("svg").attr('height', height).attr('width', width);

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
  const { width, height, margin } = dimensions
  let threadNames = dataset.map(data => data["names"].join(" "));
  threadNames = renameDuplicates(threadNames);

  for (let i = 0; i < dataset.length; i++) {
    dataset[i].newName = threadNames[i];
  }

  const nameAccessor = data => data["newName"];
  const startAccessor = data => data["thread_slices"].map(d => d.start_execution_offset);
  const endAccessor = data => data["thread_slices"].map(d => d.end_execution_offset);

  // create new graph
  const graph = svg.append("g")

  // y-axis
  const yScale = d3.scaleBand()
    .domain(threadNames)
    .range([height - margin.bottom, margin.top]);

  const yAxisGenerator = d3.axisLeft()
    .scale(yScale)
    .tickSize(0);

  graph.append('g')
    .attr('transform', `translate(${margin.left},0)`)
    .call(yAxisGenerator)
    .call(g => g.select('.domain').remove())

  // x-axis
  const maxTime = Math.max(...dataset.map(t => Math.max(...t.thread_slices.map(d => d.end_execution_offset))));
  const minTime = Math.min(...dataset.map(t => Math.min(...t.thread_slices.map(d => d.end_execution_offset))));

  const xScale = d3.scaleLinear()
    .domain([minTime, maxTime])
    .range([margin.left, width - margin.right]);

  const xAxisGenerator = d3.axisBottom()
    .scale(xScale)

  graph.append("g")
    .call(xAxisGenerator)
    .attr("transform", `translate(0,${dimensions.height - dimensions.margin.bottom})`)

  // gray axis line
  const lineGenerator = d3.line()
  const axisLine = d => lineGenerator([[margin.left, yScale(d) + yScale.bandwidth() / 2], [width - margin.right, yScale(d) + yScale.bandwidth() / 2]])


  graph.append("g")
    .selectAll("path")
    .data(yScale.domain())
    .join('path')
    .attr("class", "grid-line")
    .attr("d", axisLine)

  // slices
  const slicePath = d => {
    const startPoints = startAccessor(d);
    const endPoints = endAccessor(d);

    const context = d3.path()

    for (let i = 0; i < startPoints.length; i++) {
      context.moveTo(xScale(startPoints[i]), 0);
      context.lineTo(xScale(endPoints[i]), 0);
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

  // Brush
  const brush = d3.brushX()
    .extent([[margin.left, 0.5], [width - margin.right, height - margin.bottom + 0.5]])
    .on('brush', brushed)
  svg.append('g')
    .attr('class', 'brush')
    .call(brush)

  function brushed({ selection }) {
    if (selection) {
      svg.property('value', selection.map(xScale.invert, xScale))
      svg.dispatch('input')
    }
  }


}