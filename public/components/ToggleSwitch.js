/**
 * ToggleSwitch component
 * 
 * A customized toggle switch adapted from {@link https://www.w3schools.com/howto/howto_css_switch.asp} 
 * Styles defined in {@link https://github.com/panda-re/pandeagle/blob/master/public/style.css}
 */
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