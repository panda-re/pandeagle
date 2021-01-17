class App extends React.Component {
  constructor(props) {
    super(props)

    this.updateThreads = threads => this.setState({ threads })

    this.state = {
      threads: [],
      updateThreads: this.updateThreads
    }

  }
  
  async componentDidMount(){
    const data = await d3.json('http://localhost:3000/executions/1/threadslices')
    let threadNames = this.renameDuplicates(data.map(data => data["names"].join(" ")))
    for (let i = 0; i < data.length; i++) {
      data[i].newName = threadNames[i]
      data[i].visible = true
    }
    console.log(data)
    this.setState({threads: data})
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
      <ThreadListContext.Provider value={this.state}>
        <Sidebar />
        <ThreadChart data={this.state.threads}/>
      </ThreadListContext.Provider >
    )
  }
}

ReactDOM.render(<App />, document.querySelector('#root'))