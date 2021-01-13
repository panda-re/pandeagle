const ThreadListContext = React.createContext({
  threads: [],
  updateThreads: () => []
})

class ThreadChart extends React.Component {
  static contextType = ThreadListContext

  constructor(props) {
    super(props)
    this.draw = this.draw.bind(this)
  }

  async componentDidMount() {
    const data = await d3.json('http://localhost:3000/executions/1/threadslices')
    let threadNames = this.renameDuplicates(data.map(data => data["names"].join(" ")))
    for (let i = 0; i < data.length; i++) {
      data[i].newName = threadNames[i]
      data[i].visible = true
    }
    this.context.updateThreads(data)

    this.draw()
  }

  componentDidUpdate() {
    this.draw()
  }

  renameDuplicates(threadNames) {
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

  draw() {
    d3.selectAll('svg').remove()

    const data = this.context.threads
    const filteredData = data.filter(d => d.visible)

    const margin = {
      top: 10,
      right: 20,
      bottom: 30,
      left: 120
    }
    const width = 1000
    const height = this.context.threads.length * 30
    const focusHeight = 100

    const nameAccessor = data => data["newName"]
    const startAccessor = data => data["thread_slices"].map(d => d.start_execution_offset)
    const endAccessor = data => data["thread_slices"].map(d => d.end_execution_offset)

    // create new graph
    const chart = d3.select(this.node)
      .append('svg')
      .attr('height', height)
      .attr('width', width)

    // y-axis
    const yScale = d3.scaleBand()
      .domain(data.map(d => d.newName))
      .range([margin.top, height - margin.bottom])

    const yAxis = d3.axisLeft()
      .scale(yScale)
      .tickSize(0)

    chart.append('g')
      .attr('class', 'y-axis')
      .attr('transform', `translate(${margin.left},0)`)
      .call(yAxis)
      .call(g => g.select('.domain').remove())

    // x-axis
    const maxTime = Math.max(...filteredData.map(t => Math.max(...t.thread_slices.map(d => d.end_execution_offset))))
    const minTime = Math.min(...filteredData.map(t => Math.min(...t.thread_slices.map(d => d.start_execution_offset))))

    const xScaleRef = d3.scaleLinear()
      .domain([minTime, maxTime])
      .range([margin.left, width - margin.right])

    const xScale = xScaleRef.copy()

    const xAxis = d3.axisBottom()
      .scale(xScale)

    chart.selectAll('g.x-axis')
      .data([0])
      .enter()
      .append('g')
      .call(xAxis)
      .attr('class', 'x-axis')
      .attr("transform", `translate(0,${height - margin.bottom})`)

    // gray axis line
    const lineGenerator = d3.line()
    const axisLine = d => lineGenerator([[margin.left, yScale(d) + yScale.bandwidth() / 2], [width - margin.right, yScale(d) + yScale.bandwidth() / 2]])

    chart.selectAll('g.grid-line')
      .data([0])
      .enter()
      .append('g')
      .attr('class', 'grid-line')
      .selectAll("path.grid-line")
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

    const slices = (g, data, y) => g.selectAll('path.slice')
      .data(data)
      .enter()
      .append('path')
      .attr('class', 'slice')
      .attr("transform", d => `translate(0, ${(y(nameAccessor(d)) + (y.bandwidth() / 2))})`)
      .attr("d", slicePath)
    const sliceGroup = chart.append("g")
      .attr('class', 'slice-group')
      .call(slices, filteredData, yScale)

    // Brush
    const brushPanel = d3.select(this.node)
      .append('svg')
      .attr('class', 'focus')
      .attr('height', focusHeight)
      .attr('width', width)

    const brush = d3.brushX()
      .extent([[margin.left, 0], [width - margin.right, focusHeight - margin.bottom]])
      .on("brush", brushed)
      .on("end", brushed)

    brushPanel.selectAll('g.brush-x-axis')
      .data([0])
      .enter()
      .append("g")
      .call(xAxis)
      .attr('class', 'brush-x-axis')
      .attr("transform", `translate(0, ${focusHeight - margin.bottom})`)

    const focusY = d3.scaleBand()
      .domain(data.map(d => d.newName))
      .range([margin.top, focusHeight - margin.bottom])
    brushPanel.selectAll('g.brush-slices')
      .data([0])
      .enter()
      .append("g")
      .attr('class', 'brush-slices')
      .call(brush)
      .call(slices, data, focusY)

    function brushed({ selection }) {
      const [minOffset, maxOffset] = (!selection) ? xScaleRef.domain() : selection.map(xScaleRef.invert).map(Math.floor)

      xScale.domain([minOffset, maxOffset])

      const xAxis = d3.axisBottom()
        .scale(xScale)

      chart.selectAll(".x-axis")
        .call(xAxis)

      const focusedData = filteredData.map(d => ({ ...d, thread_slices: d.thread_slices.filter(x => x.start_execution_offset >= minOffset && x.end_execution_offset <= maxOffset) }))

      sliceGroup.selectAll('.slice')
        .data(focusedData)
        .attr('d', slicePath)
    }
  }

  render() {
    return (
      <main className="main" ref={node => this.node = node}>
      </main>
    )
  }
}