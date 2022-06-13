import {
  Stack,
  Checkbox,
  Text,
  mergeStyleSets,
  FontWeights,
  FontSizes,
} from "@fluentui/react";
import React, { Component } from "react";

import { ModdleContext } from "./context";
import Help from "./Help";

export default class Duration extends Component {
  constructor(props) {
    super(props);
    let enabled = false;
    if (props.duration || !props.isOptional) {
      enabled = true;
    }

    this.state = { enabled: enabled };
  }
  toggle = () => {
    if (!this.state.enabled) this.props.onRemove();
    this.setState({ enabled: !this.state.enabled });
  };
  render() {
    const styles = mergeStyleSets({
      head: {
        fontWeight: FontWeights.semibold,
        fontSize: FontSizes.mediumPlus,
      },
    });

    return (
      <Stack>
        <Stack tokens={{ childrenGap: 15 }} horizontal wrap verticalAlign="end">
          <Text className={styles.head} wrap>
            {this.props.title}
          </Text>

          {this.props.isOptional && (
            <Checkbox
              checked={this.state.enabled}
              label={"enabled"}
              onChange={this.toggle}
            />
          )}
          {this.props.description && (
            <Help headline={this.props.title} iconName="help">
              {this.props.description}
            </Help>
          )}
        </Stack>

        {this.state.enabled && (
          <Stack tokens={{ childrenGap: 5 }}>{this.props.children}</Stack>
        )}
      </Stack>
    );
  }
}
Duration.contextType = ModdleContext;
