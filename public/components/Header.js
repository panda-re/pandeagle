/**
 * Header component 
 * 
 * Contains the control for sidebar, dropdown list for executions, a toggle button for syscall visibility, and a switch database button
 */
class Header extends React.Component {
  /**
   * The object structure of an execution in the props of Header component
   * 
   * @typedef {Object} Execution
   * @property {number} execution_id the id of the execution
   * @property {string} name the name of the execution
   * @property {string} description the description of the execution
   * @property {date} start_time the start time of the execution
   * @property {date} end_time the end time of the execution
   * 
   * @see HeaderProps
   */
  /**
   * The object structure of props used by Header component
   * 
   * @typedef {Object} HeaderProps  
   * @property {Execution[]} executions an array containing all the executions
   * @property {boolean} showSysCalls a boolean indicating if the syscalls are visible
   * @property {onToggleSysCalls} onToggleSysCalls callback that toggles the visibility of all system calls
   * @property {resetDatabase} resetDatabase callback that resets the databaseError value to false in App 
   * 
   */
  /**
   * Constructor of Header component
   * 
   * @param {HeaderProps} props 
   */
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
