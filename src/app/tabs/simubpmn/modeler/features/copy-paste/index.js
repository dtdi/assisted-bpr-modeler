import CopyPasteModule from "bpmn-js/lib/features/copy-paste";

import BsimCopyPaste from "./BsimCopyPaste";

export default {
  __depends__: [CopyPasteModule],
  __init__: ["bsimCopyPaste"],
  bsimCopyPaste: ["type", BsimCopyPaste],
};
