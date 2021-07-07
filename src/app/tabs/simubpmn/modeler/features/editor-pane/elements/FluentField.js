import { TextField } from "office-ui-fabric-react";
import React, { Component } from "react";

export class FluentField extends Component {
  constructor(props) {
    super(props);
    this.timeout = this.props.timeout || 300;
    const componentRef = React.createRef();
    this.state = {
      currentValue: props.value || "",
      isDirty: false,
      ref: componentRef,
    };
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.value !== prevProps.value) {
      this.setState({ currentValue: this.props.value || "" });
    }
  }

  timer;

  timeout;

  lastNow;

  chx = () => {
    const { currentValue, isDirty } = this.state;
    if (isDirty) {
      this.props.onChange(currentValue, currentValue);
    }
    this.setState({ isDirty: false });
  };

  fire = () => {
    var now = Date.now();

    var scheduledDiff = this.lastNow + this.timeout - now;

    if (scheduledDiff > 0) {
      return this.schedule(scheduledDiff);
    }

    this.chx();

    this.timer = this.lastNow = undefined;
  };

  schedule = (timeout) => {
    this.timer = setTimeout(this.fire, timeout);
  };

  onChange = (event, valueOrItem) => {
    const { changeInstant } = this.props;
    const { ref, currentValue } = this.state;
    let isDebounce = false;
    if (!changeInstant && ref.current?.constructor?.name === "TextFieldBase") {
      isDebounce = true;
    }

    this.lastNow = Date.now();

    this.setState({
      currentValue: valueOrItem,
      isDirty: true,
    });

    if (!isDebounce) {
      this.chx();
    }

    if (!this.timer && isDebounce) {
      this.schedule(this.timeout);
    }
  };

  onBlur = (event) => {
    const { changeInstant } = this.props;
    if (changeInstant !== undefined || changeInstant == "true") this.chx();
  };

  render() {
    const { type, children, label, as: is } = this.props;
    const { ref, currentValue } = this.state;

    if (children) {
      return children({
        value: this.state.currentValue,
        fieldChange: this.onChange,
        fieldBlur: this.onBlur,
        ref: this.state.ref,
      });
    }

    // default to input here so we can check for both `as` and `children` above
    const asElement = is || TextField;

    return React.createElement(
      asElement,
      {
        ...this.props,
        componentRef: ref,
        value: currentValue,
        label: label,
        onChange: this.onChange,
        onBlur: this.onBlur,
      },
      children
    );
  }
}
