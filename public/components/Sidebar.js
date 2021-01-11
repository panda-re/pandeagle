class Sidebar extends React.Component {
  static contextType = ThreadListContext

  constructor(props) {
    super(props)
    this.state = {
      keyword: '',
      lastCheckedIndex: -1,
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
  }

  handleCheck(event, index) {
    const threads = this.context.threads.slice()
    let state = threads[index].visible = !threads[index].visible

    // Hold shift to check/uncheck multiple checkboxes
    if (event.nativeEvent.shiftKey) { // Workaround for event.shiftKey in React 17
      let inBetween = false
      threads.forEach((thread, i) => {
        if (i === this.state.lastCheckedIndex || i === index) {
          inBetween = !inBetween
        }
        if (inBetween) {
          thread.visible = this.state.lastCheckedState
        }
      })
    }

    this.setState({
      lastCheckedIndex: index,
      lastCheckedState: state
    })

    this.context.updateThreads(threads)
  }

  render() {
    return (
      <nav className="sidebar">
        <form>
          <input className="search-box form-control" type="search" placeholder="Search..." onChange={this.handleSearch} value={this.state.keyword} />
        </form>
        <ul className="thread-list list-group list-group-flush">
          {this.context.threads.filter(thread => thread.newName.includes(this.state.keyword)).map((thread, index) =>
            <li key={index} className="list-group-item list-group-item-action d-flex w-100 justify-content-between" onClick={(event) => this.handleCheck(event, index)}>
              <span>{thread.newName}</span>
              <input type="checkbox" checked={thread.visible} onChange={event => event.preventDefault()}></input>
            </li>
          )}
        </ul>
      </nav>
    )
  }
}