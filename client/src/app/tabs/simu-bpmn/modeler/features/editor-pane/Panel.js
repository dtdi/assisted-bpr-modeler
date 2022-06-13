import React, { Component } from "react";
import {
  Stack,
  StackItem,
  Customizer,
  ProgressIndicator,
  Fabric,
  ScrollablePane,
  Pivot,
  PivotItem,
} from "@fluentui/react";
import EditorPane from "../editor-pane/EditorPane";
import HistoryPane from "../editor-pane/HistoryPane";
import IdeaPane from "../editor-pane/IdeaPane";
import { getEditTheme, getDefaultTheme } from "./util";
import EmptyRedesign from "./Empty";
import BsimElement from "./BsimElement";
import Messages from "../bsim-moddle-extension/elements/Messages";
import Empty from "./Empty";
import RedesignQuestionaire from "./WizardComponent";
import EvaluationPane from "./EvaluationPane";
export default class Panel extends Component {
  regularTheme;
  editTheme;
  constructor(props) {
    super(props);
    this.regularTheme = getDefaultTheme();
    this.editTheme = getEditTheme();
    this.state = {
      tab: "ideas",
      isConfigModalVisible: false,
      configModalTab: "simulation",
    };
  }

  switchPivot = (ev) => {
    this.setState({ tab: ev.props.itemKey });
  };

  onToggleEditMode = (ev) => {};

  onAction = (action, context) => {
    const { onAction: onParentAction } = this.props;
    if (action === "go-to-ideas") {
      this.setState({ tab: "ideas" });
      return;
      if (action === "search") {
      }
    } else if (action === "modal-toggle") {
      this.setState({ isConfigModalVisible: !this.state.isConfigModalVisible });
    } else if (action === "wizard-toggle") {
      const { context } = this.state;
      context.wizard.isVisible = !context.wizard.isVisible;
      this.setState({ context });
    } else if (action === "modal-tab-change") {
      this.setState({ configModalTab: context.newTab });
    }

    onParentAction(action, context);
  };

  render() {
    const {
      tab,
      isBusy,
      ideas,
      context,
      redesignStack,
      focusDimension,
      simuElements,
      isConfigModalVisible,
      messages,
      configModalTab,
      simuPerf,
      definitions,
    } = this.state;

    const resources =
      definitions &&
      definitions.get("bsim:resourceData") &&
      definitions
        .get("bsim:resourceData")
        .get("bsim:dynamicResource")
        .map((t, k) => {
          return { key: t.id, text: t.id, obj: t };
        });

    const onAction = this.onAction;

    const theme = context ? this.editTheme : this.regularTheme;

    return (
      <Customizer settings={{ theme }}>
        <Fabric
          applyTheme
          className="bpp-redesign-panel"
          style={{ height: "100%", position: "relative", width: "100%" }}
        >
          <Stack
            style={{ height: "100%", width: "100%", position: "relative" }}
          >
            <Pivot selectedKey={tab} onLinkClick={this.switchPivot} headersOnly>
              <PivotItem headerText="IDEAS" itemKey={"ideas"} />
              <PivotItem headerText="REDESIGN" itemKey={"editmode"} />

              <PivotItem headerText="EVALUATION" itemKey={"simulation"} />

              <PivotItem
                headerText="HISTORY"
                itemCount={
                  redesignStack &&
                  redesignStack._stack &&
                  redesignStack._stack.length
                }
                itemKey={"history"}
              />
            </Pivot>
            {tab === "ideas" && !context && (
              <BsimElement
                dimension={focusDimension}
                isBusy={isBusy}
                onAction={onAction}
              />
            )}
            <StackItem
              applyTheme
              grow
              styles={{ root: { position: "relative" } }}
            >
              <ScrollablePane>
                {tab === "ideas" && context && (
                  <Empty>Please finish the current redesign first!</Empty>
                )}
                {tab === "ideas" &&
                  false &&
                  !context &&
                  ideas &&
                  ideas.some((id) => id.isLoading) && (
                    <Stack tokens={{ childrenGap: 15, padding: 15 }}>
                      <ProgressIndicator description="Loading further ideas" />
                    </Stack>
                  )}

                {tab === "ideas" && !context && <IdeaPane ideas={ideas} />}

                {tab === "editmode" && context && (
                  <EditorPane context={context} onAction={onAction} />
                )}
                {tab === "editmode" && !context && (
                  <Empty
                    onRecs={() => {
                      onAction("go-to-ideas");
                    }}
                    onEmpty={() => {
                      onAction("start-empty");
                    }}
                  />
                )}

                {tab === "simulation" && simuPerf && (
                  <EvaluationPane
                    stack={redesignStack}
                    context={context}
                    simuPerf={simuPerf}
                    onAction={onAction}
                  />
                )}

                {tab === "history" && redesignStack && (
                  <HistoryPane
                    stack={redesignStack}
                    context={context}
                    onAction={onAction}
                  />
                )}
                {tab === "history" && !(context || redesignStack) && (
                  <Empty
                    onRecs={() => {
                      onAction("go-to-ideas");
                    }}
                    onEmpty={() => {
                      onAction("start-empty");
                    }}
                  >
                    You have not implemented an idea. Switch to the redesign tab
                    to choose an idea or start with a empty change set.
                  </Empty>
                )}
              </ScrollablePane>
            </StackItem>
          </Stack>
        </Fabric>

        {context && context.wizard && (
          <RedesignQuestionaire
            isOpen={context.wizard.isVisible}
            context={context}
            onAction={onAction}
            modeling={this.props.modeling}
            onChange={this.props.onModdleChange}
            resources={resources}
          />
        )}

        {messages && (
          <Messages
            messages={messages}
            node={document.getElementById("root")}
          ></Messages>
        )}
      </Customizer>
    );
  }
}
