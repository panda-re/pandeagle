/**
 * ToggleSwitch component represents a customized toggle switch.
*/
class ToggleSwitch extends React.Component {
  /**
   * @typedef {Object} ToggleSwitchProps
   * @property {boolean} checked a boolean representing whether the toggle switch is on
   * @property {Function} onChange a even handler which is called when the state of the switch changes
   */

  /**
   * Constructor of ToggleSwitch
   * 
   * @param {ToggleSwitchProps} props 
   * 
   * A customized toggle switch adapted from {@link https://www.w3schools.com/howto/howto_css_switch.asp} 
   * Styles defined in {@link https://github.com/panda-re/pandeagle/blob/master/public/style.css}
   */
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