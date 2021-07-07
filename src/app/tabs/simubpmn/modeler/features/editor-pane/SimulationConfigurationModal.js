import {
  getTheme,
  mergeStyleSets,
  FontWeights,
  Pivot,
  PivotItem,
  Dialog,
  DialogType,
  StackItem,
  DefaultButton,
} from "@fluentui/react";
import React, { Component } from "react";
import { ModdleContext } from "./elements/context";
import SimulationConfiguration from "./elements/SimulationConfiguration";
import Timetables from "./elements/Timetables";
import ResourcesComponent from "./elements/ResourcesComponent";

export default class SimulationConfigurationModal extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    const moddle = this.context;
    const { isOpen, onChange, onAction, bsim, modeling, tab } = this.props;
    if (!bsim) return null;
    const resourceData = bsim.get("resourceData");
    const timetables = bsim.get("timetables");

    return (
      <Dialog
        hidden={!isOpen}
        dialogContentProps={{
          type: DialogType.normal,
          title: "Simulation Configuration",
        }}
        modalProps={{
          isBlocking: true,
          styles: { main: { minWidth: "700px !important", maxWidth: 800 } },
        }}
        onDismiss={() => {
          onAction("modal-toggle");
        }}
      >
        <Pivot
          onLinkClick={(item) => {
            onAction("modal-tab-change", { newTab: item.props.itemKey });
          }}
          selectedKey={tab}
          headersOnly
        >
          <PivotItem itemKey={"simulation"} headerText={"Simulation"} />
          <PivotItem itemKey={"resources"} headerText={"Resources"} />
          <PivotItem itemKey={"timetables"} headerText={"Timetables"} />
        </Pivot>
        <StackItem grow>
          {tab === "simulation" && (
            <SimulationConfiguration item={bsim} onChange={onChange} />
          )}

          {tab === "resources" && (
            <ResourcesComponent
              onChange={onChange}
              timetables={timetables}
              resourceData={resourceData}
              modeling={modeling}
            />
          )}

          {tab === "timetables" && (
            <Timetables
              onChange={onChange}
              modeling={modeling}
              timetables={timetables}
            />
          )}
        </StackItem>
      </Dialog>
    );
  }
}
SimulationConfigurationModal.contextType = ModdleContext;

const theme = getTheme();
const contentStyles = mergeStyleSets({
  container: {
    display: "flex",
    flexFlow: "column nowrap",
    alignItems: "stretch",
  },
  header: [
    // eslint-disable-next-line deprecation/deprecation
    theme.fonts.mediumPlus,
    {
      flex: "1 1 auto",
      //borderTop: `4px solid ${theme.palette.themePrimary}`,
      color: theme.palette.neutralPrimary,
      display: "flex",
      alignItems: "center",
      fontWeight: FontWeights.semibold,
      padding: "12px 12px 14px 24px",
    },
  ],
  body: {
    padding: "12px 12px 14px 24px",
  },
});
const toggleStyles = { root: { marginBottom: "20px" } };
const iconButtonStyles = {
  root: {
    color: theme.palette.neutralPrimary,
    marginLeft: "auto",
    marginTop: "4px",
    marginRight: "2px",
  },
  rootHovered: {
    color: theme.palette.neutralDark,
  },
};
