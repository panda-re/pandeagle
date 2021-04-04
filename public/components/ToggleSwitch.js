// Adapted from https://www.w3schools.com/howto/howto_css_switch.asp
class ToggleSwitch extends React.Component {
  constructor(props) {
    super(props)
  }

  render() {
    return (
      <label className="switch">
        <input type="checkbox" checked={this.props.checked} onChange={this.props.onChange} />
        <span className="slider round"></span>
      </label>
    )
  }
}