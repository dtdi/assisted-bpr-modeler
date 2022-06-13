import {
  StackItem,
  ActionButton,
  Stack,
  DefaultButton,
  getTheme,
  Nav,
} from "@fluentui/react";
import React from "react";
import ElementComponent from "./ElementComponent";
import ScheduleSelector from "react-schedule-selector";

import {
  addHours,
  setMinutes,
  setHours,
  eachDay,
  setDay,
  compareAsc,
  format,
  startOfWeek,
} from "date-fns";
import { forEach, groupBy } from "min-dash";
import { FluentField } from "./FluentField";
import { ModdleContext } from "./context";

function _doW(day) {
  switch (day.toUpperCase()) {
    case "SUNDAY":
      return 0;
    case "MONDAY":
      return 1;
    case "TUESDAY":
      return 2;
    case "WEDNESDAY":
      return 3;
    case "THURSDAY":
      return 4;
    case "FRIDAY":
      return 5;
    case "SATURDAY":
      return 6;
  }
}

const theme = getTheme();

function getTime(time) {
  return time.split(":");
}

function _explodeToDates(ttItem) {
  //const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
  const start = setDay(new Date(), _doW(ttItem.from), { weekStartsOn: 1 });
  const end = setDay(start, _doW(ttItem.to), { weekStartsOn: 1 });

  const days = eachDay(start, end);

  const startTime = getTime(ttItem.beginTime);
  const endTime = getTime(ttItem.endTime);

  const hours = [];

  days.forEach((day) => {
    let current = setMinutes(setHours(day, startTime[0]), startTime[1]);
    let end = setMinutes(setHours(day, endTime[0]), endTime[1]);
    while (compareAsc(current, end) === -1) {
      hours.push(current);
      current = addHours(current, 1);
    }
  });
  return hours;
}

export default class Timetables extends ElementComponent {
  constructor(props) {
    super(props);
    this.elemStr = "bsim:timetable";
    this.state = {
      selectedKey: 0,
      selected: undefined,
      currentSchedule: [],
      updateRev: 0,
    };
    this.myRef = React.createRef();
  }

  componentDidMount() {
    this.setSelectedAndSchedule(this.props.timetables.get("timetable")[0], 0);
  }

  setScheduleFromSelected(elems) {
    const moddle = this.context;

    const days = groupBy(
      elems
        .sort((a, b) => compareAsc(a, b))
        .map((hour) => {
          return {
            day: format(hour, "dddd").toUpperCase(),
            hour: format(hour, "H"),
            hourEnd: format(addHours(hour, 1), "H"),
            beginTime: format(hour, "HH:mm"),
            endTime: format(addHours(hour, 1), "HH:mm"),
          };
        }),
      "day"
    );

    const timetableItems = [];

    forEach(days, (times, day) => {
      let item;
      forEach(times, (timeSet) => {
        if (!item) {
          item = moddle.create("bsim:timetableItem", {
            from: day,
            to: day,
            beginTime: timeSet.beginTime,
            endTime: timeSet.endTime,
          });
        } else if (item.endTime !== timeSet.beginTime) {
          timetableItems.push(item);
          item = undefined;
        } else {
          item.set("endTime", timeSet.endTime);
        }
      });
      if (item) {
        timetableItems.push(item);
        item = undefined;
      }
    });

    const { selected } = this.state;
    selected.set("bsim:timetableItem", timetableItems);
    this.setState({ currentSchedule: elems, selected });
  }

  setSelectedAndSchedule(timetable, key) {
    const timeTableItems = timetable.get("timetableItem");
    let currentSchedule = [];

    if (timeTableItems) {
      timeTableItems.forEach((ttItem) => {
        currentSchedule.push(..._explodeToDates(ttItem));
      });
    }
    this.setState({
      selected: timetable,
      selectedKey: key,
      currentSchedule: currentSchedule,
      updateRev: this.state.updateRev + 1,
    });
  }

  render() {
    const { onChange, timetables, modeling } = this.props;
    const { selected, selectedKey, currentSchedule, updateRev } = this.state;
    return (
      <Stack horizontal>
        <StackItem styles={{ root: { width: 150 } }}>
          <ActionButton
            iconProps={{ iconName: "add" }}
            onClick={() => {
              const timetable = modeling._createBsim("bsim:timetable", {});
              onChange(timetables, timetables, {
                timetable: [...(timetables.timetable || []), ...[timetable]],
              });
            }}
          >
            Timetable
          </ActionButton>
          <Nav
            onLinkClick={(ev, item) =>
              this.setSelectedAndSchedule(item.obj, item.key)
            }
            selectedKey={selectedKey}
            groups={[
              {
                name: "Timetables",
                links: timetables.get("timetable")?.map((t, k) => {
                  return { name: t.id, key: k, obj: t };
                }),
              },
            ]}
          />
        </StackItem>
        {selected && (
          <StackItem tokens={{ padding: 12 }} styles={{ root: { width: 600 } }}>
            <Stack horizontal verticalAlign="end" tokens={{ childrenGap: 12 }}>
              <FluentField
                value={selected.id}
                label={"ID"}
                onChange={(_, val) => {
                  onchange(selected, selected, { id: val });
                }}
              />
              <DefaultButton
                iconProps={{ iconName: "Delete" }}
                disabled={true}
                onClick={(ev) => {}}
              >
                Remove
              </DefaultButton>
            </Stack>

            <ScheduleSelector
              selection={currentSchedule}
              key={updateRev}
              numDays={7}
              dateFormat={"dd"}
              timeFormat={"HH"}
              startDate={startOfWeek(new Date(), { weekStartsOn: 1 })}
              minTime={0}
              margin={1}
              selectedColor={theme.palette.themePrimary}
              unselectedColor={theme.palette.themeTertiary}
              hoveredColor={theme.palette.themeLight}
              maxTime={24}
              selectionScheme={"linear"}
              onChange={(elems) => {
                this.setScheduleFromSelected(elems);
              }}
            />
          </StackItem>
        )}
      </Stack>
    );
  }
}
Timetables.contextType = ModdleContext;
