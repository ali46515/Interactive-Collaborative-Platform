import {
  apply,
  validate,
  normalize,
  compose,
  invert,
  transform,
} from "../../src/modules/code/code.utils.js";

describe("OT - apply()", () => {
  test("retain keeps characters", () => {
    expect(apply("hello", [5])).toBe("hello");
  });

  test("insert adds characters at position", () => {
    expect(apply("hello", [5, " world"])).toBe("hello world");
  });

  test("delete removes characters", () => {
    expect(apply("hello world", [5, -6])).toBe("hello");
  });

  test("insert at beginning", () => {
    expect(apply("world", ["hello "])).toBe("hello world");
  });

  test("complex op: retain + insert + delete", () => {
    expect(apply("hello world", [6, "beautiful ", -5])).toBe(
      "hello beautiful ",
    );
  });

  test("empty document insert", () => {
    expect(apply("", ["hello"])).toBe("hello");
  });

  test("delete all", () => {
    expect(apply("hello", [-5])).toBe("");
  });
});

describe("OT - transform()", () => {
  test("two concurrent inserts at different positions", () => {
    const doc = "ac";

    const opA = [1, "b", 1];

    const opB = [2, "d"];

    const [opA2, opB2] = transform(
      JSON.parse(JSON.stringify(opA)),
      JSON.parse(JSON.stringify(opB)),
      "left",
    );

    const viaA = apply(apply(doc, opA), opB2);
    const viaB = apply(apply(doc, opB), opA2);

    expect(viaA).toBe(viaB);

    expect(viaA).toBe("abcd");
  });

  test("concurrent insert and delete on same region", () => {
    const doc = "hello world";

    const opA = [6, -5];

    const opB = [11, "!"];

    const [opA2, opB2] = transform(
      JSON.parse(JSON.stringify(opA)),
      JSON.parse(JSON.stringify(opB)),
      "left",
    );

    const viaA = apply(apply(doc, opA), opB2);
    const viaB = apply(apply(doc, opB), opA2);

    expect(viaA).toBe(viaB);
  });

  test("two concurrent deletes on same characters", () => {
    const doc = "abc";
    const opA = [1, -1, 1];
    const opB = [1, -1, 1];

    const [opA2, opB2] = transform(
      JSON.parse(JSON.stringify(opA)),
      JSON.parse(JSON.stringify(opB)),
      "left",
    );

    const viaA = apply(apply(doc, opA), opB2);
    const viaB = apply(apply(doc, opB), opA2);

    expect(viaA).toBe(viaB);
    expect(viaA).toBe("ac");
  });

  test("priority left: concurrent inserts at same position", () => {
    const doc = "ab";
    const opA = [1, "X"];
    const opB = [1, "Y"];

    const [opA2, opB2] = transform(
      JSON.parse(JSON.stringify(opA)),
      JSON.parse(JSON.stringify(opB)),
      "left",
    );

    const viaA = apply(apply(doc, opA), opB2);
    const viaB = apply(apply(doc, opB), opA2);

    expect(viaA).toBe(viaB);

    expect(viaA).toBe("aXYb");
  });
});

describe("OT - compose()", () => {
  test("compose two inserts", () => {
    const op1 = ["hello"];
    const op2 = [5, " world"];
    const composed = compose(op1, op2);
    expect(apply("", composed)).toBe("hello world");
  });

  test("compose insert then delete", () => {
    const op1 = ["hello"];
    const op2 = [-3, 2];
    const composed = compose(op1, op2);
    expect(apply("", composed)).toBe("lo");
  });

  test("compose is associative: (A∘B)∘C = A∘(B∘C)", () => {
    const doc = "abc";
    const opA = [1, "X", 2];
    const opB = [4, -1];
    const opC = [3, "!"];

    const composed1 = compose(compose(opA, opB), opC);
    const composed2 = compose(opA, compose(opB, opC));

    expect(apply(doc, composed1)).toBe(apply(doc, composed2));
  });
});

describe("OT - invert()", () => {
  test("invert insert produces delete", () => {
    const doc = "hello";
    const op = [5, " world"];
    const newDoc = apply(doc, op);
    const inv = invert(op, newDoc);
    expect(apply(newDoc, inv)).toBe(doc);
  });

  test("invert delete produces insert", () => {
    const doc = "hello world";
    const op = [5, -6];
    const newDoc = apply(doc, op);

    const inv = invert(op, doc);
    expect(apply(newDoc, inv)).toBe(doc);
  });
});

describe("OT - normalize()", () => {
  test("merges adjacent retains", () => {
    expect(normalize([3, 2])).toEqual([5]);
  });

  test("merges adjacent inserts", () => {
    expect(normalize(["hello", " world"])).toEqual(["hello world"]);
  });

  test("merges adjacent deletes", () => {
    expect(normalize([-2, -3])).toEqual([-5]);
  });

  test("removes zero-length components", () => {
    expect(normalize([0, 5, "", -0])).toEqual([5]);
  });
});

describe("OT - validate()", () => {
  test("passes when op length matches doc", () => {
    expect(() => validate([5, " world"], "hello")).ntoThrow();
  });

  test("throws when op length mismatches doc", () => {
    expect(() => validate([10], "hello")).toThrow(/mismatch/);
  });
});
