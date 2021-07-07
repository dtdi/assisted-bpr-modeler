import React from "react";
import { Text, Stack } from "@fluentui/react";
import TimeUnit from "./TimeUnit";
import Distribution from "./Distribution";
import ElementComponent from "./ElementComponent";
import { FluentField } from "./FluentField";
export default class BoundaryEvent extends ElementComponent {
  constructor(props) {
    super(props);
    this.elemStr = "bsim:boundaryEvent";
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
        <FluentField
          value={event.eventProbability}
          label={this._getName("eventProbability")}
          description={this._getDescr("eventProbability", "bsim:boundaryEvent")}
          onChange={(val) => {
            onChange(event, event, { eventProbability: val });
          }}
        />
      </Stack>
    );
  }
}
