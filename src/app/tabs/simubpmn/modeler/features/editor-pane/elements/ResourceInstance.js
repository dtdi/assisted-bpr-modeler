import { StackItem, Dropdown, ActionButton } from "@fluentui/react";
import React from "react";
import { Card } from "@uifabric/react-cards";
import { FluentField } from "./FluentField";

import ElementComponent from "./ElementComponent";

export default class ResourceInstance extends ElementComponent {
  constructor(props) {
    super(props);
    this.elemStr = "bsim:instance";
  }

  render() {
    const { instance, onChange, onRemove, timetables } = this.props;

    return (
      <Card tokens={{ childrenGap: 10, childrenMargin: 15 }}>
        <Card.Section horizontal verticalAlign={"end"}>
          <FluentField
            value={instance.name}
            label={this._getName("name")}
            onChange={(_, val) => {
              onChange(instance, instance, { name: val });
            }}
          />
          <ActionButton
            color={"red"}
            iconProps={{ iconName: "delete" }}
            onClick={() => onRemove(instance)}
          >
            Delete
          </ActionButton>
        </Card.Section>
        <Card.Section horizontal>
          <StackItem styles={{ root: { width: 75 } }}>
            <FluentField
              value={instance.cost}
              label={this._getName("cost")}
              description={this._getDescr("cost")}
              onChange={(_, val) => {
                onChange(instance, instance, { cost: val });
              }}
            />
          </StackItem>

          <Dropdown
            selectedKey={instance.timetableId?.id}
            options={timetables || []}
            label={this._getName("timetableId")}
            onChange={(_, val) => {
              onChange(instance, instance, { timetableId: val.obj });
            }}
          />
        </Card.Section>
      </Card>
    );
  }
}
