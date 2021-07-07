import { DateTime } from "luxon";
import { Text, Stack, StackItem, Dropdown, DatePicker } from "@fluentui/react";
import React, { Component } from "react";
import { ModdleContext } from "./context";
import ElementComponent from "./ElementComponent";
import { FluentField } from "./FluentField";

class SimulationConfiguration extends ElementComponent {
  constructor(props) {
    super(props);
    this.elemStr = "bsim:simulationConfiguration";
  }

  _timeOptions = () => {
    const options = [];
    for (let i = 0; i < 24; i++) {
      options.push({
        key: `${(i + "").padStart(2, "0")}:00`,
        text: `${(i + "").padStart(2, "0")}:00`,
        hour: i,
        minute: 0,
      });
      options.push({
        key: `${(i + "").padStart(2, "0")}:30`,
        text: `${(i + "").padStart(2, "0")}:30`,
        hour: i,
        minute: 30,
      });
    }
    return options;
  };

  render() {
    const { onChange, item } = this.props;

    const { simulationConfiguration } = item;

    const simuConfObj = simulationConfiguration[0];

    const startDateTime = DateTime.fromISO(simuConfObj.get("startDateTime"));
    const endDateTime = DateTime.fromISO(simuConfObj.get("endDateTime"));

    return (
      <Stack tokens={{ childrenGap: 12, padding: 12 }}>
        <Stack tokens={{ childrenGap: 12 }} horizontal>
          <StackItem>
            <FluentField
              value={simuConfObj.randomSeed}
              label={this._getName("randomSeed")}
              description={this._getDescr("randomSeed")}
              onChange={(val) => {
                onChange(simuConfObj, simuConfObj, { randomSeed: val });
              }}
            />
          </StackItem>
          <StackItem>
            <FluentField
              value={simuConfObj.processInstances}
              label={this._getName("processInstances")}
              description={this._getDescr("processInstances")}
              onChange={(val) => {
                onChange(simuConfObj, simuConfObj, { processInstances: val });
              }}
            />
          </StackItem>
          <FluentField
            styles={{ root: { width: 75 } }}
            disabled
            description={this._getDescr("zoneOffset")}
            label={this._getName("zoneOffset")}
            value={simuConfObj.get("bsim:zoneOffset")}
          />
        </Stack>
        <Stack
          tokens={{ childrenGap: 12 }}
          horizontal
          wrap
          verticalAlign="center"
        >
          <StackItem styles={{ root: { width: 150 } }}>
            <DatePicker
              value={startDateTime.toJSDate()}
              label={this._getName("startDateTime")}
              description={this._getDescr("startDateTime")}
              onSelectDate={(val) => {
                let oldVal = simuConfObj.get("bsim:startDateTime");

                val = DateTime.fromJSDate(val);

                let newVal = oldVal ? DateTime.fromISO(oldVal) : val;

                newVal = newVal.set({
                  year: val.year,
                  month: val.month,
                  day: val.day,
                });
                onChange(simuConfObj, simuConfObj, {
                  startDateTime: newVal.toISO({ suppressSeconds: true }),
                });
              }}
            />
          </StackItem>
          <Dropdown
            styles={{ dropdown: { width: 75 } }}
            label={"Start Time"}
            options={this._timeOptions()}
            selectedKey={startDateTime.toFormat("HH:mm")}
            onChange={(_, val) => {
              let oldVal = simuConfObj.get("bsim:startDateTime");

              let newVal = oldVal ? DateTime.fromISO(oldVal) : DateTime.local();
              newVal = newVal.set({
                hour: val.hour,
                minute: val.minute,
              });
              onChange(simuConfObj, simuConfObj, {
                startDateTime: newVal.toISO({ suppressSeconds: true }),
              });
            }}
          />
          <Stack wrap horizontal>
            <StackItem>
              <DatePicker
                value={endDateTime.toJSDate() || undefined}
                label={this._getName("endDateTime")}
                description={this._getDescr("endDateTime")}
                onSelectDate={(val) => {
                  let oldVal = simuConfObj.get("bsim:endDateTime");

                  val = DateTime.fromJSDate(val);

                  let newVal = oldVal ? DateTime.fromISO(oldVal) : val;

                  newVal = newVal.set({
                    year: val.year,
                    month: val.month,
                    day: val.day,
                  });
                  onChange(simuConfObj, simuConfObj, {
                    endDateTime: newVal.toISO({ suppressSeconds: true }),
                  });
                }}
              />
            </StackItem>
          </Stack>
          <Dropdown
            styles={{ dropdown: { width: 75 } }}
            label={"End Time"}
            selectedKey={endDateTime?.toFormat("HH:mm")}
            options={this._timeOptions()}
            onChange={(_, val) => {
              let oldVal = simuConfObj.get("bsim:endDateTime");

              let newVal = oldVal ? DateTime.fromISO(oldVal) : DateTime.local();
              newVal = newVal.set({
                hour: val.hour,
                minute: val.minute,
              });
              onChange(simuConfObj, simuConfObj, {
                endDateTime: newVal.toISO({ suppressSeconds: true }),
              });
            }}
          />
        </Stack>
      </Stack>
    );
  }
}
SimulationConfiguration.contextType = ModdleContext;
export default SimulationConfiguration;
