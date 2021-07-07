import RulesModule from "bpmn-js/lib/features/rules";
import BsimRules from "./BsimRules";

export default {
  __depends__: [RulesModule],
  __init__: ["bsimRules"],
  bsimRules: ["type", BsimRules],
};
