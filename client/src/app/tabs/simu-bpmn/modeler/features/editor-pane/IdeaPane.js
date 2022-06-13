import { groupBy, map, sortBy } from "min-dash";
import {
  DocumentCard,
  Stack,
  FontWeights,
  FontSizes,
  DocumentCardTitle,
  DocumentCardType,
  DocumentCardDetails,
  DocumentCardLocation,
  DocumentCardActions,
  DocumentCardImage,
  ProgressIndicator,
  Fabric,
  Sticky,
  ImageFit,
  StickyPositionType,
  mergeStyleSets,
} from "@fluentui/react";
import React, { Component } from "react";
export default class IdeaPane extends Component {
  constructor(props) {
    super(props);
  }

  styles = mergeStyleSets({});

  render() {
    const { ideas, onAction } = this.props;
    const groups = groupBy(ideas, (r) => r.group);

    return (
      <>
        {groups.topadvice && (
          <>
            <Sticky stickyPosition={StickyPositionType.Header}>
              <div className={this.className.sticky}>
                <span>Redesign Advices ({groups.topadvice.length})</span>
              </div>
            </Sticky>
            <Stack horizontalAlign="center" tokens={{ childrenGap: 15 }}>
              {sortBy(groups.topadvice, (idea) => idea.groupRank).map(
                this.buildDocumentCard,
                this
              )}
            </Stack>
          </>
        )}
        {groups.furthertop && (
          <>
            <Sticky stickyPosition={StickyPositionType.Header}>
              <div className={this.className.sticky}>
                <span>Top Recommendations ({groups.furthertop.length})</span>
              </div>
            </Sticky>
            <Stack horizontalAlign="center" tokens={{ childrenGap: 15 }}>
              {sortBy(groups.furthertop, (idea) => idea.groupRank).map(
                this.buildDocumentCard,
                this
              )}
            </Stack>
          </>
        )}
        {groups.other && (
          <>
            <Sticky stickyPosition={StickyPositionType.Header}>
              <div className={this.className.sticky}>
                <span>Other recommendations({groups.other.length})</span>
              </div>
            </Sticky>
            <Stack horizontalAlign="center" tokens={{ childrenGap: 15 }}>
              {sortBy(groups.other, (idea) => idea.groupRank).map(
                this.buildDocumentCard,
                this
              )}
            </Stack>
          </>
        )}
      </>
    );
  }

  buildDocumentCard(idea, i) {
    const isCompact = parseInt(idea.ideaType) < 2;

    if (idea.isLoading) {
      return (
        <DocumentCard
          key={i}
          type={DocumentCardType.compact}
          style={{ width: 320 }}
        >
          <DocumentCardDetails>
            <DocumentCardTitle title={idea.name} shouldTruncate />
            <Fabric style={{ padding: "8px 16px" }}>
              <ProgressIndicator
                label="Loading"
                description="We're finding further ideas"
              />
            </Fabric>
          </DocumentCardDetails>
        </DocumentCard>
      );
    }

    return (
      <DocumentCard
        key={i}
        type={DocumentCardType.normal}
        style={{ width: 320 }}
      >
        {idea.thumbnail && (
          <DocumentCardImage
            imageSrc={idea.thumbnail}
            imageFit={ImageFit.center}
          />
        )}
        <DocumentCardLocation
          location={idea.category + " | " + idea.bestPracticeClass}
        />
        <DocumentCardDetails>
          <DocumentCardTitle
            title={idea.name}
            styles={{ root: { height: "auto" } }}
          />

          <DocumentCardTitle
            title={idea.description}
            showAsSecondaryTitle
            styles={{ root: { height: "auto", fontSize: FontSizes.medium } }}
          />
        </DocumentCardDetails>

        <DocumentCardActions actions={idea.actions} />
      </DocumentCard>
    );
  }

  className = mergeStyleSets({
    wrapper: { position: "absolute", height: "100%" },
    pane: { position: "absolute", height: "100%", width: "100%" },
    heading: {},
    sticky: {
      textTransform: "uppercase",
      fontWeight: FontWeights.semilight,
      fontSize: FontSizes.small,
      padding: "5px 15px",
    },
  });
}
