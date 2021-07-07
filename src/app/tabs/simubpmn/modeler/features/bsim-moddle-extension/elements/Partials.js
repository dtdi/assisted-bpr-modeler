import {
  mergeStyleSets,
  Text,
  getTheme,
  Icon,
  PersonaSize,
  Persona,
  Stack,
  FontWeights,
  Fabric,
  Facepile,
} from "@fluentui/react";
import { isArray } from "min-dash";
import React, { Component } from "react";
import { ModdleContext } from "../../editor-pane/elements/context";

const theme = getTheme();
export const classNames = mergeStyleSets({
  iconwrap: {
    height: 20,
    minWidth: 20,
    padding: "0 4px",

    "text-align": "center",
    "line-height": 18,
    background: theme.palette.green,
    "border-radius": "30%",
  },
  icon: {
    fontSize: 12,
    height: 12,
    color: "white",
    width: 12,
  },
  values: {
    "font-family":
      "Monaco, Menlo, Consolas, 'Droid Sans Mono', Inconsolata, 'Courier New', monospace",
    background: theme.palette.whiteTranslucent40,
    color: theme.palette.blackTranslucent40,
    padding: "0 4px",
    border: "1px solid rgb(237, 235, 233)",
    "border-radius": 3,
  },

  iconCard: {
    padding: "0 5 0 0",
  },
  compactCard: {
    justifyContent: "center",
    height: "100%",
    display: "flex",
    padding: "16px 24px",
  },
  heading: {
    fontWeight: FontWeights.semibold,
  },
  expandedCard: {
    padding: "16px 24px",
  },
});

export function CompactCard(props) {
  return (
    <Stack tokens={{ childrenGap: 7 }} className={classNames.compactCard}>
      <Fabric>
        <Text className={classNames.heading} variant="mediumPlus">
          {props.heading}
        </Text>
      </Fabric>
      {props.children}
    </Stack>
  );
}

export function Resources(props) {
  const { item, lane } = props;

  if (item && isArray(item.resource) && item.resource.length > 0) {
    return (
      <Stack horizontal verticalAlign={"center"} tokens={{ childrenGap: 10 }}>
        <Icon
          className={classNames.iconCard}
          iconName={"WorkforceManagement"}
        />

        <Stack tokens={{ childrenGap: 10 }}>
          {item.resource?.length > 2 && (
            <Facepile
              personaSize={PersonaSize.size24}
              personas={item.resource.map((person) => {
                return {
                  personaName: `${person.id.name || person.id.id} (${
                    person.amount || person.defaultQuantity
                  })`,
                };
              })}
              maxDisplayablePersonas={4}
            />
          )}

          {item.resource?.length <= 2 &&
            item.resource.map((resource) => {
              // Return the element. Also pass key
              return <Resource key={resource.id.id} item={resource} />;
            })}
        </Stack>
      </Stack>
    );
  }

  if (lane) {
    let laneRes;
    if (lane && lane.length === 1) {
      laneRes = lane[0].bsim;
    }
    if (laneRes)
      return (
        // Return the element. Also pass key
        <Stack horizontal verticalAlign={"center"} tokens={{ childrenGap: 10 }}>
          <Icon
            className={classNames.iconCard}
            iconName={"WorkforceManagement"}
          />
          <Persona
            size={PersonaSize.size24}
            styles={{ primaryText: { color: "#333" } }}
            text={`${laneRes.name || laneRes.id} (1, inherited from Lane)`}
          />
        </Stack>
      );
  }
  if (!item.resource || item.resource.length == 0) {
    return (
      <Stack horizontal verticalAlign={"center"} tokens={{ childrenGap: 10 }}>
        <Icon
          className={classNames.iconCard}
          iconName={"WorkforceManagement"}
        />

        <Stack tokens={{ childrenGap: 10 }}>
          <Persona size={PersonaSize.size24} />
        </Stack>
      </Stack>
    );
  }

  return null;
}

function Resource(props) {
  const { item } = props;
  const { id: res } = item;
  return (
    <Persona
      size={PersonaSize.size24}
      text={`${res.name || res.id} (${item.amount || res.defaultQuantity})`}
    />
  );
}

export function TimeUnit(props) {
  switch (props.unit) {
    case undefined:
      return null;
    case "SECONDS":
      return <abbr title="Seconds">sec</abbr>;
    case "MINUTES":
      return <abbr title="Minutes">min</abbr>;
    case "HOURS":
      return <abbr title="Hours">hr</abbr>;
    default:
      return props.unit.toLowerCase();
  }
}

export class Duration extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    const moddle = this.context;
    const { item, text, isDuration } = this.props;

    if (item && item.distribution) {
      const d = item.distribution;
      const dType = moddle.getTypeDescriptor(d.$type);
      const name = dType.meta.displayName;

      let values = [];

      dType.properties
        .map((prop) => moddle.getTypeDescriptor(prop.name))
        .forEach((prop) => {
          const val = d[prop.ns.localName].value;
          if (val) {
            values.push(prop.meta.displayName + "=" + val);
          }
        });

      values = values.join(", ");
      return (
        <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 10 }}>
          <Icon
            className={classNames.iconCard}
            iconName={isDuration ? "BufferTimeAfter" : "BufferTimeBefore"}
          />
          <Text variant="medium">
            {" "}
            {text || "Duration"} (<TimeUnit unit={item.timeUnit} />
            ): {name} <code className={classNames.values}>{values}</code>
          </Text>
        </Stack>
      );
    }

    return null;
  }
}
Duration.contextType = ModdleContext;
