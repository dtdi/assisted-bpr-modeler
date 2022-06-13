import { Stack, Text, Slider, StackItem } from "@fluentui/react";
import React from "react";
import { formatPercent } from "../../../../util/BsimUtil";

import ElementComponent from "./ElementComponent";
import { FluentField } from "./FluentField";

export default class Gateway extends ElementComponent {
  constructor(props) {
    super(props);
    this.elemStr = "bsim:exclusiveGateway";
  }

  render() {
    const { onChange, gateway } = this.props;

    return (
      <Stack tokens={{ childrenGap: 15, padding: 15 }}>
        <Text variant={"small"}>{this._getDescr()}</Text>
        {gateway.outgoing.map((flow, key) => (
          <Stack horizontal key={key} verticalAlign={"end"}>
            <StackItem grow={3}>
              <Slider
                value={
                  flow.get("branchingProbability") &&
                  flow.get("branchingProbability").value
                }
                max={1}
                label={`${this._getName(null, "bsim:branchingProbability")} ${
                  flow.id.id
                }`}
                step={0.1}
                showValue={false}
                onChanged={(_, value) => {
                  onChange(flow, "bsim:branchingProbability", {
                    value,
                  });
                }}
              />
            </StackItem>
            <StackItem grow styles={{ root: { width: 75 } }}>
              <FluentField
                value={
                  flow.get("branchingProbability") &&
                  flow.get("branchingProbability").value
                }
                description={this._getDescr(
                  "value",
                  "bsim:branchingProbability"
                )}
                onChange={(_, value) => {
                  onChange(flow, "bsim:branchingProbability", {
                    value,
                  });
                }}
              />
            </StackItem>
          </Stack>
        ))}
      </Stack>
    );
  }
}
