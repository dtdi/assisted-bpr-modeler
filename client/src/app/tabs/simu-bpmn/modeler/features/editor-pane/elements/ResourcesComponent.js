import {
  StackItem,
  ActionButton,
  Stack,
  getTheme,
  Nav,
  FontSizes,
  FontWeights,
  Text,
} from "@fluentui/react";
import React from "react";
import ElementComponent from "./ElementComponent";
import Resource from "./Resource";

const theme = getTheme();

export default class ResourcesComponent extends ElementComponent {
  constructor(props) {
    super(props);
    this.elemStr = "bsim:dynamicResource";
    this.state = {
      selectedKey: 0,
      selected: undefined,
      currentSchedule: [],
      updateRev: 0,
    };
    this.myRef = React.createRef();
  }

  componentDidMount() {
    const res = this.props.resourceData.get(this.elemStr);
    if (res && res.length != 0) {
      this.selectResource(res[0], 0);
    }
  }

  selectResource(resource, key) {
    this.setState({
      selected: resource,
      selectedKey: key,
    });
  }

  render() {
    const { onChange, resourceData, timetables, modeling } = this.props;
    const { selected, selectedKey } = this.state;
    return (
      <Stack tokens={{ childrenGap: 10 }}>
        <StackItem>
          <Text
            styles={{
              root: {
                fontSize: FontSizes.small,
                fontWeight: FontWeights.semilight,
              },
            }}
          >
            {this._getDescr("resourceData", "bsim:definitions")}
          </Text>
        </StackItem>
        <Stack horizontal>
          <StackItem styles={{ root: { width: 200 } }}>
            <ActionButton
              iconProps={{ iconName: "add" }}
              onClick={() => {
                const newRes = modeling._createBsim(this.elemStr, {
                  defaultQuantity: 1,
                  defaultCost: 0,
                  defaultTimeUnit: "HOURS",
                  defaultTimetableId: "DEFAULT",
                });
                onChange(resourceData, resourceData, {
                  dynamicResource: [
                    ...resourceData.get(this.elemStr),
                    ...[newRes],
                  ],
                });
                this.selectResource(
                  newRes,
                  resourceData.dynamicResource.length - 1
                );
              }}
            >
              Resource Type
            </ActionButton>
            <Nav
              onLinkClick={(ev, item) =>
                this.selectResource(item.obj, item.key)
              }
              selectedKey={selectedKey}
              groups={[
                {
                  name: "Resources",
                  links: resourceData.get(this.elemStr).map((resource, k) => {
                    return { name: resource.id, key: k, obj: resource };
                  }),
                },
              ]}
            />
          </StackItem>
          {selected && (
            <StackItem tokens={{ padding: 12 }} styles={{ root: {} }}>
              <Resource
                resource={selected}
                timetables={timetables.timetable?.map((t, k) => {
                  return { key: t.id, text: t.id, obj: t };
                })}
                onChange={onChange}
                modeling={modeling}
                onRemove={() => {
                  modeling.removeResource(selected);
                }}
              />
            </StackItem>
          )}
        </Stack>
      </Stack>
    );
  }
}
