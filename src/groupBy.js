import { ExplorableGraph, extendValueKeyFn } from "@graphorigami/origami";

export default async function groupBy(variant, groupFn) {
  if (variant === undefined) {
    return undefined;
  }
  const graph = await ExplorableGraph.from(variant);
  const extendedGroupFn = extendValueKeyFn(groupFn);

  const result = {};
  for (const key of await graph.keys()) {
    const value = await graph.get(key);
    let groups = await extendedGroupFn.call(this, value, key);
    let groupsArray;
    if (
      typeof groups === "string" ||
      typeof groups === "number" ||
      typeof groups === "boolean" ||
      typeof groups === "symbol"
    ) {
      // A single value was returned
      groupsArray = [groups];
    } else {
      groupsArray = await ExplorableGraph.values(groups);
    }
    for (const group of groupsArray) {
      if (!result[group]) {
        result[group] = [];
      }
      result[group].push(value);
    }
  }
  return result;
}
