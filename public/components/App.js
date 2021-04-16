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
    this.toggleSc = (syscall) => {
      const newScColor = new Map(this.state.scColor)
      const scProp = this.state.scColor.get(syscall)
      scProp.checked = !scProp.checked
      newScColor.set(scProp)
      this.setState({ scColor: newScColor })
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
      scColor: [],
      history: [],
      syscallRetrived: false,
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
      data[i].syscalls = []
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
    if (!this.state.syscallRetrived) {
      const syscall = await d3.json('/executions/1/syscalls/')
        .catch((err) => {
          this.databaseFail()
        })
      const scargsTbl = await d3.json('/executions/1/scargs')
        .catch((err) => {
          this.databaseFail()
        })

      const threadsWithSc = this.state.threads
        .map(x => ({
          ...x,
          syscalls: syscall
            .find(y => y.thread_id == x.thread_id).syscalls
            .map(z => ({
              ...z,
              name: z.name.replace('sys_', '')
            }))
        }))

      const allScName = [...new Set(threadsWithSc.map(el => el.syscalls).flat().map(el => el.name))]
      const numOfScName = allScName.length
      const scColor = new Map();

      for (let i = 0; i < numOfScName; i++) {
        scColor.set(allScName[i], {
          color: this.HSLToRGB(360 / numOfScName * i, 100 - (i % 3) * 30, 50),
          checked: true
        })
      }

      this.setState({
        threads: threadsWithSc,
        scargs: new Map(scargsTbl.map(i => [i.syscall_id, i.arguments])),
        scColor: scColor,
        syscallRetrived: true
      })
    }
  }

  HSLToRGB(h, s, l) {
    s = s / 100
    l = l / 100
    let c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2, r = 0, g = 0, b = 0

    if (0 <= h && h < 60) {
      r = c; g = x; b = 0;  
    } else if (60 <= h && h < 120) {
      r = x; g = c; b = 0;
    } else if (120 <= h && h < 180) {
      r = 0; g = c; b = x;
    } else if (180 <= h && h < 240) {
      r = 0; g = x; b = c;
    } else if (240 <= h && h < 300) {
      r = x; g = 0; b = c;
    } else if (300 <= h && h < 360) {
      r = c; g = 0; b = x;
    }
    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);
  
    r = r.toString(16);
    g = g.toString(16);
    b = b.toString(16);

    if (r.length == 1)
      r = "0" + r;
    if (g.length == 1)
      g = "0" + g;
    if (b.length == 1)
      b = "0" + b;

    return "#" + r + g + b;
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
              displayedThreads={domain.yDomain}
              allThreads={this.state.threads.map(el => el.newName)}
              displayedSyscalls={[...new Set(data.map(el => el.syscalls).flat().map(el => el.name))]}
              scColor={this.state.scColor}
              toggleSc={this.toggleSc}
              updateThreads={this.updateThreads}
            />}
          {!this.state.isLoading &&
            <main className="main">
              <ThreadChart
                databaseError={this.state.databaseError}
                allData={this.state.threads}
                data={data}
                domain={domain}
                scColor={this.state.scColor}
                scargs={this.state.scargs}
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