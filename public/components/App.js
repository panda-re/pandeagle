class App extends React.Component {
  constructor(props) {
    super(props)

    this.updateThreads = threads => this.setState({ threads })
    this.updateShowSysCalls = showSysCalls => this.setState({showSysCalls})

    this.state = {
      threads: [],
      syscall:[],
      showSysCalls: false,
      isLoading: true,
      updateThreads: this.updateThreads,
      updateShowSysCalls: this.updateShowSysCalls,
      getSyscalls: this.getSyscalls.bind(this)
    }
  }

  async componentDidMount() {
    const data = await d3.json('http://localhost:3000/executions/1/threadslices')
    //const syscall = await d3.json('http://localhost:3000/executions/1/syscalls/')
    let threadNames = this.renameDuplicates(data.map(data => data["names"].join(" ")))

    for (let i = 0; i < data.length; i++) {
      data[i].newName = threadNames[i]
      data[i].visible = true
      //data[i].syscalls = []
    }

    //const result = syscall.map(x => Object.assign(x, data.find(y => y.thread_id == x.thread_id)))
     //console.log(result)
     //console.log(data)
    this.setState({ threads: data,isLoading: false })
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

  async getSyscalls(){
    if(!this.state.threads[0].hasOwnProperty('syscalls')){
      const syscall = await d3.json('http://localhost:3000/executions/1/syscalls/')
      this.setState({threads :  syscall.map(x => Object.assign(x, this.state.threads.find(y => y.thread_id == x.thread_id)))})
    }
    
  }

  render() {
    return (
      // <ThreadListContext.Provider value={this.state}>
      <React.Fragment>
        <Header 
          getSyscalls = {this.state.getSyscalls}
          updateShowSysCalls = {this.updateShowSysCalls}
        />
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
                showSysCalls = {this.state.showSysCalls}
                width={1000}
                margin={{
                  top: 10,
                  right: 20,
                  bottom: 30,
                  left: 120
                }} 
                
                />
            </main>}
        </div>
      </React.Fragment>
      // </ThreadListContext.Provider >
    )
  }
}

ReactDOM.render(<App />, document.querySelector('#root'))