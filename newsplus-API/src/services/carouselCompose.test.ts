import assert from "node:assert/strict";
import { test } from "node:test";
import { createCanvas } from "@napi-rs/canvas";
import { composeCarouselPoster } from "./carouselCompose.js";

test("compose sets the Arabic headline on a 4:5 poster", async () => {
  const photo = createCanvas(64, 80);
  const ctx = photo.getContext("2d");
  ctx.fillStyle = "#143028";
  ctx.fillRect(0, 0, 64, 80);
  const png = await composeCarouselPoster({
    photo: photo.toBuffer("image/png"),
    style: "cinematic",
    density: "banner",
    mark: true,
    slide: {
      headline: "حسام يواجه انتقادات بعد التعادل أمام أنغولا",
      banner: "مدرب مصر تحت الضغط",
      attribution: "",
      scene: "A coach on a night pitch.",
    },
  });

  assert.equal(png.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  assert.ok(png.length > 5_000);
});
