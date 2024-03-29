/**
 * FocusView component represents the focus view of the chart.
 */
class FocusView extends React.Component {
  /**
   * Bind references to various subcomponents
   */
  componentDidMount() {
    const svg = d3.select(this.svg)
    const { height, margin } = this.props

    this.xAxis = svg.append('g')
      .attr('class', 'thread-chart__focus-view__x-axis')
      .attr('transform', `translate(0, ${height - margin.bottom})`)
    // brushGroup contains the svg elements generated by d3-brush, which are used to support brushing behavior on FocusView
    this.brushGroup = svg.append('g')
      .attr('class', 'thread-chart__focus-view__brush')
    // sliceGroup contains the path elements for thread slices
    this.sliceGroup = svg.append('g')
      .attr('class', 'thread-chart__focus-view__slice-group')
    // contextViewSelectedArea contains the single rect element for highlighting the currently selected area
    this.contextViewSelectedArea = svg.append('g')
      .attr('class', 'thread-chart__focus-view__context-view-selected-area')

    this.draw()
  }

  /**
   * Trigger re-rendering on props change
   */
  componentDidUpdate() {
    // whenever thread slices data changes, this React lifecycle method will be triggered, 
    // which in turn triggers a re-render on the FocusView
    this.draw()
  }

  /**
   * Rendering function
   */
  draw() {
    const { data, width, height, margin } = this.props

    // calculate the domain of x-axis
    const maxTime = Math.max(...data.map(t => Math.max(...t.thread_slices.map(d => d.end_execution_offset))))
    const minTime = Math.min(...data.map(t => Math.min(...t.thread_slices.map(d => d.start_execution_offset))))

    // d3 scales for x- and y-axes
    // the domain of x-axis is the interval between the smallest timestamp, minTime, to the larges timestamp, maxTime
    this.xScale = d3.scaleLinear().domain([minTime, maxTime]).range([margin.left, width - margin.right])
    // the domain of y-axis is all the thread names
    this.yScale = d3.scaleBand().domain(data.map(el => el.newName)).range([margin.top, height - margin.bottom])

    // x-axis
    const xAxis = d3.axisBottom(this.xScale)
    this.xAxis.call(xAxis)

    // draw thread slices 
    this.drawThreadSlices()

    // draw the box that highlights the currently selected area
    this.drawFocusViewBox()

    // add brushing support on FocusView
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

  /**
   * Draw thread slices
   */
  drawThreadSlices() {
    // sliceGenerator calcualtes the context, or the content of the d attribute of a path element
    // using d, the curreent thread slices
    // xScale, the x scale
    // and height, the computed height of the thread slices
    const sliceGenerator = (d, xScale, height) => {
      const startAccessor = data => data['thread_slices'].map(d => d.start_execution_offset)
      const endAccessor = data => data['thread_slices'].map(d => d.end_execution_offset)

      const startPoints = startAccessor(d)
      const endPoints = endAccessor(d)

      const context = d3.path()
      for (let i = 0; i < startPoints.length; i++) {
        // x and y are the coordinates of the thread slice
        // w and h are the width and height of the thread slice
        const [x, y, w, h] = [xScale(startPoints[i]), -height / 2, xScale(endPoints[i]) - xScale(startPoints[i]), height]
        context.rect(x, y, w, h)
      }

      return context
    }

    // draw thread slices
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

  /**
   * Draw the box of currently selected area 
   */
  drawFocusViewBox() {
    // remove the old selection box
    this.contextViewSelectedArea.select('rect').remove();

    const xDomain = this.props.domain.xDomain
    const yDomain = this.props.domain.yDomain

    // calculate the coordinates of the selection box
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
