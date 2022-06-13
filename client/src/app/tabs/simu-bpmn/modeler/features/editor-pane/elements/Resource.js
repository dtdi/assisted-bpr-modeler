import {
  Stack,
  StackItem,
  Dropdown,
  Panel,
  DefaultButton,
  Text,
} from "@fluentui/react";
import React from "react";
import TimeUnit from "./TimeUnit";
import ResourceInstance from "./ResourceInstance";
import ElementComponent from "./ElementComponent";
import { FluentField } from "./FluentField";

export default class Resource extends ElementComponent {
  constructor(props) {
    super(props);
    this.elemStr = "bsim:dynamicResource";
    this.state = { isPanelOpen: false };
  }

  onRenderFooterContent = () => {
    const { resource, onChange, modeling } = this.props;
    return (
      <div>
        <DefaultButton
          iconProps={{ iconName: "addfriend" }}
          text="Add Instance"
          onClick={() => {
            const newRes = modeling._createBsim("bsim:instance", {
              cost: 0,
              timetableId: resource.defaultTimetableId,
            });
            onChange(resource, resource, {
              instances: [...(resource.instances || []), ...[newRes]],
            });
          }}
        />
      </div>
    );
  };

  render() {
    const { resource, onChange, timetables, onRemove } = this.props;
    const { instances } = resource;
    const { isPanelOpen } = this.state;

    return (
      <Stack
        horizontal
        verticalAlign="baseline"
        wrap
        tokens={{ childrenGap: 12 }}
      >
        <StackItem grow>
          <FluentField
            value={resource.id}
            onChange={(_, val) => onChange(resource, resource, { id: val })}
            label={this._getName("id")}
          />
        </StackItem>
        <StackItem grow>
          <FluentField
            value={resource.name}
            label={this._getName("name")}
            description={this._getDescr("name")}
            onChange={(val) => onChange(resource, resource, { name: val })}
          />
        </StackItem>

        <StackItem styles={{ root: { width: 125 } }}>
          <FluentField
            value={resource.defaultQuantity}
            label={this._getName("defaultQuantity")}
            description={this._getDescr("defaultQuantity")}
            onChange={(val) =>
              onChange(resource, resource, { defaultQuantity: val })
            }
          />
        </StackItem>

        <TimeUnit
          value={resource.defaultTimeUnit}
          label={this._getName("defaultTimeUnit")}
          description={this._getDescr("defaultTimeUnit")}
          onChange={(_, val) => {
            onChange(resource, resource, { defaultTimeUnit: val.key });
          }}
        />
        <StackItem styles={{ root: { width: 100 } }}>
          <FluentField
            value={resource.defaultCost}
            onChange={(_, val) =>
              onChange(resource, resource, { defaultCost: val })
            }
            label={this._getName("defaultCost")}
            description={this._getDescr("defaultCost")}
          />
        </StackItem>
        <Dropdown
          selectedKey={resource.defaultTimetableId.id}
          options={timetables || []}
          label={this._getName("defaultTimetableId")}
          description={this._getDescr("defaultCost")}
          onChange={(_, val) => {
            onChange(resource, resource, { defaultTimetableId: val.obj });
          }}
        />
        <DefaultButton
          iconProps={{ iconName: "AddFriend" }}
          split
          menuProps={{
            items: [
              {
                key: "removeResource",
                text: "Delete",
                iconProps: { iconName: "delete" },
                onClick: () => onRemove(),
              },
            ],
          }}
          onClick={(ev) => {
            const { isPanelOpen } = this.state;
            this.setState({ isPanelOpen: !isPanelOpen });
          }}
          checked={isPanelOpen}
        >
          Named Instances
        </DefaultButton>

        <Panel
          headerText={`Named Instances of ${resource.name || resource.id}`}
          isOpen={isPanelOpen}
          onRenderFooterContent={this.onRenderFooterContent}
          onDismiss={(ev) => {
            const { isPanelOpen } = this.state;
            this.setState({ isPanelOpen: !isPanelOpen });
          }}
          closeButtonAriaLabel="Close"
        >
          <Stack tokens={{ childrenGap: 12 }}>
            <Text>{this._getDescr(null, "bsim:instance")}</Text>
            {instances?.map((instance, key) => (
              <ResourceInstance
                key={key}
                instance={instance}
                onChange={onChange}
                onRemove={(instance) => {
                  onChange(resource, resource, {
                    instances: resource.instances.filter(
                      (elem) => elem !== instance
                    ),
                  });
                }}
                timetables={timetables}
              />
            ))}
          </Stack>
        </Panel>
      </Stack>
    );
  }
}
