/**
 * Thread chart component contains the context view and focosu view components and other control buttons.
 */
class ThreadChart extends React.Component {
  /**
   * The object structure of the margin variable in the props of ThreadChart
   * 
   * @typedef {Object} Margin
   * @property {number} top the top margin of the ThreadChart component
   * @property {number} right the right margin of the ThreadChart component
   * @property {number} bottom the bottom margin of the ThreadChart component
   * @property {number} left the left margin of the ThreadChart component
   * 
   * @see ThreadChartProps
   */
  /**
   * The object structure of the domain variable in the props of ThreadChart
   * 
   * @typedef {Object} Domain
   * @property {number[]} xDomain the x domain of the x scale
   * @property {string[]} yDomain the y domain of the y scale
   * 
   * @see ThreadChartProps
   */
  /**
   * onDownload callback notifies the App component when the user clicks on the "Download current replay" button
   * 
   * @callback onDownload
   * 
   * @see ThreadChartProps
   * @see App
   */
  /**
   * onLoad callback notifies the App component when the user clicks on the "Load a replay" button
   * 
   * @callback onLoad
   * @param {Object} e the event containing the uploaded replay file 
   * 
   * @see SidebarProps
   * @see App
   */
  /**
   * onPan callback notifies the App component when the user clicks on either the pan left or the pan right buttons
   * 
   * @callback onPan
   * @param {number} direction either -1 or 1, indicating whether the user wants to pan to the left or right, respectively
   * 
   * @see SidebarProps
   * @see App
   */
  /**
   * onReset callback notifies the App component when the user clicks on the "reset" button
   * 
   * @callback onReset
   * 
   * @see SidebarProps
   * @see App
   */
  /**
   * The object structure of the newDomain parameter used in the onZoom callback
   * 
   * @typedef {Object} NewDomains
   * @property {number[]} xDomain the new x domain
   * @property {string[]} yDomain the new y domain
   * 
   * @see onZoom
   */
  /**
   * onZoom callback notifies the App component when the user zooms in on either the ContextView or the FocusView with the new domains of x- and y-axes
   * 
   * @callback onZoom
   * @param {NewDomains} newDomain the new domains of the x- and y-axes
   * 
   * @see SidebarProps
   * @see App
   */
  /**
   * onZoomOut callback notifies the App component when the user clicks on the "Go Back" button.
   * Since the "Go Back" button can not only go back in zoom levels but also panning positions,
   * this callback is triggered in either of these two scenarios.
   * 
   * @callback onZoomOut
   * 
   * @see SidebarProps
   * @see App
   */
  /**
   * The object structure of the props used by ThreadChart component
   * 
   * @typedef {Object} ThreadChartProps  
   * @property {Thread[]} allData an array containing all the threads
   * @property {boolean} atTopZoomLevel a boolean indicating if the ThreadChart component is at the top(default) zoom level
   * @property {Thread[]} data an array containing the visible threads in the ThreadChart component
   * @property {boolean} databaseError a boolean indicating if an error occurs while attemping to read from the database
   * @property {Domain} domain an array containing all the thread objects
   * @property {number} height the computed height of the ThreadChart component
   * @property {onDownload} onDownload a callback 
   * @property {onLoad} onLoad an object representing the margins of the ThreadChart component
   * @property {onPan} onPan an object representing the margins of the ThreadChart component
   * @property {onReset} onReset an object representing the margins of the ThreadChart component
   * @property {onZoom} onZoom an object representing the margins of the ThreadChart component
   * @property {onZoomOut} onZoomOut an object representing the margins of the ThreadChart component
   * @property {Map} scColor a map associating the names of the system calls to their states of visibility and their colors
   * @property {Map} margin an object representing the margins of the ThreadChart component
   * @property {boolean} showSysCalls a boolean indicating if the system calls are visible
   * @property {number} width the width of the ThreadChart component
   * 
   */
  /**
   * Constructor of TheadChart component
   * 
   * @param {ThreadChartProps} props 
   */
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
        <button onClick={this.props.onZoomOut}>Go Back</button>
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