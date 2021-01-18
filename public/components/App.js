class App extends React.Component {
  constructor(props) {
    super(props)

    this.updateThreads = threads => this.setState({ threads })

    this.state = {
      threads: [],
      syscalls:[],
      isLoading: true,
      updateThreads: this.updateThreads
    }
  }

  async componentDidMount() {
    const data = await d3.json('http://localhost:3000/executions/1/threadslices')
    const syscall = await d3.json('http://localhost:3000/executions/1/syscalls/')
    let threadNames = this.renameDuplicates(data.map(data => data["names"].join(" ")))
    let threadSyscallNames = this.renameDuplicates(syscall.map(data => data["names"].join(" ")))
    for (let i = 0; i < data.length; i++) {
      data[i].newName = threadNames[i]
      data[i].visible = true
    }
    for (let i = 0; i < syscall.length; i++) {
      syscall[i].newName = threadSyscallNames[i]
      syscall[i].visible = true
    }
    // console.log(syscall)
    // console.log(data)
    this.setState({ threads: data, syscalls:syscall, isLoading: false })
  }

  renameDuplicates(threadNames) {
    const nameCounts = new Map()
    const newNames = []

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

  render() {
    return (
      // <ThreadListContext.Provider value={this.state}>
      <React.Fragment>
        <Header />
        <div className="container">
          {!this.state.isLoading &&
            <Sidebar
              data={this.state.threads}
              updateThreads={this.updateThreads} />}
          {!this.state.isLoading &&
            <main className="main">
              <ThreadChart
                data={this.state.threads}
                height={this.state.threads.length * 30 + 100}
                width={1000}
                margin={{
                  top: 10,
                  right: 20,
                  bottom: 30,
                  left: 120
                }} 
                syscall={this.state.syscalls}
                />
            </main>}
        </div>
      </React.Fragment>
      // </ThreadListContext.Provider >
    )
  }
}

ReactDOM.render(<App />, document.querySelector('#root'))