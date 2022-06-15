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

  const { onPrimary, onSecondary, primaryText, secondaryText, iconName, children } = props;
  const textContent = children || `You have not selected a redesign idea to implement. Switch to the
  redesign tab to choose an idea or start with a empty change set.`;

  const _iconName = iconName || "ClearNight";


  return (
    <Stack
      verticalFill
      verticalAlign={"center"}
      horizontalAlign={"center"}
      tokens={{ childrenGap: 12, padding: 12 }}
    >
      <Icon iconName={_iconName} className={iconClass} />

      <Text wrap>{textContent}</Text>
      <Stack horizontal tokens={{ childrenGap: 12, padding: 12 }}>
        <PrimaryButton onClick={onPrimary}>{primaryText}</PrimaryButton>
        <DefaultButton onClick={onSecondary}>{secondaryText}</DefaultButton>
      </Stack>
    </Stack>
  );
}
