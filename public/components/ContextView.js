class ContextView extends React.Component {
  componentDidMount() {
    const svg = d3.select(this.svg)
    const { height, margin, width } = this.props

    this.xAxis = svg.append('g')
      .attr('class', 'thread-chart__context-view__x-axis')
      .attr('transform', `translate(0,${height - margin.bottom})`)
    this.yAxis = svg.append('g')
      .attr('class', 'thread-chart__context-view__y-axis')
      .attr('transform', `translate(${margin.left},0)`)
    this.brushGroup = svg.append('g')
      .attr('class', 'thread-chart__context-view__brush')
    this.gridLineGroup = svg.append('g')
      .attr('class', 'thread-chart__context-view__grid-line-group')
    this.sliceGroup = svg.append('g')
      .attr('class', 'thread-chart__context-view__slice-group')
    this.systemCallGroup = svg.append('g')
      .attr('class', 'thread-chart__context-view__system-call')

    this.draw()
  }

  componentDidUpdate() {
    this.draw()
  }

  draw() {
    const { data, domain, width, height, margin } = this.props

    const xScale = d3.scaleLinear().domain(domain.xDomain).range([margin.left, width - margin.right])
    const yScale = d3.scaleBand().domain(domain.yDomain).range([margin.top, height - margin.bottom])

    this.xAxis.call(d3.axisBottom(xScale))
    this.yAxis.call(d3.axisLeft(yScale).tickSize(0))
    this.yAxis.call(g => g.select('.domain').remove()).call(g => g.selectAll('text').style('font-size', '1.4em'))

    const { threadSliceHeight, systemCallArrowLength } = this.getContextViewElementHeights(yScale)

    const brushended = ({ selection }) => {
      if (selection) {
        const newXDomain = [selection[0][0], selection[1][0]].map(xScale.invert)
        const newThreads = yScale.domain().slice(...[selection[0][1], selection[1][1]].map(d => Math.round(d / yScale.step())))
        const newYDomain = data.filter(d => newThreads.includes(d.newName) &&
          d.thread_slices.some(d => (newXDomain[0] <= d.start_execution_offset && d.start_execution_offset <= newXDomain[1]) ||
            (newXDomain[0] <= d.end_execution_offset && d.end_execution_offset <= newXDomain[1]) ||
            (d.start_execution_offset <= newXDomain[0] && newXDomain[1] <= d.end_execution_offset)))
          .map(d => d.newName)

        // check if the selected area has any thread slice
        // if no, do nothing
        if (newYDomain.length !== 0) {
          this.props.onZoom({
            xDomain: newXDomain,
            yDomain: newYDomain
          })
        }

        this.brushGroup.call(brush.clear)
      }
    }

    const brush = d3.brush()
      .extent([[margin.left, 0.5], [width - margin.right, height - margin.bottom + 0.5]])
      .on('end', brushended)

    this.brushGroup.call(brush)

    this.drawGridLines(yScale)
    this.drawThreadSlices(xScale, yScale, threadSliceHeight)
    this.drawSystemCalls(xScale, yScale, threadSliceHeight, systemCallArrowLength)
  }

  drawSystemCalls(xScale, yScale, threadSliceHeight, length) {
    const syscallArrowGenerator = (d, xScale, threadSliceHeight, length) => {
      const arrowPoint = d.execution_offset
      const context = d3.path()

      context.moveTo(xScale(arrowPoint), -(threadSliceHeight / 2 + length))
      context.lineTo(xScale(arrowPoint), -threadSliceHeight / 2)

      return context
    }

    const data = (!this.props.showSysCalls ?
      [] :
      this.props.data
    )

    const arrowData = data.map(el => el.syscalls).flat()

    const nameMap = new Map()
    const nameData = data.map(el => {
      if (el.syscalls.length < 20) {
        nameMap.set(el.thread_id, el.syscalls)
        return el.syscalls
      } else {
        return []
      }
    }).flat()

    const tooltip = d3.select(this.tooltip)

    this.systemCallGroup.selectAll('path')
      .data(arrowData, d => d.syscall_id)
      .join(
        enter => enter.append('path')
          .attr('class', 'thread-chart__context-view__system-call__system-call-group__arrow')
          .style('stroke-width', 1)
          .style('stroke', '#FF6347')
          .attr('d', d => syscallArrowGenerator(d, xScale, threadSliceHeight, length))
          .attr('transform', d => `translate(0, ${yScale(data.find(el => el.thread_id == d.thread_id).newName) + yScale.bandwidth() / 2})`)
          .on("mouseover", function (e, d) {
            tooltip.style("opacity", .9);
            tooltip.html(d.name)
              .style("left", e.clientX + "px")
              .style("top", e.clientY + "px");
          })
          .on("mouseout", () => tooltip.style("opacity", 0)),
        update => update
          .attr('transform', d => `translate(0, ${yScale(data.find(el => el.thread_id == d.thread_id).newName) + yScale.bandwidth() / 2})`)
          .attr('d', d => syscallArrowGenerator(d, xScale, threadSliceHeight, length)),
        exit => exit.style('opacity', 0).remove()
      )

    this.systemCallGroup.selectAll('text')
      .data(nameData, d => d.syscall_id)
      .join(
        enter => enter.append('text')
          .attr('class', 'thread-chart__context-view__system-call__system-call-group__system-call-name')
          .attr('x', d => {
            const syscalls = nameMap.get(d.thread_id)
            const xDomain = this.props.domain.xDomain
            return xScale(xDomain[0] + (xDomain[1] - xDomain[0]) / syscalls.length * syscalls.findIndex(el => el.syscall_id == d.syscall_id))
          })
          .attr('transform', d => `translate(0, ${yScale(data.find(el => el.thread_id == d.thread_id).newName) + yScale.bandwidth() / 6})`)
          .attr('dy', '-.4em')
          .attr('text-anchor', 'middle')
          .style('font-size', 12)
          .style('fill', '#808080')
          .text(d => d.name)
          .style('opacity', 1)
          .on("mouseover", (e, d) => {
            tooltip.style("opacity", .9);
            tooltip.html("Syscall Args Goes here")
              .style("left", e.clientX + "px")
              .style("top", e.clientY + "px");
          })
          .on("mouseout", () => tooltip.style("opacity", 0)),
        update => update
          .attr('x', d => xScale(d.execution_offset))
          .attr('transform', d => `translate(0, ${yScale(data.find(el => el.thread_id == d.thread_id).newName) + yScale.bandwidth() / 6})`),
        exit => exit.style('opacity', 0).remove()
      )
  }

  drawThreadSlices(xScale, yScale, height) {
    const sliceGenerator = (d, xScale, height) => {
      const startAccessor = data => data['thread_slices'].map(d => d.start_execution_offset)
      const endAccessor = data => data['thread_slices'].map(d => d.end_execution_offset)

      const startPoints = startAccessor(d)
      const endPoints = endAccessor(d)

      const context = d3.path()
      for (let i = 0; i < startPoints.length; i++) {
        const [x, y, w, h] = [xScale(startPoints[i]), -height / 2, xScale(endPoints[i]) - xScale(startPoints[i]), height]
        context.rect(x, y, w, h)
      }

      return context
    }

    this.sliceGroup.selectAll('path')
      .data(this.props.data, d => d.newName)
      .join(
        enter => enter.append('path')
          .attr('class', 'thread-chart__slice-group__slice')
          .attr('transform', d => `translate(0, ${yScale(d.newName) + yScale.bandwidth() / 2})`)
          .attr('d', d => sliceGenerator(d, xScale, height))
          .style('fill', '#4A89DC')
          .style('opacity', 1),
        update => update
          .attr('d', d => sliceGenerator(d, xScale, height))
          .attr('transform', d => `translate(0, ${yScale(d.newName) + yScale.bandwidth() / 2})`)
          .selection(),
        exit => exit
          .style('opacity', 0)
          .remove()
      )
  }

  drawGridLines(yScale) {
    const { width, margin } = this.props
    const gridLine = d3.line()([[margin.left, 0], [width - margin.right, 0]])

    this.gridLineGroup.selectAll('path')
      .data(yScale.domain())
      .join(
        enter => enter.append('path')
          .attr('class', 'thead-chart__context-view__grid-line-group__grid-line')
          .attr('transform', d => `translate(0,${yScale(d) + yScale.bandwidth() / 2})`)
          .attr('d', gridLine)
          .style('stroke', '#272727')
          .style('opacity', 0.2),
        update => update.call(update => update
          .attr('transform', d => `translate(0,${yScale(d) + yScale.bandwidth() / 2})`)),
        exit => exit
          .style('opacity', 0)
          .remove()
      )
  }

  getContextViewElementHeights(yScale) {
    const bandwidth = yScale.bandwidth()
    const threadSliceHeight = bandwidth / 3
    const systemCallArrowLength = threadSliceHeight / 2
    return { threadSliceHeight, systemCallArrowLength }
  }

  render() {
    return (
      <div>
        <svg
          className='thread-chart__context-view'
          ref={el => this.svg = el}
          width={this.props.width}
          height={this.props.height}>
        </svg>
        <div
          className='tooltip'
          ref={el => this.tooltip = el}
          opacity={0}
          style={{
            backgroundColor: 'black',
            borderRadius: '5px',
            padding: '5px',
            color: 'white'
          }}
        />
      </div>

    )
  }
}