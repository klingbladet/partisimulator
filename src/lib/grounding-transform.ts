import type { TextStreamPart, ToolSet } from "ai";
import { UNGROUNDED_MARKER } from "@/lib/sources";

/**
 * A streamText `experimental_transform` that prepends UNGROUNDED_MARKER to the reply whenever
 * `grounded` is false, i.e. retrieveContext found no manifest chunks for this question. Written by
 * the route itself rather than the model, so the client can trust it to suppress a [KÄLLA: ...] the
 * model claimed anyway - the prompt tells the model not to cite in that case too (see
 * buildManifestSection), but an instruction alone isn't a guarantee.
 */
export function createGroundingMarkerTransform<TOOLS extends ToolSet>(grounded: boolean) {
  return (): TransformStream<TextStreamPart<TOOLS>, TextStreamPart<TOOLS>> => {
    let injected = false;
    return new TransformStream({
      transform(chunk, controller) {
        if (grounded || injected || chunk.type !== "text-delta") {
          controller.enqueue(chunk);
          return;
        }
        injected = true;
        controller.enqueue({ ...chunk, text: `${UNGROUNDED_MARKER}${chunk.text}` });
      },
    });
  };
}
