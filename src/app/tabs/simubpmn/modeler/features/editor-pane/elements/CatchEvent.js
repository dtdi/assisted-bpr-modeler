import React from "react";
import { Text, Stack } from "@fluentui/react";
import TimeUnit from "./TimeUnit";
import Distribution from "./Distribution";
import ElementComponent from "./ElementComponent";
export default class CatchEvent extends ElementComponent {
  constructor(props) {
    super(props);
    this.elemStr = "bsim:catchEvent";
  }

  render() {
    const { onChange, event } = this.props;

    return (
      <Stack tokens={{ childrenGap: 15, padding: 15 }}>
        <Text variant={"small"}>{this._getDescr()}</Text>
        <Distribution
          distribution={event.arrivalRate.distribution}
          onChange={(distr) => {
            onChange(event, "bsim:arrivalRate", { distribution: distr });
          }}
        />
        <TimeUnit
          value={event.arrivalRate.timeUnit}
          onChange={(ev, val) => {
            onChange(event, "bsim:arrivalRate", { timeUnit: val.key });
          }}
        />
      </Stack>
    );
  }
}
