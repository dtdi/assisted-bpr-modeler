import React from "react";
import { Card } from "@uifabric/react-cards";
import {
  Stack,
  StackItem,
  Dropdown,
  ActionButton,
  DefaultButton,
  Panel,
  Text,
  IconButton,
} from "@fluentui/react";
import ElementComponent from "./ElementComponent";
import { FluentField } from "./FluentField";
import { WikiHelp } from "./Help";

export default class Distribution extends ElementComponent {
  constructor(props) {
    super(props);
    this.state = { properties: [], isPanelOpen: false };
  }

  inflateDistr(distribution) {
    const moddle = this.context;
    const distributionType = moddle.getType(distribution.$type);
    const distributionDescriptor =
      moddle.getElementDescriptor(distributionType);

    const { properties: oldProps } = this.state;

    const properties = [];
    distributionDescriptor.properties
      .filter((prop) => {
        return !oldProps.some((prop2) => prop.name === prop2.name);
      })
      .forEach((prop) => {
        if (prop.name === "entry") {
          properties.push(
            ...distribution.get("entry").map((entry) => {
              return {
                name: "entry",
                value: entry.value,
                frequency: entry.frequency,
              };
            })
          );
        } else {
          const _type = moddle.getTypeDescriptor(prop.type);
          properties.push({
            name: prop.name,
            display:
              (_type && _type.meta && _type.meta.displayName) ||
              this.name(prop.name),
            description: _type && _type.meta.description,
            value:
              distribution.get(prop.name) && distribution.get(prop.name).value,
          });
        }
      });

    properties.push(...oldProps);

    this.setState({
      distributionType,
      distributionDescriptor,
      properties,
    });
  }

  triggerChange(newState) {
    if (!newState) newState = this.state;
    const moddle = this.context;
    const distribution = moddle.create(newState.distributionDescriptor.name);

    let isComplete = true;
    if (distribution.$type === "bsim:arbitraryFiniteProbabilityDistribution") {
      const objs = newState.properties
        .filter((e) => e.name === "entry")
        .map((entry) =>
          moddle.create("bsim:entry", {
            value: entry.value,
            frequency: entry.frequency,
          })
        );

      distribution.set("bsim:entry", objs);
    } else {
      // ensure distribution children.
      newState.distributionDescriptor.properties.forEach((prop) => {
        const value = newState.properties.find(
          (e) => e.name === prop.name
        ).value;
        if (!value) {
          isComplete = false;
        }
        const propObj = moddle.create(prop.type, { value: value });
        distribution.set(prop.name, propObj);
      });
    }

    if (isComplete) this.props.onChange(distribution);
  }

  componentDidUpdate(newProps, newState) {
    if (newState && !newState.disabled && this.state.disabled) {
      //this.triggerChange(newState);
    }
  }

  componentDidMount() {
    const { distribution } = this.props;
    const moddle = this.context;
    const distributions = moddle
      .getPackage("bsim")
      .types.filter(
        (e) => e.superClass && e.superClass.includes("Distribution")
      )
      .map((e) => {
        return {
          ...e,
          key: e.name,
          text: (e.meta && e.meta.displayName) || this.name(e.name),
          data: { icon: e.name },
        };
      });

    let activeDist;
    if (distribution) {
      activeDist = distribution;
    } else {
      activeDist = moddle.create(`bsim:${distributions[0].key}`);
    }

    this.setState({
      distributions,
    });

    this.inflateDistr(activeDist);
  }

  onDistrChange = (_, val) => {
    const moddle = this.context;
    this.inflateDistr(moddle.create(`bsim:${val.key}`));
    this.triggerChange();
  };

  onChange = (val, e) => {
    const state = this.state;
    const { properties } = state;

    e.value = val;
    this.setState({ properties });
    this.triggerChange({ ...state, ...properties });
  };

  onRemoveEntry = (e) => {
    const state = this.state;
    const { properties } = state;

    const newProps = properties.filter((p) => p !== e);

    this.setState({ properties: newProps });
    this.triggerChange({ ...state, ...newProps });
  };

  onChangeEntry = (val, e, field) => {
    const state = this.state;
    const { properties } = state;
    if (val === null && e) {
      properties.push(e);
    } else {
      e[field] = val;
    }
    this.setState({ properties });
    this.triggerChange({ ...state, ...properties });
  };

  name = (property) => {
    return (
      property // insert a space before all caps
        .replace(/([A-Z])/g, " $1")
        // uppercase the first character
        .replace(/^./, function (str) {
          return str.toUpperCase();
        })
    );
  };

  onRenderFooterContent = () => {
    const moddle = this.context;

    return (
      <div>
        <DefaultButton
          iconProps={{ iconName: "add" }}
          text="Add Entry"
          onClick={() => {
            const entry = {
              name: "entry",
              value: 0,
              frequency: 1,
            };
            this.onChangeEntry(null, entry);
          }}
        />
      </div>
    );
  };

  render() {
    const { distributions, properties, distributionDescriptor, isPanelOpen } =
      this.state;

    return (
      <Stack tokens={{ childrenGap: 5 }} verticalAlign="end">
        <Text variant="xSmall">
          {this._getDescr(null, "bsim:Distribution")}
        </Text>
        <Dropdown
          label={"Distribution"}
          options={distributions}
          selectedKey={
            distributionDescriptor && distributionDescriptor.ns.localName
          }
          onChange={this.onDistrChange}
        />
        <Text variant="xSmall">
          {this._getDescr(
            null,
            distributionDescriptor && distributionDescriptor.name
          )}
          <WikiHelp
            url={this._getMetaProp(
              null,
              distributionDescriptor && distributionDescriptor.name,
              "hint_url"
            )}
          ></WikiHelp>
        </Text>

        {properties &&
          distributionDescriptor &&
          distributionDescriptor.name ===
            "bsim:arbitraryFiniteProbabilityDistribution" && (
            <>
              <ActionButton
                iconProps={{ iconName: "BulletedList" }}
                onClick={(ev) => {
                  this.setState({ isPanelOpen: !isPanelOpen });
                }}
                checked={isPanelOpen}
              >
                Manage Entries
              </ActionButton>

              <Panel
                headerText={"Entries"}
                isOpen={isPanelOpen}
                onRenderFooterContent={this.onRenderFooterContent}
                onDismiss={(ev) => {
                  this.setState({ isPanelOpen: !isPanelOpen });
                }}
                closeButtonAriaLabel="Close"
              >
                <Stack tokens={{ childrenGap: 12 }}>
                  <Text variant={"small"}>
                    {this._getMetaProp(
                      null,
                      "bsim:arbitraryFiniteProbabilityDistribution",
                      "description"
                    )}
                  </Text>
                  {properties
                    .filter((e) => e.name === "entry")
                    .map((entry, key) => (
                      <Card
                        key={key}
                        tokens={{ childrenGap: 10, childrenMargin: 15 }}
                      >
                        <Card.Section horizontal verticalAlign={"start"}>
                          <FluentField
                            value={entry.value}
                            label={this.name("value")}
                            description={this._getMetaProp(
                              "value",
                              "bsim:entry",
                              "description"
                            )}
                            onChange={(val) =>
                              this.onChangeEntry(val, entry, "value")
                            }
                          />

                          <FluentField
                            value={entry.frequency}
                            label={this.name("frequency")}
                            description={this._getMetaProp(
                              "frequency",
                              "bsim:entry",
                              "description"
                            )}
                            onChange={(val) =>
                              this.onChangeEntry(val, entry, "frequency")
                            }
                          />

                          <IconButton
                            iconProps={{ iconName: "delete", color: "red" }}
                            ariaDescription={"Delete"}
                            onClick={() => this.onRemoveEntry(entry)}
                          ></IconButton>
                        </Card.Section>
                      </Card>
                    ))}
                </Stack>
              </Panel>
            </>
          )}

        <Stack horizontal wrap verticalAlign="end" tokens={{ childrenGap: 10 }}>
          {properties &&
            distributionDescriptor &&
            distributionDescriptor.name !==
              "bsim:arbitraryFiniteProbabilityDistribution" &&
            distributionDescriptor.properties.map((f) => {
              const e = properties.find((e) => e.name === f.name);
              return (
                <StackItem key={e.name} styles={{ root: { width: 120 } }}>
                  <FluentField
                    label={e.display}
                    description={e.description}
                    value={e.value}
                    onChange={(val) => this.onChange(val, e)}
                  />
                </StackItem>
              );
            })}
        </Stack>
      </Stack>
    );
  }
}
