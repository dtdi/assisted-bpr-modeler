import React, { Component } from "react";
import { Text, IconButton, TeachingBubble, Image } from "@fluentui/react";
import newid from "./newid";

export class WikiHelp extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidUpdate(oldProps, oldState) {
    const self = this;
    if (oldProps.url != this.props.url)
      if (this.props.url == null || this.props.url == "")
        self.setState({
          img: undefined,
          url: undefined,
          text: undefined,
          title: undefined,
          width: undefined,
          height: undefined,
        });
      else
        fetch(this.props.url)
          .then((res) => res.json())
          .then((res) => {
            const newState = {
              img: res.thumbnail && res.thumbnail.source,
              url: res.content_urls.desktop.page,
              text: res.extract,
              title: res.title,
              width: res.thumbnail && res.thumbnail.width,
              height: res.thumbnail && res.thumbnail.height,
            };
            self.setState(newState);
          });
  }

  render() {
    if (!this.state.title) return null;
    return (
      <Help
        primaryButtonProps={{
          href: this.state.url,
          text: "Wiki",
          target: "_blank",
        }}
        illustrationImage={{
          src: this.state.img,
          width: this.state.width,
          height: this.state.height,
        }}
        headline={this.state.title}
      >
        {this.state.text}
      </Help>
    );
  }
}

export default class Help extends Component {
  constructor(props) {
    super(props);
    this.id = newid("helper");
    this.state = { isVisible: false };
  }

  onToggle = () => {
    this.setState({ isVisible: !this.state.isVisible });
  };

  render() {
    const { isVisible } = this.state;
    return (
      <>
        <IconButton
          iconProps={{ iconName: this.props.iconName || "help" }}
          styles={{ root: { width: 12, height: 12 } }}
          title="Help"
          onClick={this.onToggle}
          id={this.id}
          checked={isVisible}
        />
        {isVisible && (
          <TeachingBubble
            hasCondensedHeadline={true}
            {...this.props}
            target={`#${this.id}`}
            onDismiss={this.onToggle}
          >
            {this.props.children}
          </TeachingBubble>
        )}
      </>
    );
  }
}
