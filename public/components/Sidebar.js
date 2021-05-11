/**
 * Sidebar component 
 * 
 * Allows the users to filter thread slices and system calls 
 */
class Sidebar extends React.Component {
  /**
   * The object structure of a system call in the props of Sidebar component
   * 
   * @typedef {Object} Syscall
   * @property {number} execution_offset the execution offset of the system call
   * @property {string} name the name of the system call
   * @property {number} syscall_id the id of the system call
   * @property {number} thread_id the id of its corresponding thread
   * 
   * @see SidebarProps
   */
  /**
   * The object structure of a thread slice in the props of Sidebar component
   * 
   * @typedef {Object} ThreadSlice
   * @property {number} end_execution_offset the end execution offset of the thread slice
   * @property {number} start_execution_offset the start execution offset of this thread
   * @property {number} thread_id the id of its corresponding thread
   * @property {number} threadslice_id the id of this thead slice
   * 
   * @see SidebarProps
   */
  /**
   * The object structure of a thread in the props of Sidebar component
   * 
   * @typedef {Object} Thread
   * @property {string[]} names the original name of the thread
   * @property {string} newName the concatenated name of the thread
   * @property {Syscalls[]} syscalls the system calls corresponding with this thread
   * @property {ThreadSlice[]} thread_slices the thread slices corresponding with this thread
   * 
   * @see SidebarProps
   */
  /**
   * updateThreads callback updates the threads variable in the App component
   * 
   * @callback updateThreads
   * @param {string[]} threads the names of the visible threads
   * 
   * @see SidebarProps
   */
  /**
   * toggleSc callback toggles the visibility of a particular system call
   * 
   * @param {string} syscall the name of the system call to be shown or hidden
   * 
   * @see SidebarProps
   */
  /**
   * The object structure of props used by Sidebar component
   * 
   * @typedef {Object} SidebarProps
   * @property {string[]} allThreads all the names of the threads
   * @property {string[]} displayedThreads the names of the threads that are currently visible
   * @property {string[]} displayedSyscalls the names of the threads that are currently visible
   * @property {Map} scColor a map associating the names of the system calls to their states of visibility and their colors
   * @property {toggleSc} toggleSc callback that toggles the visibility of a system call
   * @property {updateThreads} updateThreads callback that updates the visible threads
   */
  /**
   * Constructor of Sidebar
   * 
   * @param {SidebarProps} props the props of the Sidebar component
   */
  constructor(props) {
    super(props)
    this.state = {
      threadKeyword: '',
      syscallKeyword: ''
    }

    this.handleSearchThread = (event) => this.setState({ threadKeyword: event.target.value })
    this.handleSearchSyscall = (event) => this.setState({ syscallKeyword: event.target.value })
    this.handleCheck = this.handleCheck.bind(this)
  }

  componentDidMount() {
    const sidebarToggleButton = document.querySelector('#sidebar-collapse')
    const sidebar = document.querySelector('.sidebar')
    sidebarToggleButton.addEventListener('click', () => {
      sidebar.classList.toggle('active')
    })
  }

  /**
   * Handle events when a user check/uncheck a particular thread
   * @param {string} thread 
   */
  handleCheck(thread) {
    if (this.props.displayedThreads.includes(thread))
      this.props.updateThreads(this.props.displayedThreads.filter(el => el != thread))
    else
      this.props.updateThreads(this.props.displayedThreads.concat(thread))
  }

  render() {
    const syscallChecked = this.props.displayedSyscalls
    const syscallNoCheck = [...this.props.scColor.keys()].filter(el => !syscallChecked.includes(el))

    return (
      <nav className="sidebar">
        <form>
          <input className="search-box form-control" type="search" placeholder="Search thread..." onChange={this.handleSearchThread} value={this.state.threadKeyword} />
        </form>
        <div className="thread-list overflow-auto" style={{ maxHeight: "40%" }}>
          <ul className="list-group list-group-flush">
            {this.props.allThreads.filter(thread => thread.includes(this.state.threadKeyword)).map(thread =>
              <li key={thread} className="list-group-item list-group-item-action d-flex w-100 justify-content-between" onClick={(event) => this.handleCheck(thread)}>
                <span>{thread}</span>
                <input type="checkbox" checked={this.props.displayedThreads.includes(thread)} readOnly />
              </li>
            )}
          </ul>
        </div>

        <form>
          <input className="search-box form-control" type="search" placeholder="Search syscall..." onChange={this.handleSearchSyscall} value={this.state.syscallKeyword} />
        </form>
        {this.props.scColor.size &&
          <div className="syscall-list overflow-auto" style={{ maxHeight: "50%" }}>
            <ul className="list-group list-group-flush">
              {syscallChecked.filter(syscall => syscall.includes(this.state.syscallKeyword)).map(syscall =>
                <li key={syscall} className="list-group-item list-group-item-action d-flex w-100 justify-content-between" onClick={(event) => this.props.toggleSc(syscall)}>
                  <span style={{ color: this.props.scColor.get(syscall).color }}>&#9646;</span><span>{syscall}</span>
                  <input type="checkbox" checked={this.props.scColor.get(syscall).checked} readOnly />
                </li>
              )}
            </ul>
          </div>
        }
      </nav>
    )
  }
}