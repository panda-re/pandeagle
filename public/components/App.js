class App extends React.Component {
  constructor(props) {
    super(props)

    this.updateThreads = threads => this.setState({ threads })
    this.databaseFail = () => this.setState({ databaseError: true })
    this.resetDatabase = () => this.setState({ databaseError: false })

    this.handleZoom = this.handleZoom.bind(this)
    this.handleToggleSysCalls = this.handleToggleSysCalls.bind(this)

    this.state = {
      threads: [],
      syscall: [],
      zoomedThreads: [],
      showSysCalls: false,
      isLoading: true,
      updateThreads: this.updateThreads,
      databaseError: false,
    }
  }

  async componentDidMount() {
    const data = await d3.json('/executions/1/threadslices')
      .catch((err) => {
        this.databaseFail()
        this.setState({ isLoading: false })
      })
    //const syscall = await d3.json('http://localhost:3000/executions/1/syscalls/')

    if (!data) return
    let threadNames = this.renameDuplicates(data.map(data => data["names"].join(" ")))

    for (let i = 0; i < data.length; i++) {
      data[i].newName = threadNames[i]
      data[i].visible = true
      //data[i].syscalls = []
    }

    data.sort((a, b) => a.newName.replace(/ *\([^)]*\) */g, '').localeCompare(b.newName.replace(/ *\([^)]*\) */g, '')))

    //const result = syscall.map(x => Object.assign(x, data.find(y => y.thread_id == x.thread_id)))
    //console.log(result)
    //console.log(data)

    this.setState({
      threads: data,
      zoomedThreads: threadNames,
      isLoading: false
    })
  }

  renameDuplicates(threadNames) {
    const nameCounts = new Map()
    const newNames = []
    //console.log(this.state.isLoading)

    threadNames.forEach(name => {
      let count = nameCounts.get(name)
      if (count == undefined) {
        nameCounts.set(name, 1)
        newNames.push(name)
      } else {
        count++
        nameCounts.set(name, count)
        newNames.push(name + count.toString())
      }
    })

    return newNames
  }

  async handleToggleSysCalls() {
    await this.fetchSysCalls()
    this.setState(prevState => ({ showSysCalls: !prevState.showSysCalls }))
  }

  async fetchSysCalls() {
    if (!this.state.threads[0].hasOwnProperty('syscalls')) {
      const syscall = await d3.json('/executions/1/syscalls/')
        .catch((err) => {
          this.databaseFail()
        })
      this.setState({ threads: this.state.threads.map(x => Object.assign(x, syscall.find(y => y.thread_id == x.thread_id))) })
    }

  }

  handleZoom(zoomedThreads) {
    this.setState({ zoomedThreads })
  }

  render() {
    return (
      <React.Fragment>
        <Header
          showSysCalls={this.state.showSysCalls}
          onToggleSysCalls={this.handleToggleSysCalls}
          databaseFail={this.databaseFail}
          resetDatabase={this.resetDatabase}
        />
        <div className="container">
          {!this.state.isLoading &&
            <Sidebar
              data={this.state.threads}
              zoomedThreads={this.state.zoomedThreads}
              updateThreads={this.updateThreads}
            />}
          {!this.state.isLoading &&
            <main className="main">
              <ThreadChart
                databaseError={this.state.databaseError}
                zoomedThreads={this.state.zoomedThreads}
                data={this.state.threads}
                height={this.state.threads.length * 30 + 100}
                showSysCalls={this.state.showSysCalls}
                width={1000}
                margin={{
                  top: 10,
                  right: 20,
                  bottom: 30,
                  left: 120
                }}
                onZoom={this.handleZoom}
              />
            </main>}
        </div>
      </React.Fragment>
    )
  }
}

ReactDOM.render(<App />, document.querySelector('#root'))