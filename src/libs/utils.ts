import { isRef, toRaw, toValue } from "vue";
import { isObject } from "@vueuse/core";

const stringToIdentifier = (str: string): string => {
  let identifier = str.replace(/[^a-zA-Z0-9_$]/g, "").replace(/^_+|_+$/g, "");

  if (/^[0-9]/.test(identifier)) {
    identifier = "_" + identifier;
  }

  if (!identifier) {
    return "_default";
  }

  return identifier;
};

function deepUnref(val: unknown): unknown {
  const checkedVal = toValue(val);
  if (Array.isArray(checkedVal)) {
    return unrefArray(checkedVal);
  }
  if (!isObject(checkedVal)) {
    return checkedVal;
  }
  return unrefObject(checkedVal as Record<string, unknown>);
}

function smartUnref(val: unknown): unknown {
  if (val !== null && !isRef(val) && typeof val === "object")
    return deepUnref(val);
  return toRaw(toValue(val));
}

function unrefArray(arr: unknown[]): unknown[] {
  return arr.map(smartUnref);
}

function unrefObject(obj: Record<string, unknown>): Record<string, unknown> {
  const unreffed: Record<string, unknown> = {};
  Object.keys(obj).forEach(key => {
    unreffed[key] = smartUnref(obj[key]);
  });
  return unreffed;
}

export { deepUnref, stringToIdentifier };
