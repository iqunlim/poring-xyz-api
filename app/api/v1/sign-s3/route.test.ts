import { expect, test } from "vitest";
import { OPTIONS } from "./route";
import { checkExcludedTypes, checkFileExtension } from "./validators";

test("Route Accepts this specific file type", () => {
  expect(checkExcludedTypes("application/zip")).toBe(true);
});

test("Route accepts things", () => {
  expect(checkFileExtension("dk64.apworld")).toBe(true);
});

test("Default accept, should pass", () => {
  expect(checkFileExtension("image.png")).toBe(true);
});

test("Fail condition extension", () => {
  expect(checkFileExtension("boop.exe")).toBe(false);
});

test("Route accepts yaml", () => {
  expect(checkExcludedTypes("application/yaml")).toBe(true);
});

test("Route accepts yaml", () => {
  expect(checkExcludedTypes("application/yaml")).toBe(true);
});
