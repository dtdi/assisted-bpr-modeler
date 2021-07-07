import { StackItem, Dropdown, IconButton, Text } from "@fluentui/react";
import React from "react";
import { Card } from "@uifabric/react-cards";
import ElementComponent from "./ElementComponent";
import { FluentField } from "./FluentField";

export default class TaskResource extends ElementComponent {
  constructor(props) {
    super(props);
    this.elemStr = "bsim:resources";
  }

  render() {
    const { resource, onChange, onRemove, resources } = this.props;

    return (
      <Card tokens={{ childrenGap: 10, childrenMargin: 15 }}>
        <Card.Section horizontal verticalAlign={"end"}>
          <Dropdown
            selectedKey={resource.id?.id}
            options={resources || []}
            label={this._getName("resource")}
            onChange={(_, val) => {
              onChange(resource, resource, { id: val.obj });
            }}
          />
          <StackItem styles={{ root: { width: 75 } }}>
            <FluentField
              value={resource.amount}
              label={this._getName("amount")}
              onChange={(_, val) => {
                onChange(resource, resource, { amount: val });
              }}
            />
          </StackItem>
          <IconButton
            color={"red"}
            iconProps={{ iconName: "delete" }}
            onClick={() => onRemove(resource)}
          />
        </Card.Section>
      </Card>
    );
  }
}
