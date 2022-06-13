import { Fabric } from "@fluentui/react";
import React, { Component } from "react";
import ReactDOM from "react-dom";

export default class Messages extends Component {
  render() {
    const { messages, node } = this.props;
    return ReactDOM.createPortal(
      <Fabric>{messages.map((message) => message)}</Fabric>,
      node
    );
  }
}
