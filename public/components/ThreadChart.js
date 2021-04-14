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
            scColor={this.props.scColor}
            scargs={this.props.scargs}
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
        &nbsp;
        <button onClick={this.props.onDownload}>Download current replay</button>
        <a>  Load a replay:</a>
        <input type="file"
          onChange={this.props.onLoad} />
        {!this.props.atTopZoomLevel &&
          <div>
            <span className="thread-chart__pan-left" onClick={() => this.props.onPan(-1)}>&#10094;</span>
            <span className="thread-chart__pan-right" onClick={() => this.props.onPan(1)}>&#10095;</span>
          </div>
        }
        {/* <button onClick={this.props.onLoad}>load a replay</button> */}
      </div>
    )
  }
}