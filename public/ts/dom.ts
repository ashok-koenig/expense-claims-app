/**
 * Finds the element matching `selector` under `root` and checks at runtime that it is a `type`
 * (e.g. HTMLInputElement), so callers get a correctly typed element without a cast.
 */
export function requireElement<T extends Element>(
  root: ParentNode,
  selector: string,
  type: abstract new (...args: never[]) => T,
): T {
  const element = root.querySelector(selector);
  if (!(element instanceof type)) {
    throw new Error(`Expected a ${type.name} matching "${selector}" in the page.`);
  }
  return element;
}
