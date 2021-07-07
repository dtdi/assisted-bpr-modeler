import { isArray } from "min-dash";

export default class Idea {
  constructor(heuristicKey, ideaType) {
    this.heuristicKey = heuristicKey;
    this.ideaType = ideaType;
  }

  get key() {
    return `${this.heuristicKey}.${this.ideaType}`;
  }

  get isLoading() {
    return this.contribution === undefined;
  }

  //heuristicKey;
  contribution;
  name;
  group;
  groupRank;
  description;
  elements;
  videoUrl;
  get thumbnail() {
    if (!this.videoUrl) return null;
    const videoId = this.videoUrl.split("/").pop();
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  }
  ideaType;
  category;
  bestPracticeClass;
  frameWorkAspect;
  actions = [];

  hints;

  get relevance() {
    return this.contribution * parseInt(this.ideaType);
  }

  /**
   * Compares two ideas and returns their similirity.
   * @param {Idea} b the other idea
   */
  sim(b) {
    let ideaProvider = this.heuristicKey === b.heuristicKey ? 1 : 0;
    let category = this.category === b.category ? 1 : 0;
    let frameWorkAspect = this.frameWorkAspect === b.frameWorkAspect ? 1 : 0;
    let bestPracticeClass =
      this.bestPracticeClass === b.bestPracticeClass ? 1 : 0;

    let elementSimilarity;
    if (isArray(this.elements) && isArray(b.elements)) {
      const bIds = b.elements.map((e) => e.id);
      const res = this.elements
        .map((e) => e.id)
        .filter((e) => bIds.includes(e));
      elementSimilarity = res.length / this.elements.length;
    } else {
      elementSimilarity = 0;
    }

    // todo: equal elements.
    const similarity =
      0.4 * ideaProvider +
      0.2 * elementSimilarity +
      0.2 * category +
      0.1 * frameWorkAspect +
      0.1 * bestPracticeClass;
    return similarity;
  }
}
