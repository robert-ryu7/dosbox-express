const shiftPath = (path: string[]): string[] => {
  const result = [...path];
  result.shift();
  return result;
};

const PATH = shiftPath(window.location.pathname.split("/"));

export { shiftPath, PATH };
