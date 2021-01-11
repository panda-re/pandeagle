'use strict';

const e = React.createElement;

class ThreadCharts extends React.Component {

  constructor(props) {
    super(props);
    // rest of the constructor
    //this.state = { data:[] };
    this.state = { liked: false };
  }

  async componentDidMount() {
    const data = await d3.json('http://localhost:3000/executions/1/threadslices')
    console.log(data)
    const margin = {
      top: 10,
      right: 20,
      bottom: 30,
      left: 120
    }
    const width = 1000
    const height = data.length * 30
    const focusHeight = 100

    const dimensions = { margin, height, width, focusHeight }
    //const data = this.props.data; // when we pass data through prop
    this.drawChart(data, dimensions);
  }


  drawChart(data, dimensions) {
    const { width, height, margin, focusHeight } = dimensions

    let threadNames = data.map(data => data["names"].join(" "))
    threadNames = renameDuplicates(threadNames)

    for (let i = 0; i < data.length; i++) {
      data[i].newName = threadNames[i]
    }

    const nameAccessor = data => data["newName"]
    const startAccessor = data => data["thread_slices"].map(d => d.start_execution_offset)
    const endAccessor = data => data["thread_slices"].map(d => d.end_execution_offset)

    // create new graph
    const chart = d3.select("body")
      .append("svg")
      .attr('height', height)
      .attr('width', width)

    // y-axis
    const yScale = d3.scaleBand()
      .domain(threadNames)
      .range([height - margin.bottom, margin.top])

    const yAxis = d3.axisLeft()
      .scale(yScale)
      .tickSize(0)

    chart.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(yAxis)
      .call(g => g.select('.domain').remove())

    // x-axis
    const maxTime = Math.max(...data.map(t => Math.max(...t.thread_slices.map(d => d.end_execution_offset))))
    const minTime = Math.min(...data.map(t => Math.min(...t.thread_slices.map(d => d.start_execution_offset))))

    const xScaleRef = d3.scaleLinear()
      .domain([minTime, maxTime])
      .range([margin.left, width - margin.right])

    const xScale = xScaleRef.copy()

    const xAxis = d3.axisBottom()
      .scale(xScale)

    chart.append("g")
      .call(xAxis)
      .attr('class', 'x-axis')
      .attr("transform", `translate(0,${dimensions.height - dimensions.margin.bottom})`)

    // gray axis line
    const lineGenerator = d3.line()
    const axisLine = d => lineGenerator([[margin.left, yScale(d) + yScale.bandwidth() / 2], [width - margin.right, yScale(d) + yScale.bandwidth() / 2]])

    chart.append("g")
      .selectAll("path")
      .data(yScale.domain())
      .join('path')
      .attr("class", "grid-line")
      .attr("d", axisLine)

    // slices
    const slicePath = d => {
      const startPoints = startAccessor(d)
      const endPoints = endAccessor(d)

      const context = d3.path()

      for (let i = 0; i < startPoints.length; i++) {
        context.moveTo(xScale(startPoints[i]), 0)
        context.lineTo(xScale(endPoints[i]), 0)
      }

      return context
    }

    const slices = (g, yScale) => g.selectAll('path')
      .data(data).enter()
      .append('path')
      .attr('class', 'slice')
      .attr("transform", d => `translate(0, ${(yScale(nameAccessor(d)) + (yScale.bandwidth() / 2))})`)
      .attr("d", slicePath)
    const sliceGroup = chart.append("g").call(slices, yScale)


    // Brush
    const brushPanel = d3.select("body")
      .append("svg")
      .attr('class', 'focus')
      .attr('height', focusHeight)
      .attr('width', width)

    const brush = d3.brushX()
      .extent([[margin.left, 0], [width - margin.right, focusHeight - margin.bottom]])
      .on("brush", brushed)
      .on("end", brushed)

    brushPanel.append("g")
      .call(xAxis)
      .attr('class', 'x-axis')
      .attr("transform", `translate(0, ${focusHeight - margin.bottom})`)

    brushPanel.append("g")
      .attr('class', 'brush')
      .call(brush)
      .call(slices, yScale.copy().range([focusHeight - margin.bottom, margin.top]))

    function brushed({ selection }) {
      const [minOffset, maxOffset] = (!selection) ? xScaleRef.domain() : selection.map(xScaleRef.invert).map(Math.floor)

      xScale.domain([minOffset, maxOffset])

      const xAxis = d3.axisBottom()
        .scale(xScale)

      chart.selectAll(".x-axis")
        .call(xAxis)

      const focusedData = data.map(d => ({ ...d, thread_slices: d.thread_slices.filter(x => x.start_execution_offset >= minOffset && x.end_execution_offset <= maxOffset) }))

      sliceGroup.selectAll('.slice')
        .data(focusedData)
        .attr('d', slicePath)
    }

    function renameDuplicates(threadNames) {
      const nameCounts = new Map()
      const newNames = []

      threadNames.forEach(name => {
        let count = nameCounts.get(name)
        if (count == undefined) {
          nameCounts.set(name, 1)
          newNames.push(name)
        } else {
          count++
          nameCounts.set(name, count)
          newNames.push(name + count.toString())
        }
      })

      return newNames
    }

  }




  //render() {
  // return(
  // <div>
  //     TEST
  // </div>
  // )



  //}

  render() {
    if (this.state.liked) {
      return 'You liked this.';
    }

    return (
      <button onClick={() => this.setState({ liked: true })}>
        Like
      </button>
    );
  }
}

const domContainer = document.querySelector('#wrapper');
ReactDOM.render(e(ThreadCharts), domContainer);
