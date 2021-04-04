class Header extends React.Component {
  constructor(props) {
    super(props)
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
            {this.props.executions.map(execution =>
              <option key={execution.execution_id} value={execution.execution_id}>{execution.name}</option>
            )}
          </select>
          <a className="navbar-brand" href="#">
            System Call
          </a>
          <ToggleSwitch checked={this.props.showSysCalls} onChange={this.props.onToggleSysCalls} />
        </form>

        <div className="col-auto ml-auto">
          <button className="form-control" data-toggle="modal" data-target="#databaseForm">
            Switch Database
          </button>
        </div>
        <DatabaseForm
          resetDatabase={this.props.resetDatabase}
        />
      </header>
    )
  }
}
