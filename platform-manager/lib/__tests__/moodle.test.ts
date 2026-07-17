import { describe, expect, it } from "vitest";
import { appendParam } from "../moodle";

function serialize(value: Parameters<typeof appendParam>[2], key = "value") {
  const form = new URLSearchParams();
  appendParam(form, key, value);
  return form;
}

describe("appendParam", () => {
  it("serializes booleans as 1/0, not the strings true/false", () => {
    // Regression test: Moodle's external API validation for PARAM_BOOL rejects the
    // strings "true"/"false" that a naive String(value) would produce, failing with
    // "Invalid external api parameter... the server was expecting bool type".
    expect(serialize(true).get("value")).toBe("1");
    expect(serialize(false).get("value")).toBe("0");
  });

  it("serializes strings and numbers as-is", () => {
    expect(serialize("hello").get("value")).toBe("hello");
    expect(serialize(42).get("value")).toBe("42");
    expect(serialize(0).get("value")).toBe("0");
  });

  it("omits null and undefined instead of sending empty params", () => {
    expect(serialize(null).has("value")).toBe(false);
    expect(serialize(undefined).has("value")).toBe(false);
  });

  it("serializes arrays with numeric index brackets", () => {
    const form = serialize([10, 20, 30], "ids");
    expect(form.get("ids[0]")).toBe("10");
    expect(form.get("ids[1]")).toBe("20");
    expect(form.get("ids[2]")).toBe("30");
  });

  it("serializes nested objects with bracket notation", () => {
    const form = serialize({ fullname: "Course 1", visible: true }, "courses[0]");
    expect(form.get("courses[0][fullname]")).toBe("Course 1");
    expect(form.get("courses[0][visible]")).toBe("1");
  });

  it("serializes arrays of objects the way Moodle expects for multi-record calls", () => {
    const form = new URLSearchParams();
    appendParam(form, "courses", [
      { fullname: "Course A", visible: false },
      { fullname: "Course B", visible: true },
    ]);

    expect(form.get("courses[0][fullname]")).toBe("Course A");
    expect(form.get("courses[0][visible]")).toBe("0");
    expect(form.get("courses[1][fullname]")).toBe("Course B");
    expect(form.get("courses[1][visible]")).toBe("1");
  });
});
