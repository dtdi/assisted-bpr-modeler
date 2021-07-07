import {
  Stack,
  mergeStyleSets,
  StackItem,
  Text,
  Dialog,
  DefaultButton,
  PrimaryButton,
  DialogType,
  DialogFooter,
} from "@fluentui/react";
import { isFunction } from "min-dash";
import React, { Component } from "react";
import { FluentField } from "./elements/FluentField";

export default class CommitStashFinalize extends Component {
  constructor(props) {
    super(props);
    const { context } = this.props;
    this.state = { hideDialog: true, commitMessage: context?.commitMessage };
  }

  componentDidUpdate(oldProps, oldState) {
    if (oldProps.context?.commitMessage !== this.props.context?.commitMessage) {
      this.setState({ commitMessage: this.props.context?.commitMessage });
    }
  }

  styles = mergeStyleSets({});

  onBeforeStash = (ev, fn) => {
    if (this.props.isDirty) {
      this.setState({
        hideDialog: false,
        dialogContentProps: {
          type: DialogType.normal,
          title: "Stash",
          subText:
            "Do you want to stash your changes to the redesign implementation?",
        },
      });
    } else {
      fn();
    }
  };

  toggleHideDialog = (ev, fn) => {
    this.setState({
      hideDialog: true,
    });
    if (isFunction(fn)) {
      fn();
    }
  };

  render() {
    const { onAction, context, isDirty } = this.props;
    if (!context) return null;
    const { hideDialog, dialogContentProps } = this.state;
    const { idea } = context;

    const fnRevert = () => {
      onAction("stash", context);
    };

    return (
      <Stack tokens={{ childrenGap: 8, padding: 12 }}>
        <StackItem>
          <Text
            style={{
              fontWeight: "400",
              fontSize: "18px",
              height: "38px",
              lineHeight: "21px",
            }}
          >
            {idea.name && `Implement: ${idea.name}`}
          </Text>
          <Text block wrap>
            {idea.description}
          </Text>
        </StackItem>
        <StackItem styles={{ root: { width: "100%" } }}>
          <FluentField
            multiline
            rows={1}
            value={this.state.commitMessage}
            onChange={(newValue) => {
              this.setState({ commitMessage: newValue });
            }}
          />
        </StackItem>
        <StackItem align="end">
          {context.status !== "committed" && (
            <Stack horizontal tokens={{ childrenGap: 8 }}>
              {context?.wizard && (
                <PrimaryButton
                  text={context.wizard.isVisible ? "Close" : "Open"}
                  iconProps={{
                    iconName: context.wizard.isVisible
                      ? "ChromeClose"
                      : "Settings",
                  }}
                  toggle
                  checked={context.wizard.isVisible}
                  onClick={(_) => {
                    onAction("wizard-toggle");
                  }}
                />
              )}
              <DefaultButton
                iconProps={{
                  iconName: "Undo",
                }}
                text="Cancel & revert"
                onClick={(ev) => {
                  this.onBeforeStash(ev, fnRevert);
                }}
              />
              <Dialog
                hidden={hideDialog}
                dialogContentProps={dialogContentProps}
                modalProps={{ isBlocking: true }}
                onDismiss={this.toggleHideDialog}
              >
                <DialogFooter>
                  <PrimaryButton
                    onClick={(ev) => {
                      this.toggleHideDialog(ev, fnRevert);
                    }}
                    text="Stash"
                  />
                  <DefaultButton
                    onClick={this.toggleHideDialog}
                    text="Don't stash"
                  />
                </DialogFooter>
              </Dialog>

              <PrimaryButton
                text="Commit"
                split
                menuProps={{
                  items: [
                    {
                      key: "commit-finalize",
                      text: "Commit and finalize",
                      onClick: (ev) => {
                        onAction("commit-finalize", {
                          commitMessage: this.state.commitMessage,
                        });
                      },
                    },
                  ],
                }}
                onClick={(ev) => {
                  onAction("commit", {
                    commitMessage: this.state.commitMessage,
                  });
                }}
                disabled={!isDirty}
              />
            </Stack>
          )}
          {context.status === "committed" && (
            <Stack horizontal tokens={{ childrenGap: 8 }}>
              <DefaultButton
                text="Revert"
                onClick={(ev) => {
                  this.onBeforeStash(ev, fnRevert);
                }}
              />
              <Dialog
                hidden={hideDialog}
                dialogContentProps={dialogContentProps}
                modalProps={{ isBlocking: true }}
                onDismiss={this.toggleHideDialog}
              >
                <DialogFooter>
                  <PrimaryButton
                    onClick={(ev) => {
                      this.toggleHideDialog(ev, fnRevert);
                    }}
                    text="Revert"
                  />
                  <DefaultButton
                    onClick={this.toggleHideDialog}
                    text="Don't Revert"
                  />
                </DialogFooter>
              </Dialog>

              <PrimaryButton
                text="Finalize"
                onClick={(ev) => {
                  onAction("finalize", {
                    commitMessage: this.state.commitMessage,
                  });
                }}
              />
            </Stack>
          )}
        </StackItem>
      </Stack>
    );
  }
}
