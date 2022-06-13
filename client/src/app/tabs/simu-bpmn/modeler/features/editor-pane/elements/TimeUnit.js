import React from "react";
import { Dropdown } from "@fluentui/react";
export default function TimeUnit(props) {
  const timeUnits = [
    { name: "HOURS" },
    { name: "MINUTES" },
    { name: "DAYS" },
    { name: "SECONDS" },
    { name: "MICROSECONDS" },
    { name: "MILLISECONDS" },
    { name: "NANOSECONDS" },
  ].map((e) => {
    return { key: e.name, text: e.name };
  });
  return (
    <Dropdown
      selectedKey={props.value}
      disabled={props.disabled}
      description={props.description}
      options={timeUnits}
      label={props.label || "Time Unit"}
      onChange={props.onChange}
    />
  );
}
