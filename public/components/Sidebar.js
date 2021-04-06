class Sidebar extends React.Component {
  // static contextType = ThreadListContext

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

  handleCheck(thread) {
    if (this.props.displayedThreads.includes(thread))
      this.props.updateThreads(this.props.displayedThreads.filter(el => el != thread))
    else
      this.props.updateThreads(this.props.displayedThreads.concat(thread))
  }

  render() {
    console.log(this.props.scColor)
    return (
      <nav className="sidebar">
        <form>
          <input className="search-box form-control" type="search" placeholder="Search thread..." onChange={this.handleSearchThread} value={this.state.threadKeyword} />
        </form>
        <div className="thread-list overflow-auto" style={{ maxHeight: "30%" }}>
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
          <div className="syscall-list overflow-auto" style={{ maxHeight: "60%" }}>
            <ul className="list-group list-group-flush">
              {[...this.props.scColor.keys()].filter(syscall => syscall.includes(this.state.syscallKeyword)).map(syscall =>
                <li key={syscall} className="list-group-item list-group-item-action d-flex w-100 justify-content-between" /*onClick={(event) => this.handleCheck(syscall)}*/>
                  <span style={{ color: this.props.scColor.get(syscall) }}>&#9646;</span><span>{syscall}</span>
                  <input type="checkbox" /*checked={this.props.displayedThreads.includes(thread)}*/ readOnly />
                </li>
              )}
            </ul>
          </div>
        }
      </nav>
    )
  }
}