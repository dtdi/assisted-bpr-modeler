import {
  Icon,
  Stack,
  mergeStyles,
  Text,
  PrimaryButton,
  DefaultButton,
} from "@fluentui/react";
import React from "react";

export default function Empty(props) {
  const iconClass = mergeStyles({
    fontSize: 50,
    height: 50,
    width: 50,
    margin: "0 25px",
  });

  const { onRecs, onEmpty } = props;
  const text = `You have not selected a redesign idea to implement. Switch to the
  redesign tab to choose an idea or start with a empty change set.`;

  return (
    <Stack
      verticalFill
      verticalAlign={"center"}
      horizontalAlign={"center"}
      tokens={{ childrenGap: 12, padding: 12 }}
    >
      <Icon iconName={"ClearNight"} className={iconClass} />

      <Text wrap>{props.children || text}</Text>
      <Stack horizontal tokens={{ childrenGap: 12, padding: 12 }}>
        <PrimaryButton onClick={onRecs}>View Ideas</PrimaryButton>
        <DefaultButton onClick={onEmpty}>Start from blank</DefaultButton>
      </Stack>
    </Stack>
  );
}
