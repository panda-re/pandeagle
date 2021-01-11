class App extends React.Component {
  constructor(props) {
    super(props)

    this.updateThreads = threads => this.setState({ threads })

    this.state = {
      threads: [],
      updateThreads: this.updateThreads
    }

  }

  render() {
    return (
      <ThreadListContext.Provider value={this.state}>
        <Sidebar />
        <ThreadChart />
      </ThreadListContext.Provider >
    )
  }
}

ReactDOM.render(<App />, document.querySelector('#root'))