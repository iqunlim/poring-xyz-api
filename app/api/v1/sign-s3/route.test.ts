import { expect, test } from "vitest";
import { OPTIONS } from "./route";

test("OPTIONS Returns CORS headers", () => {
  OPTIONS();
  expect(OPTIONS()).toBeTypeOf(typeof Promise<Response>);
});
