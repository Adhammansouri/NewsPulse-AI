// One field's word diff: removed runs in `<del class="d">`, added runs in `<ins class="d">` (npx.css), line breaks
// kept as the draft keeps them (`<br>`). A removal followed by its replacement is spaced as NewDiff spaces them.
import { Fragment } from "react";
import type { DiffPart } from "./diffModel";

function Lines({ text }: { text: string }) {
  return (
    <>
      {text.split("\n").map((line, index) => (
        <Fragment key={index}>
          {index > 0 && <br />}
          {line}
        </Fragment>
      ))}
    </>
  );
}

export function DiffText({ parts }: { parts: readonly DiffPart[] }) {
  return (
    <>
      {parts.map((part, index) => {
        if (part.kind === "same") return <Lines key={index} text={part.text} />;
        const Tag = part.kind === "del" ? "del" : "ins";
        const spaced = part.kind === "ins" && parts[index - 1]?.kind === "del";
        return (
          <Fragment key={index}>
            {spaced && " "}
            <Tag className="d">
              <Lines text={part.text} />
            </Tag>
          </Fragment>
        );
      })}
    </>
  );
}
