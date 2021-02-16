class ThreadChart extends React.Component {
  constructor(props) {
    super(props)

    this.handleZoomOutClick = this.handleZoomOutClick.bind(this)
    this.handleResetClick = this.handleResetClick.bind(this)
  }

  componentDidMount() {
    const { data, width, height, margin } = this.props
    const focusHeight = 100
    const maxTime = Math.max(...data.map(t => Math.max(...t.thread_slices.map(d => d.end_execution_offset))))
    const minTime = Math.min(...data.map(t => Math.min(...t.thread_slices.map(d => d.start_execution_offset))))
    const contextView = d3.select(this.contextView)
    const focusView = d3.select(this.focusView)

    this.contextXDomain = [minTime, maxTime];
    this.contextXScale = d3.scaleLinear()
      .domain(this.contextXDomain)
      .range([margin.left, width - margin.right])

    this.contextYDomain = data.map(d => d.newName);
    this.contextYScale = d3.scaleBand()
      .domain(this.contextYDomain)
      .range([margin.top, height - focusHeight - margin.bottom])

    this.focusXScale = this.contextXScale.copy()
    this.focusYScale = this.contextYScale.copy().range([margin.top, focusHeight - margin.bottom])

    this.focus = null
    this.history = [{
      xscale: this.contextXScale,
      yscale: this.contextYScale,
      xdomain: this.contextXDomain,
      ydomain: this.contextYDomain
    }]

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
    this.contextViewSelectedArea = focusView.append('g')
      .attr('class', 'thread-chart__focus-view__context-view-selected-area')

    this.create()
  }

  componentDidUpdate() {
    const { data } = this.props

    const newYDomain = data.filter(thread => this.props.zoomedThreads.includes(thread.newName)).filter(d => d.visible).map(d => d.newName)
    const newYScale = this.contextYScale.copy().domain(newYDomain);

    this.contextYDomain = newYDomain;
    this.contextYScale = newYScale;

    this.updateContextView(this.contextXScale, newYScale)
  }

  get t() {
    return d3.transition().duration(1000)
  }

  create() {
    this.createContextView()
    this.createFocusView()
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

  syscallArrowGenerator(d, xScale, length) {
    if (d.hasOwnProperty('syscalls') && this.props.showSysCalls) {
      const xOffsets = data => data['syscalls'].map(d => d.execution_offset)
      const arrowPoint = xOffsets(d)
      const context = d3.path()

      for (let i = 0; i < arrowPoint.length; i++) {
        context.moveTo(xScale(arrowPoint[i]), -length)
        context.lineTo(xScale(arrowPoint[i]), 0)
      }

      return context
    }
  }

  drawSystemCalls(g, xScale, yScale, strokeWidth = 10, length = 10) {
    g.selectAll('path')
      .data(this.props.data.filter(d => d.visible), d => d.newName)
      .join(
        enter => enter.append('path')
          .attr('class', 'thread-chart__context-view__system-call-group__arrow')
          .attr('transform', d => `translate(0, ${yScale(d.newName) + yScale.bandwidth() / 2 - strokeWidth / 2})`)
          .attr('d', d => this.syscallArrowGenerator(d, xScale, length))
          .style('stroke-width', 1) // FIXME: the width of the system call arrwos is currently hard-coded as 1
          .style('stroke', '#FF6347')
          .style('opacity', 0)
          .call(update => update.transition(this.t)
            .style('opacity', 1)),
        update => update
          .attr('d', d => this.syscallArrowGenerator(d, xScale, length))
          .call(update => update.transition(this.t)
            .attr('transform', d => `translate(0, ${yScale(d.newName) + yScale.bandwidth() / 2 - strokeWidth / 2})`)),
        exit => exit.transition(this.t)
          .style('opacity', 0)
          .remove()
      )
  }

  createContextView() {
    const { width, height, margin, data } = this.props
    const focusHeight = 100
    const contextHeight = height - focusHeight
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
    const xScale = this.contextXScale
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

    // brush
    const brush = d3.brush()
      .extent([[margin.left, 0.5], [width - margin.right, contextHeight - margin.bottom + 0.5]])
      .on('end', brushended.bind(this))

    const contextBrushGroup = contextView.append('g')
      .attr('class', 'thread-chart__context-view__brush')
      .call(brush)

    function brushended({ selection }) {
      if (selection) {
        const newXDomain = [selection[0][0], selection[1][0]].map(this.contextXScale.invert)
        const newThreads = this.contextYScale.domain().slice(...[selection[0][1], selection[1][1]].map(d => Math.round(d / this.contextYScale.step())))
        const newYDomain = data.filter(d => newThreads.includes(d.newName) &&
          d.thread_slices.some(d => (newXDomain[0] <= d.start_execution_offset && d.start_execution_offset <= newXDomain[1]) ||
            (newXDomain[0] <= d.end_execution_offset && d.end_execution_offset <= newXDomain[1]) ||
            (d.start_execution_offset <= newXDomain[0] && newXDomain[1] <= d.end_execution_offset)))
          .map(d => d.newName)

        const newXScale = this.contextXScale.copy().domain(newXDomain)
        const newYScale = this.contextYScale.copy().domain(newYDomain)

        // check if the selected area has any thread slice
        // if no, do nothing
        if (newYDomain.length !== 0) {
          this.contextXDomain = newXDomain;
          this.contextYDomain = newYDomain;
          this.contextXScale = newXScale
          this.contextYScale = newYScale

          this.history.push({
            xscale: newXScale,
            yscale: newYScale,
            xdomain: newXDomain,
            ydomain: newYDomain
          })

          this.props.onZoom(newYDomain)

          contextBrushGroup.call(brush.clear)

          this.updateContextView(this.contextXScale, this.contextYScale)
        }
      }
    }
  }

  createFocusView() {
    const { width, margin } = this.props
    const focusHeight = 100

    // x-axis
    const xScale = this.focusXScale
    const xAxis = d3.axisBottom(xScale)

    this.focusXAxis.call(xAxis)

    // y scale
    const yScale = this.focusYScale

    // slice 
    const brushPanel = d3.select(this.focusView)
    this.drawThreadSlices(this.focusSliceGroup, xScale, yScale, 5)

    // Brush
    const brushended = ({ selection }) => {
      this.focus = (!selection) ? null : selection.map(xScale.invert).map(Math.floor)
      const newContextXScale = xScale.copy().domain(this.focus || xScale.domain())

      this.contextXScale = newContextXScale

      this.updateContextView(this.contextXScale, this.contextYScale)
    }

    const brush = d3.brushX()
      .extent([[margin.left, 0], [width - margin.right, focusHeight - margin.bottom]])
      .on('end', brushended)

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

    this.drawFocusViewBox();

    // grid lines
    this.drawGridLines(this.contextGridLineGroup, newYScale)

    // thread slices
    this.drawThreadSlices(this.contextSliceGroup, newXScale, newYScale)
    //sys calls
    this.drawSystemCalls(this.systemCallGroup, newXScale, newYScale)
  }

  drawFocusViewBox() {
    this.contextViewSelectedArea.select('rect').remove();
    if (this.history.length > 1) {
      const [x1, x2] = this.contextXDomain.map(this.focusXScale)
      const [y1, y2] = [this.focusYScale(this.contextYDomain[0]), this.focusYScale(this.contextYDomain[this.contextYDomain.length - 1]) + this.focusYScale.step()]
      this.contextViewSelectedArea.append('rect')
        .attr('x', x1)
        .attr('y', y1)
        .attr('width', x2 - x1)
        .attr('height', y2 - y1)
        .style('stroke', 'red')
        .style('stroke-width', 1)
        .style('fill', 'none')
    }
  }

  handleZoomOutClick() {

    if (this.history.length >= 2) {
      this.history.pop()
    }

    const last = this.history[this.history.length - 1]

    // console.log(this.history)
    // console.log(last.ydomain, last.yscale.domain(), this.contextYScale.domain())
    this.contextXDomain = last.xdomain
    this.contextYDomain = last.ydomain
    this.contextXScale = last.xscale
    this.contextYScale = last.yscale

    this.props.onZoom(last.ydomain)

    this.updateContextView(this.contextXScale, this.contextYScale)
  }

  handleResetClick() {
    const original = this.history[0]

    this.contextXScale = original.xscale
    this.contextYScale = original.yscale
    this.contextXDomain = original.xdomain
    this.contextYDomain = original.ydomain

    this.history = [original];
    this.props.onZoom(original.ydomain)

    this.updateContextView(this.contextXScale, this.contextYScale)
  }

  render() {
    if (this.props.databaseError) {
      return <h1>Error Connecting to Database</h1>
    }
    return (
      <div>
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
        <button onClick={this.handleZoomOutClick}>zoom out</button>
        &nbsp;
        <button onClick={this.handleResetClick}>reset</button>
      </div>
    )
  }
}