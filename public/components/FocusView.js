class FocusView extends React.Component {
  componentDidMount() {
    const svg = d3.select(this.svg)
    const { height, margin } = this.props

    this.xAxis = svg.append('g')
      .attr('class', 'thread-chart__focus-view__x-axis')
      .attr('transform', `translate(0, ${height - margin.bottom})`)
    this.brushGroup = svg.append('g')
      .attr('class', 'thread-chart__focus-view__brush')
    this.sliceGroup = svg.append('g')
      .attr('class', 'thread-chart__focus-view__slice-group')
    this.contextViewSelectedArea = svg.append('g')
      .attr('class', 'thread-chart__focus-view__context-view-selected-area')

    this.draw()
  }

  componentDidUpdate() {
    this.draw()
  }

  draw() {
    const { data, width, height, margin } = this.props

    const maxTime = Math.max(...data.map(t => Math.max(...t.thread_slices.map(d => d.end_execution_offset))))
    const minTime = Math.min(...data.map(t => Math.min(...t.thread_slices.map(d => d.start_execution_offset))))
    this.xScale = d3.scaleLinear().domain([minTime, maxTime]).range([margin.left, width - margin.right])
    this.yScale = d3.scaleBand().domain(data.map(el => el.newName)).range([margin.top, height - margin.bottom])

    // x-axis
    const xAxis = d3.axisBottom(this.xScale)
    this.xAxis.call(xAxis)

    // slice 
    this.drawThreadSlices()

    // box
    this.drawFocusViewBox()

    // Brush
    const brushended = ({ selection }) => {
      if (selection) {
        const newXDomain = selection.map(this.xScale.invert).map(Math.floor)

        this.props.onZoom({
          xDomain: newXDomain,
          yDomain: data.map(el => el.newName)
        })

        this.brushGroup.call(brush.clear)
      }
    }

    const brush = d3.brushX()
      .extent([[margin.left, 0], [width - margin.right, height - margin.bottom]])
      .on('end', brushended)

    this.brushGroup.call(brush)
  }

  drawThreadSlices() {
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
          .attr('transform', d => `translate(0, ${this.yScale(d.newName) + this.yScale.bandwidth() / 2})`)
          .attr('d', d => sliceGenerator(d, this.xScale, 5))
          .style('fill', '#4A89DC')
          .style('opacity', 1),
        update => update
          .attr('d', d => sliceGenerator(d, this.xScale, 5))
          .attr('transform', d => `translate(0, ${this.yScale(d.newName) + this.yScale.bandwidth() / 2})`)
          .selection(),
        exit => exit
          .style('opacity', 0)
          .remove()
      )
  }

  drawFocusViewBox() {
    this.contextViewSelectedArea.select('rect').remove();

    const xDomain = this.props.domain.xDomain
    const yDomain = this.props.domain.yDomain

    const [x1, x2] = xDomain.map(this.xScale)
    const [y1, y2] = [this.yScale(yDomain[0]), this.yScale(yDomain[yDomain.length - 1]) + this.yScale.step()]
    this.contextViewSelectedArea.append('rect')
      .attr('x', x1)
      .attr('y', y1)
      .attr('width', x2 - x1)
      .attr('height', y2 - y1)
      .style('stroke', 'red')
      .style('stroke-width', 1)
      .style('fill', 'none')

  }

  render() {
    return (
      <svg
        className='thread-chart__focus-view'
        ref={el => this.svg = el}
        width={this.props.width}
        height={this.props.height}>
      </svg>
    )
  }
}
