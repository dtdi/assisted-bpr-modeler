import {
  Text,
  Stack,
  StackItem,
  FontWeights,
  Checkbox,
  TextField,
  DialogFooter,
  PrimaryButton,
  DefaultButton,
  ChoiceGroup,
} from "@fluentui/react";
import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import { Field } from "formik";
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

export default class TriageGuidedAdviceWizard extends Component {
  constructor(props) {
    super(props);
  }

  getValue(element) {
    const { modeling: m } = this.props;
    const prop = m.getProp(element, "is-DU-07");
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
          This heuristic suggests aligning the characteristics of cases with
          capabilities of resources to increase quality. An alternative is to
          subdivide activities into sub-categories. For example, a special cash
          desk may be set up for customers with an expected low processing time.
        </Text>
        <Text wrap>
          In the first step, please help to identify those activities, that
          might allow for applying triage and specify the split criteria:
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
                    <Duration
                      isDuration
                      item={element.bsim && element.bsim.get("duration")}
                    />
                    <Resources
                      item={element.bsim && element.bsim.resources}
                      lane={element.bsim.get("bpmnElement").get("lanes")}
                    />
                  </Stack>
                </StackItem>
                <StackItem style={{ width: 300 }}>
                  <ChoiceGroup
                    selectedKey={this.getValue(element)}
                    onChange={(_, option) => {
                      m.setProp(element, "is-DU-07", option.value);
                    }}
                    options={options}
                  />

                  <FluentField
                    label="Provide Split criteria"
                    disabled={!m.getProp(element, "is-DU-07")}
                    value={m.getProp(element, "triageSplitCriteria")}
                    onChange={(val) => {
                      m.setProp(element, "triageSplitCriteria", val);
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
TriageGuidedAdviceWizard.contextType = ModdleContext;
