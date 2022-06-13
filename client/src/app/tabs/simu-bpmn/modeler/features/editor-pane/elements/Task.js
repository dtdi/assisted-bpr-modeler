import React from "react";
import {
  DefaultButton,
  Stack,
  Panel,
  ActionButton,
  Text,
} from "@fluentui/react";
import TimeUnit from "./TimeUnit";
import Distribution from "./Distribution";
import Duration from "./Duration";
import TaskResource from "./TaskResource";
import ElementComponent from "./ElementComponent";
export default class Task extends ElementComponent {
  constructor(props) {
    super(props);
    this.elemStr = "bsim:task";
    this.state = { isPanelOpen: false };
  }

  onRenderFooterContent = () => {
    const { task, onChange, resources } = this.props;
    const moddle = this.context;
    return (
      <div>
        <DefaultButton
          iconProps={{ iconName: "addfriend" }}
          text="Add Resource"
          onClick={() => {
            const newRes = [
              moddle.create("bsim:resource", {
                amount: 1,
                id: resources[0].obj,
              }),
            ];
            onChange(task, "bsim:resources", {
              resource: [
                ...((task.resources && task.resources.resource) || []),
                ...newRes,
              ],
            });
          }}
        />
      </div>
    );
  };

  render() {
    const { task, onChange, resources } = this.props;
    const { isPanelOpen } = this.state;

    return (
      <Stack tokens={{ childrenGap: 15, padding: 15 }}>
        <Text variant={"small"}>{this._getDescr()}</Text>
        <ActionButton
          iconProps={{ iconName: "AddFriend" }}
          onClick={(ev) => {
            const { isPanelOpen } = this.state;
            this.setState({ isPanelOpen: !isPanelOpen });
          }}
          checked={isPanelOpen}
        >
          Manage Resources
        </ActionButton>

        <Panel
          headerText={`Resources ${task.name}`}
          isOpen={isPanelOpen}
          onRenderFooterContent={this.onRenderFooterContent}
          onDismiss={(ev) => {
            const { isPanelOpen } = this.state;
            this.setState({ isPanelOpen: !isPanelOpen });
          }}
          closeButtonAriaLabel="Close"
        >
          <Stack tokens={{ childrenGap: 12 }}>
            <Text variant={"small"}>
              {this._getMetaProp(null, "bsim:resources", "description")}
            </Text>
            {task.resources &&
              task.resources.resource &&
              task.resources.resource.map((resource, key) => (
                <TaskResource
                  key={key}
                  resource={resource}
                  onChange={onChange}
                  onRemove={() => {
                    onChange(task, "bsim:resources", {
                      resource: task.resources.resource.filter((res, idx) => {
                        return idx != key;
                      }),
                    });
                  }}
                  resources={resources}
                />
              ))}
          </Stack>
        </Panel>

        <Duration
          title={this._getName("duration")}
          description={this._getMetaProp(null, "bsim:duration", "description")}
          isOptional={false}
          duration={task.get("duration")}
        >
          <TimeUnit
            value={task.duration && task.duration.timeUnit}
            onChange={(ev, val) => {
              onChange(task, "bsim:duration", { "bsim:timeUnit": val.key });
            }}
          />
          <Distribution
            distribution={task.duration && task.duration.distribution}
            onChange={(distr) => {
              onChange(task, "bsim:duration", { "bsim:distribution": distr });
            }}
          />
        </Duration>

        <Duration
          title={this._getName("setUpDuration")}
          description={this._getMetaProp(
            null,
            "bsim:setUpDuration",
            "description"
          )}
          isOptional={true}
          onRemove={() => {
            onChange(task, task, {
              "bsim:setUpDuration": undefined,
            });
          }}
          duration={task.setUpDuration}
        >
          <TimeUnit
            value={task.setUpDuration && task.setUpDuration.timeUnit}
            disabled={!task.setUpDuration}
            onChange={(_, val) =>
              onChange(task, task.setUpDuration || "bsim:setUpDuration", {
                "bsim:timeUnit": val.key,
              })
            }
          />
          <Distribution
            distribution={task.setUpDuration && task.setUpDuration.distribution}
            onChange={(distr) => {
              if (!distr) {
                onChange(task, task, { "bsim:setUpDuration": undefined });
              }

              onChange(task, "bsim:setUpDuration", {
                "bsim:distribution": distr,
              });
            }}
          />
        </Duration>
      </Stack>
    );
  }
}
