
async function init() {
  const data = await d3.json('./payloads/dataset.json');

  const body = document.querySelector('body');
  const svg = DotPlot(data);

  body.appendChild(svg);
}

document.addEventListener('DOMContentLoaded', init)

function DotPlot(dataset) {
  // attributes
  const radiusCircles = 10;
  const radiusAdults = 7;


  // Access Data
  const xAccessorAA = d => +d["AllAdults"]
  const xAccessorLV = d => +d["LikelyVoters"]
  const xAccessorNV = d => +d["NonVoters"]
  const yAccessor = d => d["Race"]

  // Chart dimensions
  let dimensions = {
    width: 1000,
    height: 1000 * 0.334,
    margin: {
      top: 90,
      right: 15,
      bottom: 60,
      left: 150,
    },
  }
  dimensions.boundedWidth = dimensions.width - dimensions.margin.left - dimensions.margin.right
  dimensions.boundedHeight = dimensions.height - dimensions.margin.top - dimensions.margin.bottom

  // Draw canvas
  let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute('width', dimensions.width);
  svg.setAttribute('height', dimensions.height);
  svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
  svg = d3.select(svg)
  const bounds = svg.append("g")
    .attr("transform", `translate(${dimensions.margin.left}, ${dimensions.margin.top})`)

  // Scales
  const xScale = d3.scaleLinear()
    // .domain([0, d3.max(dataset, xAccessorLV)])
    .domain([0, 1])
    .range([0, dimensions.boundedWidth])
    .nice()

  const yScale = d3.scaleBand()
    .domain(dataset.map(yAccessor))
    .range([0, dimensions.boundedHeight])
    .paddingInner(0.5)
    .paddingOuter(1.5)

  // Draw data
  const lineGenerator = d3.line()
  const axisLinePath = d => lineGenerator([[xScale(d) + 0.5, 0], [xScale(d) + 0.5, dimensions.boundedHeight]])
  const dotsLinePathNVAA = d => lineGenerator([[xScale(xAccessorNV(d)), 0], [xScale(xAccessorAA(d)), 0]])
  const dotsLinePathAALV = d => lineGenerator([[xScale(xAccessorAA(d)), 0], [xScale(xAccessorLV(d)), 0]])

  const dotsGroup = bounds.append("g")
    .attr("class", "dots")

  const dots = dotsGroup.selectAll("g")
    .data(dataset)
    .enter().append("g")
    .attr("class", "dot")
    .attr("transform", d => `translate(0, ${(yScale(yAccessor(d)) + (yScale.bandwidth() / 2))})`)

  dots.append("path")
    .attr("class", "dots-line-NVAA")
    .attr("d", dotsLinePathNVAA)

  dots.append("path")
    .attr("class", "dots-line-AALV")
    .attr("d", dotsLinePathAALV)

  const nonVoterCircles = dots.append("circle")
    .attr("class", "non-voters")
    .attr("r", radiusCircles)
    .attr("cx", d => xScale(xAccessorNV(d)))

  const likelyVoterCircles = dots.append("circle")
    .attr("class", "likely-voters")
    .attr("r", radiusCircles)
    .attr("cx", d => xScale(xAccessorLV(d)))

  const allAdultCircles = dots.append("circle")
    .attr("class", "all-adults")
    .attr("r", radiusAdults)
    .attr("cx", d => xScale(xAccessorAA(d)))

  // Make axes
  const xAxisGenerator = d3.axisTop()
    .scale(xScale)
    .tickFormat(d3.format(".0%"))
    .ticks(5)

  const yAxisGenerator = d3.axisLeft()
    .scale(yScale)
    .tickSize(0)

  const xAxis = bounds.append("g")
    .attr("class", "x-axis")
    .call(xAxisGenerator)

  const yAxis = bounds.append("g")
    .attr("class", "y-axis")
    .attr("transform", "translate(-20, 0)")
    .call(yAxisGenerator)
    .select(".domain")
    .attr("opacity", 0)

  // gridlines
  const gridLines = bounds.append("g")
    .attr("class", "grid-lines")
  gridLines.selectAll("path")
    .data(xScale.ticks())
    .enter().append("path")
    .attr("class", "grid-line")
    .attr("d", axisLinePath)

  // text labels for the x and y axes
  svg.append("text")
    .attr("transform",
      "translate(" + (dimensions.width / 2) + " ," +
      (dimensions.height + dimensions.margin.top + 20) + ")")
    .style("text-anchor", "middle")
    .text("Date");

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - dimensions.margin.left)
    .attr("x", 0 - (dimensions.height / 2))
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .text("Value");

  // legend
  // const legendLabels = [
  //   { "label": "Non Voters", class: "non-voters" },
  //   { "label": "All Adults", class: "all-adults" },
  //   { "label": "Likely Voters", class: "likely-voters" },
  // ]
  // const legendX = dimensions.boundedWidth / 2
  // const legendY = dimensions.margin.top / 2
  // const spaceBetween = dimensions.boundedWidth / 8
  // const titleOffset = -dimensions.boundedWidth / 2

  // const legend = svg.append("g")
  //   .attr("transform", `translate(${legendX}, ${legendY})`)

  // legend.append("g")
  //   .attr("class", "title")
  //   .append("text")
  //   .attr("x", titleOffset + dimensions.margin.left)
  //   .attr("y", -20)
  //   .text("Pandeagle")

  // legend.selectAll("circle")
  //   .data(legendLabels)
  //   .enter().append("circle")
  //   .attr("cx", (d, i) => spaceBetween * i + 180)
  //   .attr("cy", 5)
  //   .attr("r", 4)
  //   .attr("class", d => d.class)

  // legend.append("g")
  //   .selectAll("text")
  //   .data(legendLabels)
  //   .enter().append("text")
  //   .attr("x", (d, i) => spaceBetween * i + 190)
  //   .attr("y", 10)
  //   .text(d => d.label)

  return svg.node()
}