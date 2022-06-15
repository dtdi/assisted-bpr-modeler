import {
  HoverCard,
  Text,
  Icon,
  Fabric,
  Stack,
  FontSizes,
} from "@fluentui/react";
import React, { Component } from "react";
import ReactDOM from "react-dom";

import { Duration, Resources, classNames, CompactCard } from "./Partials";
import { is } from "bpmn-js/lib/util/ModelUtil";
import BoundaryEventComponent from "../../editor-pane/elements/BoundaryEvent";
import CatchEventComponent from "../../editor-pane/elements/CatchEvent";
import TaskComponent from "../../editor-pane/elements/Task";
import StartEventComponent from "../../editor-pane/elements/StartEvent";
import GatewayComponent from "../../editor-pane/elements/Gateway";

export default class ConfigCard extends Component {
  _getProperty(property, type) {
    const moddle = this.context;

    if (!type) {
      type = this.elemStr;
    }
    const Type = moddle.getType(type);
    const prop = moddle.getPropertyDescriptor(Type, property);
    return prop;
  }

  _getName(property, type) {
    return (
      false ||
      property // insert a space before all caps
        .replace(/([A-Z])/g, " $1")
        // uppercase the first character
        .replace(/^./, function (str) {
          return str.toUpperCase();
        })
    );
  }

  onRenderExpandedCard(cardData) {
    const { bsim, onChange, resources } = cardData;

    if (is(bsim, "bsim:task")) {
      return (
        <TaskComponent
          task={bsim}
          onChange={onChange}
          resources={resources}
          compact
        />
      );
    } else if (is(bsim, "bsim:startEvent")) {
      return (
        <StartEventComponent startEvent={bsim} onChange={onChange} compact />
      );
    } else if (is(bsim, "bsim:exclusiveGateway")) {
      return <GatewayComponent gateway={bsim} onChange={onChange} compact />;
    } else if (is(bsim, "bsim:boundaryEvent")) {
      return (
        <BoundaryEventComponent event={bsim} onChange={onChange} compact />
      );
    } else if (is(bsim, "bsim:catchEvent")) {
      return <CatchEventComponent event={bsim} onChange={onChange} compact />;
    }
  }
  onRenderCompactCard(cardData) {
    const { bsim } = cardData;

    return (
      <CompactCard heading={bsim.name || bsim.id.name}>
        {is(bsim, "bsim:task") && bsim.duration && (
          <Duration isDuration item={bsim.duration} />
        )}
        {is(bsim, "bsim:task") && bsim.setUpDuration && (
          <Duration item={bsim.setUpDuration} />
        )}
        {is(bsim, "bsim:task") &&
          (bsim.resources || bsim.get("bpmnElement").get("lanes")) && (
            <Resources
              item={bsim.resources}
              lane={bsim.get("bpmnElement").get("lanes")}
            />
          )}
        {is(bsim, "bsim:boundaryEvent") && bsim.eventProbability && (
          <Text>Event probability: {bsim.eventProbability}</Text>
        )}
        {is(bsim, "bsim:Event") && bsim.arrivalRate && (
          <Duration text={"Arrival Rate"} item={bsim.arrivalRate} />
        )}
        {is(bsim, "bsim:exclusiveGateway") &&
          bsim.outgoing &&
          bsim.outgoing.map((flow, i) => {
            return (
              <Stack
                key={i}
                horizontal
                verticalAlign="center"
                tokens={{ childrenGap: 10 }}
              >
                <Icon className={classNames.iconCard} iconName={"BranchFork"} />
                <Text variant="medium">
                  {flow.bpmnElement.targetRef.name}
                  {": "}
                  {(flow.branchingProbability.value * 100).toFixed(0)}
                  {"%"}
                </Text>
              </Stack>
            );
          })}
      </CompactCard>
    );
  }
  render() {
    const { bsim, onChange, resources, node } = this.props;

    const expandingCardProps = {
      onRenderCompactCard: this.onRenderCompactCard,
      onRenderExpandedCard: this.onRenderExpandedCard,
      expandedCardHeight: 250,
      compactCardHeight: 120,
      needsScroll: true,
      renderData: {
        bsim: bsim,
        onChange,
        getName: this._getName,
        resources: resources,
      },
    };

    return ReactDOM.createPortal(
      <HoverCard
        expandingCardProps={expandingCardProps}
        cardOpenDelay={300}
        expandedCardOpenDelay={300}
        instantOpenOnClick={true}
      >
        <Stack
          horizontal
          className={classNames.iconwrap}
          tokens={{ childrenGap: 4 }}
        >
          {bsim.quant && (
            <Text
              styles={{ root: { color: "white", fontSize: FontSizes.mini } }}
            >
              {bsim.quant}
            </Text>
          )}
          <Icon
            iconName={"Edit"}
            color={"rgb(0, 147, 116)"}
            className={classNames.icon}
          ></Icon>
        </Stack>
      </HoverCard>,
      node
    );
  }
}
