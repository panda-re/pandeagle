class App extends React.Component {
  constructor(props) {
    super(props)

    this.updateThreads = threads => {
      this.setState(prevState => ({
        history: prevState.history.concat([{
          xDomain: prevState.history[prevState.history.length - 1].xDomain,
          yDomain: threads.sort((a, b) => a.replace(/ *\([^)]*\) */g, '').localeCompare(b.replace(/ *\([^)]*\) */g, '')))
        }])
      }))
    }
    this.handleZoom = newDomain => {
      newDomain.yDomain.sort((a, b) => a.replace(/ *\([^)]*\) */g, '').localeCompare(b.replace(/ *\([^)]*\) */g, '')))
      this.setState(prevState => ({ history: prevState.history.concat([newDomain]) }))
    }
    this.databaseFail = () => this.setState({ databaseError: true })
    this.resetDatabase = () => this.setState({ databaseError: false })
    this.handleZoomOut = () => {
      this.setState(prevState => ({ history: prevState.history.slice(0, Math.max(1, prevState.history.length - 1)) }))
    }
    this.handleReset = () => {
      this.setState(prevState => ({ history: [prevState.history[0]] }))
    }

    this.handleDownload = async () => {
      let myData = {
        allData: this.state.threads,
        history: this.state.history,
        domain: this.state.history[this.state.history.length - 1],
        showSysCalls: this.state.showSysCalls,

        height: this.state.threads.length * (30 + 10),
        width: window.innerWidth - 40,
        margin: {
          top: 10,
          right: 20,
          bottom: 30,
          left: 120
        }
      }

      const fileName = "file";
      const json = JSON.stringify(myData);
      const blob = new Blob([json], { type: 'application/json' });
      const href = await URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = href;
      link.download = fileName + ".json";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }


    this.handleLoad = e => {
      const fileReader = new FileReader();
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = e => {
        let jsonFile = JSON.parse(e.target.result);
        this.setState(
          {
            allData: jsonFile.allData,
            history: jsonFile.history,
            domain: jsonFile.domain,
            margin: jsonFile.margin,
            showSysCalls: jsonFile.showSysCalls,

          });
      }
    }

    this.handleToggleSysCalls = this.handleToggleSysCalls.bind(this)

    this.state = {
      executions: [],
      threads: [],
      scargs: [],
      history: [],
      isLoading: true,
      showSysCalls: false,
      databaseError: false,
    }
  }

  async componentDidMount() {
    const data = await d3.json('/executions/1/threadslices')
      .catch((err) => {
        this.databaseFail()
      })

    const executionsData = await d3.json('/executions')
      .catch((err) => {
        this.databaseFail()
      })

    if (!data || !executionsData) return

    let threadNames = this.renameDuplicates(data.map(data => data["names"].join(" ")))

    for (let i = 0; i < data.length; i++) {
      data[i].newName = threadNames[i]
    }

    const maxTime = Math.max(...data.map(t => Math.max(...t.thread_slices.map(d => d.end_execution_offset))))
    const minTime = Math.min(...data.map(t => Math.min(...t.thread_slices.map(d => d.start_execution_offset))))

    data.sort((a, b) => a.newName.replace(/ *\([^)]*\) */g, '').localeCompare(b.newName.replace(/ *\([^)]*\) */g, '')))
    threadNames.sort((a, b) => a.replace(/ *\([^)]*\) */g, '').localeCompare(b.replace(/ *\([^)]*\) */g, '')))

    this.setState({
      executions: executionsData,
      threads: data,
      history: [{
        yDomain: threadNames,
        xDomain: [minTime, maxTime]
      }],
      isLoading: false
    })
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
      const scargsTbl = await d3.json('/executions/1/scargs')
        .catch((err) => {
          this.databaseFail()
        })
      this.setState({
        threads: this.state.threads
          .map(x => ({
            ...x,
            syscalls: syscall
              .find(y => y.thread_id == x.thread_id).syscalls
              .map(z => ({
                ...z,
                name: z.name.replace('sys_', '')
              }))
          })),
        scargs: new Map(scargsTbl.map(i => [i.syscall_id, i.arguments]))
      })
    }
  }

  render() {
    const domain = this.state.history[this.state.history.length - 1];

    const threadsCopy = jQuery.extend(true, [], this.state.threads);

    let data = threadsCopy.filter(el => domain.yDomain.includes(el.newName))
    data.forEach(el => {
      el.thread_slices = el.thread_slices.filter(ts => ts.start_execution_offset <= domain.xDomain[1] && ts.end_execution_offset >= domain.xDomain[0])
      el.thread_slices = el.thread_slices.map(ts => {
        if (ts.start_execution_offset < domain.xDomain[0]) ts.start_execution_offset = domain.xDomain[0]
        if (ts.end_execution_offset > domain.xDomain[1]) ts.end_execution_offset = domain.xDomain[1]
        return ts
      })
      if (el.syscalls) {
        el.syscalls = el.syscalls.filter(s => s.execution_offset <= domain.xDomain[1] && s.execution_offset >= domain.xDomain[0])
      }
    })

    return (
      <React.Fragment>
        <Header
          executions={this.state.executions}
          showSysCalls={this.state.showSysCalls}
          onToggleSysCalls={this.handleToggleSysCalls}
          resetDatabase={this.resetDatabase}
        />
        <div className="container">
          {!this.state.isLoading &&
            <Sidebar
              yDomain={domain.yDomain}
              all={this.state.threads.map(el => el.newName)}
              updateThreads={this.updateThreads}
            />}
          {!this.state.isLoading &&
            <main className="main">
              <ThreadChart
                databaseError={this.state.databaseError}
                data={data}
                scargs={this.state.scargs}
                allData={this.state.threads}
                domain={domain}
                showSysCalls={this.state.showSysCalls}
                onZoom={this.handleZoom}
                onZoomOut={this.handleZoomOut}
                onReset={this.handleReset}
                onDownload={this.handleDownload}
                onLoad={this.handleLoad}
                height={this.state.threads.length * (30 + 10)}
                width={window.innerWidth - 40}
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
    )
  }
}

ReactDOM.render(<App />, document.querySelector('#root'))