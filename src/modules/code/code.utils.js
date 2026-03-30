const OT_TYPES = {
  RETAIN: "retain",
  INSERT: "insert",
  DELETE: "delete",
};

const isRetain = (c) => typeof c === "number" && c > 0;
const isInsert = (c) => typeof c === "string";
const isDelete = (c) => typeof c === "number" && c < 0;

const opLength = (op) => {
  return op.reduce((len, c) => {
    if (isRetain(c)) return len + c;
    if (isDelete(c)) return len + Math.abs(c);
    return len;
  }, 0);
};

const insertLength = (op) =>
  op.reduce((len, c) => (isInsert(c) ? len + c.length : len), 0);

const apply = (doc, op) => {
  let result = "";
  let index = 0;

  for (const component of op) {
    if (isRetain(component)) {
      result += doc.slice(index, index + component);
      index += component;
    } else if (isInsert(component)) {
      result += component;
    } else if (isDelete(component)) {
      index += Math.abs(component);
    }
  }

  result += doc.slice(index);
  return result;
};

const compose = (op1, op2) => {
  const result = [];

  const q1 = expandOp(op1);
  const q2 = expandOp(op2);

  let i = 0;
  let j = 0;

  while (j < q2.length) {
    const [type2, val2] = q2[j];

    if (type2 === "insert") {
      result.push(val2);
      j++;
      continue;
    }

    let remaining = val2;

    while (remaining > 0) {
      if (i >= q1.length) {
        if (type2 === "retain") result.push(remaining);
        else result.push(-remaining);
        remaining = 0;
        break;
      }

      const [type1, val1] = q1[i];

      if (type1 === "insert") {
        if (type2 === "retain") {
          result.push(val1);
        }

        i++;
        remaining -= val1.length;
        if (remaining < 0) {
          q1[i - 1] = ["insert", val1.slice(val1.length + remaining)];
          i--;
          remaining = 0;
        }
        continue;
      }

      const take = Math.min(remaining, val1);

      if (type1 === "retain" && type2 === "retain") {
        result.push(take);
      } else if (type1 === "retain" && type2 === "delete") {
        result.push(-take);
      } else if (type1 === "delete") {
        result.push(-take);
      }

      remaining -= take;

      if (take < val1) {
        q1[i] = [type1, val1 - take];
      } else {
        i++;
      }
    }
    j++;
  }

  while (i < q1.length) {
    const [type1, val1] = q1[i];
    if (type1 === "insert") result.push(val1);
    else if (type1 === "retain") result.push(val1);
    else result.push(-val1);
    i++;
  }

  return normalize(result);
};

const expandOp = (op) => {
  return op.map((c) => {
    if (isInsert(c)) return ["insert", c];
    if (isRetain(c)) return ["retain", c];
    return ["delete", Math.abs(c)];
  });
};

const transform = (op1, op2, priority = "left") => {
  const result1 = [];
  const result2 = [];

  let i = 0;
  let j = 0;

  while (i < op1.length || j < op2.length) {
    const c1 = op1[i];
    const c2 = op2[j];

    if (
      i < op1.length &&
      isInsert(c1) &&
      (j >= op2.length || !isInsert(c2) || priority === "left")
    ) {
      result1.push(c1);
      result2.push(c1.length);
      i++;
      continue;
    }

    if (j < op2.length && isInsert(c2)) {
      result1.push(c2.length);
      result2.push(c2);
      j++;
      continue;
    }

    const c1Len = i < op1.length ? (isRetain(c1) ? c1 : Math.abs(c1)) : 0;
    const c2Len = j < op2.length ? (isRetain(c2) ? c2 : Math.abs(c2)) : 0;
    const minLen = Math.min(c1Len || Infinity, c2Len || Infinity);

    if (i >= op1.length) {
      result1.push(isRetain(c2) ? c2Len : 0);
      result2.push(c2);
      j++;
      continue;
    }

    if (j >= op2.length) {
      result1.push(c1);
      result2.push(isRetain(c1) ? c1Len : 0);
      i++;
      continue;
    }

    const take = Math.min(c1Len, c2Len);

    if (isRetain(c1) && isRetain(c2)) {
      result1.push(take);
      result2.push(take);
    } else if (isRetain(c1) && isDelete(c2)) {
      result2.push(-take);
    } else if (isDelete(c1) && isRetain(c2)) {
      result1.push(-take);
    } else if (isDelete(c1) && isDelete(c2)) {
    }

    if (take < c1Len) {
      op1[i] = isRetain(c1) ? c1Len - take : -(c1Len - take);
    } else {
      i++;
    }

    if (take < c2Len) {
      op2[j] = isRetain(c2) ? c2Len - take : -(c2Len - take);
    } else {
      j++;
    }
  }

  return [normalize(result1), normalize(result2)];
};

const invert = (op, doc) => {
  const result = [];
  let index = 0;

  for (const component of op) {
    if (isRetain(component)) {
      result.push(component);
      index += component;
    } else if (isInsert(component)) {
      result.push(-component.length);
    } else if (isDelete(component)) {
      const len = Math.abs(component);
      result.push(doc.slice(index, index + len));
      index += len;
    }
  }

  return result;
};

const normalize = (op) => {
  const result = [];
  for (const c of op) {
    if (c === 0 || c === "") continue;
    const last = result[result.length - 1];
    if (
      last !== undefined &&
      typeof last === typeof c &&
      isRetain(last) &&
      isRetain(c)
    ) {
      result[result.length - 1] = last + c;
    } else if (last !== undefined && isDelete(last) && isDelete(c)) {
      result[result.length - 1] = last + c;
    } else if (last !== undefined && isInsert(last) && isInsert(c)) {
      result[result.length - 1] = last + c;
    } else {
      result.push(c);
    }
  }
  return result;
};

const validate = (op, doc) => {
  const expectedLen = opLength(op);
  if (expectedLen !== doc.length) {
    throw new Error(
      `Operation length mismatch: op expects ${expectedLen} chars but doc has ${doc.length} chars`,
    );
  }
  return true;
};

export {
  apply,
  compose,
  transform,
  invert,
  normalize,
  validate,
  opLength,
  insertLength,
  isRetain,
  isInsert,
  isDelete,
};
