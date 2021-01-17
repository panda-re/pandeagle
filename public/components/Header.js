class Header extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      executions: [],
      threads: []
    }
  }

  componentDidMount() {
    this.fetchExecutions()
    this.fetchThreads()
  }

  fetchExecutions() {
    d3.json('/executions').then(executions => this.setState({ executions }))
  }

  fetchThreads() {
    d3.json('/executions/1/threadslices').then(threads => this.setState({ threads }))
  }

  render() {
    return (
      <header className="navbar navbar-expand-lg navbar-light bg-light">
        <a className="navbar-brand" href="#">
          <i className="bi bi-layout-sidebar" id="sidebar-collapse"></i>
          PANDEagle
        </a>
        <form className="form-inline my-2 my-lg-0">
          <select className="form-control mr-sm-2" id="processSelect">
            {this.state.executions.map(execution =>
              <option key={execution.execution_id} value={execution.execution_id}>{execution.name}</option>
            )}
          </select>
          <select className="form-control mr-sm-2" id="threadSelect">
            {this.state.threads.map(thread =>
              <option key={thread.thread_id} value={thread.thread_id}>{thread.names.join(' ')}</option>
            )}
          </select>
        </form>
      </header>
    )
  }
}