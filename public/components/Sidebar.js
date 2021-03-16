class Sidebar extends React.Component {
  // static contextType = ThreadListContext

  constructor(props) {
    super(props)
    this.state = {
      keyword: ''
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

  handleCheck(thread) {
    if (this.props.yDomain.includes(thread))
      this.props.updateThreads(this.props.yDomain.filter(el => el != thread))
    else
      this.props.updateThreads(this.props.yDomain.concat(thread))
  }

  render() {
    return (
      <nav className="sidebar">
        <form>
          <input className="search-box form-control" type="search" placeholder="Search..." onChange={this.handleSearch} value={this.state.keyword} />
        </form>
        <ul className="thread-list list-group list-group-flush">
          {this.props.all.filter(thread => thread.includes(this.state.keyword)).map(thread =>
            <li key={thread} className="list-group-item list-group-item-action d-flex w-100 justify-content-between" onClick={(event) => this.handleCheck(thread)}>
              <span>{thread}</span>
              <input type="checkbox" checked={this.props.yDomain.includes(thread)} readOnly />
            </li>
          )}
        </ul>
      </nav>
    )
  }
}