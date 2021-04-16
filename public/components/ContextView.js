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
    const data = (!this.props.showSysCalls ?
      [] :
      this.props.data
    )
    const scargs = this.props.scargs
    const scColor = this.props.scColor

    const arrowData = data.map(el => el.syscalls).flat()
    const nameMap = new Map()
    // nameData will be an empty array if the space available is too cramped to display all system call names
    const nameData = (data.length > 5) ?
      [] :
      data.map(el => {
        if (el.syscalls.length < 20) { // FIXME: Any better way to check if there is enough room to show all system call
          nameMap.set(el.thread_id, el.syscalls)
          return el.syscalls
        } else {
          return []
        }
      }).flat()
    const uniqueNames = [...new Set(nameData.map(d => d.name))]
    const heightRange = [length, yScale.bandwidth() / 2 - threadSliceHeight / 2 - 10] // 20 = size of system call name labels
    const lengthScale = (Array.isArray(uniqueNames) && uniqueNames.length !== 0) ?
      d3.scalePoint(uniqueNames, heightRange) :
      d => yScale.bandwidth() / 6 // default system call length = 1/4 yScale.bandwidth()
    const syscallArrowGenerator = (d, xScale, threadSliceHeight) => {
      const arrowPoint = d.execution_offset
      const context = d3.path()

      context.moveTo(xScale(arrowPoint), -(threadSliceHeight / 2 + lengthScale(d.name)))
      context.lineTo(xScale(arrowPoint), -threadSliceHeight / 2)

      return context
    }

    const tooltip = d3.select(this.tooltip)

    const systemCallGroup = this.systemCallGroup
    let selectedSystemCall = ''
    toggleSystemCalls()

    function toggleSystemCalls() {
      systemCallGroup.selectAll('path')
        .data(arrowData.filter(d => selectedSystemCall === '' || d.name === selectedSystemCall).filter(d => scColor.get(d.name).checked), d => d.syscall_id)
        .join(
          enter => enter.append('path')
            .attr('class', 'thread-chart__context-view__system-call__system-call-group__arrow')
            .style('stroke-width', 1)
            .style('stroke', d => scColor.get(d.name).color)
            .attr('transform', d => `translate(0, ${yScale(data.find(el => el.thread_id == d.thread_id).newName) + yScale.bandwidth() / 2})`)
            .attr('d', d => syscallArrowGenerator(d, xScale, threadSliceHeight))
            .style('opacity', 0)
            .call(enter => enter.transition()
              .style('opacity', 1))
            .on("mouseover", function (e, d) {
              tooltip.html(d.name)
                .style("left", e.clientX + "px")
                .style("top", e.clientY + "px")
                .transition()
                .style("opacity", .9)
            })
            .on("mouseout", () => tooltip.transition().style("opacity", 0)),
          update => update
            .attr('transform', d => `translate(0, ${yScale(data.find(el => el.thread_id == d.thread_id).newName) + yScale.bandwidth() / 2})`)
            .call(update => update.transition()
              .attr('d', d => syscallArrowGenerator(d, xScale, threadSliceHeight))),
          exit => exit.transition().style('opacity', 0).remove()
        )

      systemCallGroup.selectAll('text')
        .data(nameData.filter(d => selectedSystemCall === '' || d.name === selectedSystemCall).filter(d => scColor.get(d.name).checked), d => d.syscall_id)
        .join(
          enter => enter.append('text')
            .attr('class', 'thread-chart__context-view__system-call__system-call-group__system-call-name')
            .attr('x', d => xScale(d.execution_offset))
            // .attr('debug', d => `y:${yScale(data.find(el => el.thread_id == d.thread_id).newName)}, threadsliceheight/2:${threadSliceHeight / 2},lengthScale:${lengthScale(d.name)}`)
            .attr('y', d => yScale(data.find(el => el.thread_id == d.thread_id).newName) + yScale.bandwidth() / 2 - (threadSliceHeight / 2 + lengthScale(d.name)))
            .attr('dy', '-.2em')
            .style('opacity', 0)
            .call(enter => enter.transition()
              .style('opacity', 1))
            .attr('text-anchor', 'middle')
            .style('font-size', 12)
            .style('fill', '#808080')
            .text(d => d.name)
            .style('cursor', 'pointer')
            .on("mouseover", (e, d) => {
              tooltip.transition().style("opacity", .9);
              let tooltip_html = `<ul style="list-style-type:none; padding:0" >`
              scargs.get(d.syscall_id).map(el => el.argument_type + " " + el.value).forEach(text => {
                tooltip_html = tooltip_html + `<li>${text}</li>`
              });
              tooltip_html = tooltip_html + `</ul>`
              tooltip.html(tooltip_html)
                .style("left", e.clientX + "px")
                .style("top", e.clientY + "px");
            })
            .on("mouseout", () => tooltip.transition().style("opacity", 0))
            .on('click', (e, d) => {
              selectedSystemCall = selectedSystemCall === d.name ? '' : d.name
              toggleSystemCalls()
            }),
          update => update
            .call(update => update.transition()
              .attr('x', d => xScale(d.execution_offset))
              .attr('y', d => yScale(data.find(el => el.thread_id == d.thread_id).newName) + yScale.bandwidth() / 2 - (threadSliceHeight / 2 + lengthScale(d.name)))),
          exit => exit.transition().style('opacity', 0).remove()
        )
    }
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
          .style('opacity', 0)
          .call(enter => enter.transition()
            .attr('d', d => sliceGenerator(d, xScale, height))
            .style('opacity', 1))
          .style('fill', '#4A89DC'),
        update => update
          .call(update => update.transition()
            .attr('d', d => sliceGenerator(d, xScale, height)))
          .attr('transform', d => `translate(0, ${yScale(d.newName) + yScale.bandwidth() / 2})`)
          .selection(),
        exit => exit
          .transition()
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