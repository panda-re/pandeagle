class ThreadChart extends React.Component {
  constructor(props) {
    super(props)
  }

  render() {
    if (this.props.databaseError) {
      return <h1>Error Connecting to Database</h1>
    }
    return (
      <div>
        <article className='thread-chart'>
          <ContextView
            data={this.props.data}
            domain={this.props.domain}
            showSysCalls={this.props.showSysCalls}
            onZoom={this.props.onZoom}

            width={this.props.width}
            height={this.props.height / 40 * 30}
            margin={this.props.margin}
          />
          <FocusView
            data={this.props.allData}
            domain={this.props.domain}
            onZoom={this.props.onZoom}

            width={this.props.width}
            height={this.props.height / 40 * 10}
            margin={this.props.margin}
          />
        </article>
        <button onClick={this.props.onZoomOut}>zoom out</button>
        &nbsp;
        <button onClick={this.props.onReset}>reset</button>
      </div>
    )
  }
}