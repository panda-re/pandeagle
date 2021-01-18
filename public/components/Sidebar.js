class Sidebar extends React.Component {
  // static contextType = ThreadListContext

  constructor(props) {
    super(props)
    this.state = {
      keyword: '',
      lastCheckedId: -1,
      lastCheckedState: true
    }

    this.handleSearch = this.handleSearch.bind(this)
    this.handleCheck = this.handleCheck.bind(this)
  }

  componentDidMount() {
    const sidebarToggleButton = document.querySelector('#sidebar-collapse')
    const sidebar = document.querySelector('.sidebar')
    sidebarToggleButton.addEventListener('click', () => {
      sidebar.classList.toggle('active')
    })
  }

  handleSearch(event) {
    this.setState({ keyword: event.target.value })
    this.setState({ lastCheckedId: -1 })
  }

  handleCheck(event, id) {
    const threads = this.props.data.slice()
    const currentThread = threads.find(thread => thread.thread_id === id)
    let state = currentThread.visible = !currentThread.visible

    // Hold shift to check/uncheck multiple checkboxes
    if (event.nativeEvent.shiftKey // Workaround for event.shiftKey in React 17
      && this.state.lastCheckedId !== -1
      && this.state.lastCheckedId !== id) {
      let inBetween = false
      threads.forEach(thread => {
        const currentId = thread.thread_id
        if (currentId === this.state.lastCheckedId || currentId === id) {
          inBetween = !inBetween
        }
        if (inBetween) {
          thread.visible = this.state.lastCheckedState
        }
      })
    }

    this.setState({
      lastCheckedId: id,
      lastCheckedState: state
    })

    this.props.updateThreads(threads)
  }

  render() {
    return (
      <nav className="sidebar">
        <form>
          <input className="search-box form-control" type="search" placeholder="Search..." onChange={this.handleSearch} value={this.state.keyword} />
        </form>
        <ul className="thread-list list-group list-group-flush">
          {this.props.data.filter(thread => thread.newName.includes(this.state.keyword)).map(thread =>
            <li key={thread.thread_id} className="list-group-item list-group-item-action d-flex w-100 justify-content-between" onClick={(event) => this.handleCheck(event, thread.thread_id)}>
              <span>{thread.newName}</span>
              <input type="checkbox" checked={thread.visible} onChange={event => event.preventDefault()}></input>
            </li>
          )}
        </ul>
      </nav >
    )
  }
}