import { Card } from "@uifabric/react-cards";
import { Stack, Text } from "@fluentui/react";
import React from "react";

import TimeUnit from "./TimeUnit";
import Distribution from "./Distribution";
import ElementComponent from "./ElementComponent";

export default class StartEvent extends ElementComponent {
  constructor(props) {
    super(props);

    this.elemStr = "bsim:startEvent";
  }

  render() {
    const { cardTokens, onChange, startEvent } = this.props;

    return (
      <Stack tokens={{ childrenGap: 15, padding: 15 }}>
        <Text variant={"small"}>{this._getDescr()}</Text>
        <Distribution
          distribution={
            startEvent.get("arrivalRate") &&
            startEvent.get("arrivalRate").distribution
          }
          onChange={(distr) => {
            onChange(startEvent, "bsim:arrivalRate", { distribution: distr });
          }}
        />
        <TimeUnit
          value={
            startEvent.get("arrivalRate") &&
            startEvent.get("arrivalRate").timeUnit
          }
          onChange={(evt, val) => {
            onChange(startEvent, "bsim:arrivalRate", { timeUnit: val.key });
          }}
        />
      </Stack>
    );
  }
}
