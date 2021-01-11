class Sidebar extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      threads: [],
      keyword: '',
      lastCheckedIndex: -1,
      lastCheckedState: true
    }

    this.handleSearch = this.handleSearch.bind(this)
    this.handleCheck = this.handleCheck.bind(this)
  }

  componentDidMount() {
    d3.json('http://localhost:3000/executions/1/threadslices').then(data => {
      const threads = [...new Set(data.map(d => d.names[0]))].map(d => ({ name: d, visible: true }))
      this.setState({ threads })
    })

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
    const threads = this.state.threads.slice()
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
      threads,
      lastCheckedIndex: index,
      lastCheckedState: state
    })
  }

  render() {
    return (
      <div>
        <form>
          <input className="search-box form-control" type="search" placeholder="Search..." onChange={this.handleSearch} value={this.state.keyword} />
        </form>
        <ul className="thread-list list-group list-group-flush">
          {this.state.threads.filter(thread => thread.name.includes(this.state.keyword)).map((thread, index) =>
            <li key={index} className="list-group-item list-group-item-action">
              <label className="d-flex w-100 justify-content-between">
                <span>{thread.name}</span>
                <input type="checkbox" checked={thread.visible} onChange={(event) => { console.log(event); this.handleCheck(event, index) }}></input>
              </label>
            </li>
          )}
        </ul>
      </div>
    )
  }
}

ReactDOM.render(<Sidebar />, document.querySelector('.sidebar'))