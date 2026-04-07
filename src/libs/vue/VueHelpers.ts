/**
 * For checkboxes, if the value of the checkbox is true, add the "checked" property, otherwise add nothing.
 */
const checked = (value: boolean): string =>
  Handlebars.helpers["checked"](value) as string;

/**
 * For form inputs, if the value is false, add the "disabled" property, otherwise add nothing.
 */
const disabled = (value: boolean): string =>
  Handlebars.helpers["disabled"](value) as string;

/**
 * Concatenate a number of string terms into a single string.
 */
const concat = (...values: unknown[]): Handlebars.SafeString =>
  Handlebars.helpers["concat"](...values) as Handlebars.SafeString;

/**
 * Construct an editor element for rich text editing with TinyMCE or ProseMirror.
 */
const editor = (
  content: string,
  options?: Record<string, unknown>
): Handlebars.SafeString =>
  Handlebars.helpers["editor"](content, {
    hash: options
  }) as Handlebars.SafeString;

/**
 * A ternary expression that allows inserting A or B depending on the value of C.
 */
const ifThen = (criteria: boolean, ifTrue: string, ifFalse: string): string =>
  Handlebars.helpers["ifThen"](criteria, ifTrue, ifFalse) as string;

/**
 * Translate a provided string key by using the loaded dictionary of localization strings.
 */
const localize = (value: string, data: Record<string, unknown> = {}): string =>
  Handlebars.helpers["localize"](value, { hash: data }) as string;

/**
 * A string formatting helper to display a number with a certain fixed number of decimals and an explicit sign.
 */
const numberFormat = (
  value: number | string,
  options?: Record<string, unknown>
): Handlebars.SafeString =>
  Handlebars.helpers["numberFormat"](value, {
    hash: options
  }) as Handlebars.SafeString;

/**
 * Render a form input field of type number with value appropriately rounded to step size.
 */
const numberInput = (
  value: number,
  options?: Record<string, unknown>
): Handlebars.SafeString =>
  Handlebars.helpers["numberInput"](value, {
    hash: options
  }) as Handlebars.SafeString;

/**
 * A helper to create a set of radio checkbox input elements in a named set.
 */
const radioBoxes = (
  name: string,
  choices: Record<string, string>,
  options?: Record<string, unknown>
): Handlebars.SafeString =>
  Handlebars.helpers["radioBoxes"](name, choices, {
    hash: options
  }) as Handlebars.SafeString;

/**
 * Render a pair of inputs for selecting a value in a range.
 */
const rangePicker = (
  options?: Record<string, unknown>
): Handlebars.SafeString =>
  Handlebars.helpers["rangePicker"]({ hash: options }) as Handlebars.SafeString;

/**
 * A helper to create a set of <option> elements in a <select> block based on a provided dictionary.
 */
const selectOptions = (
  choices: Record<string, string> | Array<Record<string, unknown>>,
  options?: Record<string, unknown>
): Handlebars.SafeString =>
  Handlebars.helpers["selectOptions"](choices, {
    hash: options
  }) as Handlebars.SafeString;

/**
 * Express a timestamp as a relative string.
 */
const timeSince = (timeStamp: Date | string): string =>
  Handlebars.helpers["timeSince"](timeStamp) as string;

/**
 * Checks if two values are equal using Handlebars helpers.
 */
const eq = (v1: unknown, v2: unknown): boolean =>
  Handlebars.helpers["eq"](v1, v2) as boolean;

/**
 * Checks if two values are not equal using the Handlebars `ne` helper.
 */
const ne = (v1: unknown, v2: unknown): boolean =>
  Handlebars.helpers["ne"](v1, v2) as boolean;

/**
 * Compares two values and returns true if the first value is less than the second value.
 */
const lt = (v1: unknown, v2: unknown): boolean =>
  Handlebars.helpers["lt"](v1, v2) as boolean;

/**
 * Compares two values and returns true if the first value is greater than the second value.
 */
const gt = (v1: unknown, v2: unknown): boolean =>
  Handlebars.helpers["gt"](v1, v2) as boolean;

/**
 * Checks if the first value is less than or equal to the second value.
 */
const lte = (v1: unknown, v2: unknown): boolean =>
  Handlebars.helpers["lte"](v1, v2) as boolean;

/**
 * Checks if the first value is greater than or equal to the second value.
 */
const gte = (v1: unknown, v2: unknown): boolean =>
  Handlebars.helpers["gte"](v1, v2) as boolean;

/**
 * Returns the logical negation of the given predicate.
 */
const not = (pred: unknown): boolean =>
  Handlebars.helpers["not"](pred) as boolean;

/**
 * Returns the logical AND of all the arguments.
 */
const and = (...args: unknown[]): boolean =>
  Handlebars.helpers["and"](...args) as boolean;

/**
 * Returns the first truthy value from the provided arguments.
 */
const or = (...args: unknown[]): unknown => Handlebars.helpers["or"](...args);

export {
  checked,
  disabled,
  concat,
  editor,
  ifThen,
  localize,
  numberFormat,
  numberInput,
  radioBoxes,
  rangePicker,
  selectOptions,
  timeSince,
  eq,
  ne,
  lt,
  gt,
  lte,
  gte,
  not,
  and,
  or
};
