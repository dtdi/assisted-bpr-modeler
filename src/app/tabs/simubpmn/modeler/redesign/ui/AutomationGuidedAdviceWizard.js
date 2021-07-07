import {
  Text,
  Stack,
  StackItem,
  FontWeights,
  DialogFooter,
  PrimaryButton,
  DefaultButton,
  ChoiceGroup,
} from "@fluentui/react";
import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import React, { Component } from "react";
import {
  Duration,
  Resources,
} from "../../features/bsim-moddle-extension/elements/Partials";
import { ModdleContext } from "../../features/editor-pane/elements/context";
import { FluentField } from "../../features/editor-pane/elements/FluentField";

export class Footer extends Component {
  render() {
    const { onAction, context } = this.props;
    return (
      <DialogFooter>
        <DefaultButton
          onClick={() => {
            onAction("wizard-toggle");
          }}
          text="Exit"
        />
        <PrimaryButton
          onClick={() => {
            onAction("commit-finalize", context);
          }}
          text="Commit and finalize selection"
        />
      </DialogFooter>
    );
  }
}

export default class AutomationGuidedAdviceWizard extends Component {
  constructor(props) {
    super(props);
  }

  getValue(element) {
    const { modeling: m } = this.props;
    const prop = m.getProp(element, "may-DU-25");
    if (prop === true) {
      return "Yes";
    } else if (prop === false) return "No";
    else return "None";
  }

  render() {
    const { isOpen, modeling: m, context } = this.props;
    const { elements } = context;

    const options = [
      {
        key: "None",
        text: "None",
        value: undefined,
        iconProps: { iconName: "Checkbox" },
      },
      {
        key: "Yes",
        text: "Yes",
        value: true,
        iconProps: { iconName: "CheckboxComposite" },
      },
      {
        key: "No",
        text: "No",
        value: false,
        iconProps: { iconName: "ErrorBadge" },
      },
    ];

    if (!isOpen) return null;

    return (
      <Stack tokens={{ childrenGap: 10 }}>
        <Text wrap>
          This heuristic suggests to automate tasks. The positive result of
          automating tasks in particular may be that tasks can be executed
          faster, with less cost, and with a better result. An obvious
          disadvantage is that the development of a system that performs a task
          may be costly. Generally speaking, a system performing a task is also
          less flexible in handling variations than a human resource. Instead of
          fully automating a task, an automated support of the resource
          executing the task may also be considered.
        </Text>
        <Text wrap>
          In the first step, please help to identify those activities, that
          might allow for automation and optionally provide a hint:
        </Text>
        <Stack tokens={{ childrenGap: 20, padding: 10 }}>
          {elements &&
            elements.map(getBusinessObject).map((element, idx) => (
              <Stack
                tokens={{ childrenGap: 20 }}
                key={idx}
                horizontal
                verticalAlign="start"
              >
                <StackItem>
                  <Stack style={{ width: 280 }} tokens={{ childrenGap: 10 }}>
                    <Text
                      styles={{ root: { fontWeight: FontWeights.semibold } }}
                    >
                      {element.name}
                    </Text>
                    <Duration isDuration item={element.bsim?.get("duration")} />
                    <Resources
                      item={element.bsim?.resources}
                      lane={element.bsim.get("bpmnElement").get("lanes")}
                    />
                  </Stack>
                </StackItem>
                <StackItem style={{ width: 300 }}>
                  <ChoiceGroup
                    selectedKey={this.getValue(element)}
                    onChange={(_, option) => {
                      m.setProp(element, "may-DU-25", option.value);
                    }}
                    options={options}
                  />

                  <FluentField
                    label="Automation Hint"
                    disabled={!m.getProp(element, "may-DU-25")}
                    value={m.getProp(element, "automationHint")}
                    onChange={(val) => {
                      m.setProp(element, "automationHint", val);
                    }}
                  />
                </StackItem>
              </Stack>
            ))}
        </Stack>
      </Stack>
    );
  }
}
AutomationGuidedAdviceWizard.contextType = ModdleContext;
