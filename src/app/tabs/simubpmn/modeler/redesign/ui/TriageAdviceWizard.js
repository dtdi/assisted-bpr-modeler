import {
  Text,
  Stack,
  StackItem,
  Checkbox,
  Slider,
  DialogFooter,
  PrimaryButton,
  DefaultButton,
  ActionButton,
  Nav,
} from "@fluentui/react";
import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import numeral from "numeral";
import React, { Component } from "react";
import { formatPercent } from "../../../util/BsimUtil";

import { ModdleContext } from "../../features/editor-pane/elements/context";
import ElementComponent from "../../features/editor-pane/elements/ElementComponent";
import { FluentField } from "../../features/editor-pane/elements/FluentField";
import Task from "../../features/editor-pane/elements/Task";

export class Footer extends ElementComponent {
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

export default class TriageAdviceWizard extends ElementComponent {
  elemStr = "bpmn:Task";
  constructor(props) {
    super(props);
    this.state = {
      selectedKey: 0,
      selected: props.context.elements[0],
    };
  }

  niceName = (bO) => {
    const elem = getBusinessObject(bO);

    const name = elem.name;
    const incoming = elem.incoming[0]?.bsim;
    if (incoming) {
      return `${name} (${formatPercent(incoming.branchingProbability.value)})`;
    } else {
      return name;
    }
  };

  setSelected = (item) => {
    this.setState({ selectedKey: item.key, selected: item.obj });
  };

  render() {
    const {
      isOpen,
      resources,
      context,
      onAction,
      onChange,
      modeling: m,
    } = this.props;
    const { selected, selectedKey } = this.state;
    const { elements, element } = context;

    const elementBO = getBusinessObject(element);

    const bO = getBusinessObject(selected);
    const incoming = bO.incoming[0];

    if (!isOpen) return null;

    return (
      <Stack>
        <StackItem>
          <FluentField
            label="Split criteria"
            description="SPLIT_CRIT_DESCRIPTION"
            value={m.getProp(elementBO, "triageSplitCriteria")}
            onChange={(val) => {
              m.setProp(elementBO, "triageSplitCriteria", val);
            }}
          />
        </StackItem>
        <Stack horizontal>
          <StackItem styles={{ root: { width: 200 } }}>
            <ActionButton
              iconProps={{ iconName: "add" }}
              onClick={() => {
                onAction("next");
              }}
            >
              Alternative
            </ActionButton>
            <Nav
              onLinkClick={(ev, item) => {
                this.setSelected(item);
              }}
              selectedKey={selectedKey}
              groups={[
                {
                  name: "Alternatives",
                  links: elements?.map((activity, k) => {
                    return {
                      name: this.niceName(activity),
                      key: k,
                      obj: activity,
                    };
                  }),
                },
              ]}
            />
          </StackItem>
          <StackItem>
            {bO && (
              <Stack tokens={{ childrenGap: 12, padding: 15 }}>
                <FluentField
                  label={"Activity Name"}
                  value={bO.name}
                  onChange={(value) => {
                    m.updateLabel(bO, value);
                  }}
                />
              </Stack>
            )}
            {incoming && (
              <Stack horizontal tokens={{ childrenGap: 12, padding: 15 }}>
                <FluentField
                  label={"Flow condition"}
                  value={incoming.name}
                  onChange={(value) => {
                    m.updateLabel(incoming, value);
                  }}
                />
                <StackItem grow>
                  <Stack horizontal verticalAlign={"end"}>
                    <StackItem grow={3}>
                      <Slider
                        value={incoming.bsim.get("branchingProbability")?.value}
                        max={1}
                        label={`${this._getName(
                          null,
                          "bsim:branchingProbability"
                        )} ${incoming.bsim.id.id}`}
                        step={0.1}
                        showValue={false}
                        onChanged={(_, value) => {
                          onChange(incoming.bsim, "bsim:branchingProbability", {
                            value,
                          });
                        }}
                      />
                    </StackItem>
                    <StackItem grow styles={{ root: { width: 75 } }}>
                      <FluentField
                        value={incoming.bsim.get("branchingProbability")?.value}
                        description={this._getDescr(
                          "value",
                          "bsim:branchingProbability"
                        )}
                        onChange={(_, value) => {
                          onChange(incoming.bsim, "bsim:branchingProbability", {
                            value,
                          });
                        }}
                      />
                    </StackItem>
                  </Stack>
                </StackItem>
              </Stack>
            )}

            {bO && (
              <Task
                key={selectedKey}
                task={bO.bsim}
                onChange={onChange}
                resources={resources}
              />
            )}
          </StackItem>
        </Stack>
      </Stack>
    );
  }
}
TriageAdviceWizard.contextType = ModdleContext;
