// const ThreadListContext = React.createContext({
//   threads: [],
//   isLoading: true,
//   updateThreads: () => []
// })

class ThreadChart extends React.Component {
  constructor(props) {
    super(props)
  }

  componentDidMount() {
    console.log("1")
    const { data, width, height, margin} = this.props
    const focusHeight = 100
    const maxTime = Math.max(...data.map(t => Math.max(...t.thread_slices.map(d => d.end_execution_offset))))
    const minTime = Math.min(...data.map(t => Math.min(...t.thread_slices.map(d => d.start_execution_offset))))
    const contextView = d3.select(this.contextView)
    const focusView = d3.select(this.focusView)

    this.xScale = d3.scaleLinear()
      .domain([minTime, maxTime])
      .range([margin.left, width - margin.right])
    this.contextYScale = d3.scaleBand()
      .domain(data.map(d => d.newName))
      .range([margin.top, height - focusHeight - margin.bottom])
    this.focusYScale = this.contextYScale.copy().range([margin.top, focusHeight - margin.bottom])

    this.contextXAxis = contextView.append('g')
      .attr('class', 'thread-chart__context-view__x-axis')
      .attr('transform', `translate(0,${height - focusHeight - margin.bottom})`)
    this.contextYAxis = contextView.append('g')
      .attr('class', 'thread-chart__context-view__y-axis')
      .attr('transform', `translate(${margin.left},0)`)
    this.contextGridLineGroup = contextView.append('g')
      .attr('class', 'thread-chart__context-view__grid-line-group')
    this.contextSliceGroup = contextView.append('g')
      .attr('class', 'thread-chart__context-view__slice-group')
      .attr('clip-path', 'url(#clip)')
    this.systemCallGroup = contextView.append('g')
      .attr('class', 'thread-chart__context-view__system-call-group')
      .attr('clip-path', 'url(#clip)')
    this.focusXAxis = focusView.append('g')
      .attr('class', 'thread-chart__focus-view__x-axis')
      .attr('transform', `translate(0, ${focusHeight - margin.bottom})`)
    this.focusSliceGroup = focusView.append('g')
      .attr('class', 'thread-chart__focus-view__slice-group')

    this.create()
  }

  componentDidUpdate() {
    // FIXME: assuming there is only one type of data change right now 
    // # of visible threads changed
    const newThreads = this.props.data.filter(d => d.visible).map(d => d.newName)
    console.log(this.props.data)
    this.contextYScale = this.contextYScale.copy().domain(newThreads)
    this.updateContextView(this.xScale, this.contextYScale)
    this.updateFocusView(this.xScale, this.focusYScale)
  }

  get t() {
    return d3.transition().duration(1000)
  }

  drawGridLines(g, yScale) {
    const { width, margin } = this.props
    const gridLine = d3.line()([[margin.left, 0], [width - margin.right, 0]])

    g.selectAll('path')
      .data(yScale.domain())
      .join(
        enter => enter.append('path')
          .attr('class', 'thead-chart__context-view__grid-line-group__grid-line')
          .attr('transform', d => `translate(0,${yScale(d) + yScale.bandwidth() / 2})`)
          .attr('d', gridLine)
          .style('stroke', '#272727')
          .style('opacity', 0)
          .call(enter => enter.transition(this.t)
            .style('opacity', .2)
          ),
        update => update.call(update => update.transition(this.t)
          .attr('transform', d => `translate(0,${yScale(d) + yScale.bandwidth() / 2})`)),
        exit => exit.transition(this.t)
          .style('opacity', 0)
          .remove()
      )

  }

  sliceGenerator(d, xScale) {
    const startAccessor = data => data['thread_slices'].map(d => d.start_execution_offset)
    const endAccessor = data => data['thread_slices'].map(d => d.end_execution_offset)

    const startPoints = startAccessor(d)
    const endPoints = endAccessor(d)

    const context = d3.path()

    for (let i = 0; i < startPoints.length; i++) {
      context.moveTo(xScale(startPoints[i]), 0)
      context.lineTo(xScale(endPoints[i]), 0)
    }

    return context
  }

  drawThreadSlices(g, xScale, yScale, strokeWidth = 10) {
    g.selectAll('path')
      .data(this.props.data.filter(d => d.visible), d => d.newName)
      .join(
        enter => enter.append('path')
          .attr('class', 'thread-chart__slice-group__slice')
          .attr('transform', d => `translate(0, ${yScale(d.newName) + yScale.bandwidth() / 2})`)
          .attr('d', d => this.sliceGenerator(d, xScale))
          .style('stroke-width', strokeWidth)
          .style('stroke', '#4A89DC')
          .style('opacity', 0)
          .call(update => update.transition(this.t)
            .style('opacity', 1)),
        update => update
          .attr('d', d => this.sliceGenerator(d, xScale))
          .call(update => update.transition(this.t)
            .attr('transform', d => `translate(0, ${yScale(d.newName) + yScale.bandwidth() / 2})`)),
        exit => exit.transition(this.t)
          .style('opacity', 0)
          .remove()
      )
  }

  syscallArrowGenerator(d,xScale){
    //console.log(d)
    if(d.hasOwnProperty('syscalls')){
      const xOffsets =  data => data['syscalls'].map(d => d.execution_offset)
      //console.log(xOffsets)
      const arrowPoint = xOffsets(d)
      //console.log(arrowPoint)
      //const line = d3.line().context(context);
      const context = d3.path()
  
      for (let i = 0; i < arrowPoint.length; i++) {
        context.moveTo(xScale(arrowPoint[i]), 0)
        context.lineTo(xScale(arrowPoint[i]), 4)
      }
  
      //console.log(context)
  
      return context
    }
  }

  drawSystemCalls(g, xScale, yScale){
    g.selectAll('path')
    .data(this.props.data.filter(d => d.visible), d => d.newName)
    .join(
      enter => enter.append('path')
        .attr('class', 'thread-chart__context-view__system-call-group__arrow')
        .attr('transform', d => `translate(0, ${yScale(d.newName) - 2 + yScale.bandwidth() / 4})`)
        .attr('d', d => this.syscallArrowGenerator(d, xScale))
        .attr("marker-end","url(#arrow)")
        .style('stroke-width', 0.1)
        .style('stroke', 'red')
        .style('opacity', 0)
        .call(update => update.transition(this.t)
          .style('opacity', 1)),
      update => update
        .attr('d', d => this.syscallArrowGenerator(d, xScale))
        .call(update => update.transition(this.t)
          .attr('transform', d => `translate(0, ${yScale(d.newName) - 2 + yScale.bandwidth() / 4})`)),
      exit => exit.transition(this.t)
        .style('opacity', 0)
        .remove()
    )
  }

  create() {
    this.createContextView()
    this.createFocusView()
  }

  createContextView() {
    const { width, height, margin } = this.props
    const focusHeight = 100
    const contextView = d3.select(this.contextView)

    // y-axis
    const yScale = this.contextYScale
    const yAxis = d3.axisLeft(yScale)
      .tickSize(0)
    this.contextYAxis
      .call(yAxis)
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('text').style('font-size', '1.4em'))

    // x-axis
    const xScale = this.xScale
    const xAxis = d3.axisBottom(xScale)
    this.contextXAxis.call(xAxis)

    // grid line
    this.drawGridLines(this.contextGridLineGroup, yScale)

    // thread slices
    
    this.drawThreadSlices(this.contextSliceGroup, xScale, yScale)

    //system calls
    this.drawSystemCalls(this.systemCallGroup, xScale, yScale)
    //

    // clipping path (prevents data overflow on x axis)
    contextView.append('clipPath')
      .attr('id', 'clip')
      .append('rect')
      .attr('x', margin.left)
      .attr('y', margin.top)
      .attr('height', height - focusHeight)
      .attr('width', width - margin.left - margin.right)
  }

  createFocusView() {
    const { width, margin } = this.props
    const focusHeight = 100

    // x-axis
    const xScale = this.xScale
    const xAxis = d3.axisBottom(xScale)

    this.focusXAxis.call(xAxis)

    // y scale
    const yScale = this.focusYScale

    // slice 
    const brushPanel = d3.select(this.focusView)
    this.drawThreadSlices(this.focusSliceGroup, xScale, yScale, 5)

    // Brush
    const brushed = ({ selection }) => {
      const focus = (!selection) ? xScale.domain() : selection.map(xScale.invert).map(Math.floor)
      const newContextXScale = this.xScale.copy().domain(focus)
      this.updateContextView(newContextXScale, this.contextYScale)
    }

    const brush = d3.brushX()
      .extent([[margin.left, 0], [width - margin.right, focusHeight - margin.bottom]])
      .on('brush', brushed)
      .on('end', brushed)

    brushPanel.append('g')
      .attr('class', 'thread-chart__focus-view__brush')
      .call(brush)
  }

  updateContextView(newXScale, newYScale) {
    // x- and y- axis
    this.contextXAxis.transition(this.t).call(d3.axisBottom(newXScale))
    this.contextYAxis.transition(this.t).call(d3.axisLeft(newYScale).tickSize(0))
    this.contextYAxis.call(g => g.select('.domain').remove())
      .call(g => g.selectAll('text').style('font-size', '1.4em'))

    // grid lines
    this.drawGridLines(this.contextGridLineGroup, newYScale)

    // thread slices
    this.drawThreadSlices(this.contextSliceGroup, newXScale, newYScale)
    //sys calls
    this.drawSystemCalls(this.systemCallGroup, newXScale, newYScale)
  }

  updateFocusView(newXScale, newYScale) {
    this.drawThreadSlices(this.focusSliceGroup, newXScale, newYScale, 5)
  }

  render() {
    return (
      <article className='thread-chart'>
        <svg
          className='thread-chart__context-view'
          ref={el => this.contextView = el}
          width={this.props.width}
          height={this.props.height - 100}>
        </svg>
        <svg
          className='thread-chart__focus-view'
          ref={el => this.focusView = el}
          width={this.props.width}
          height='100'>
        </svg>
      </article>
    )
  }
}