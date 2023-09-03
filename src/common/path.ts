const pathnameParts = window.location.pathname.split("/").slice(1);
const PATH: { 0: string } & Record<number, string> = { 0: "" };
let level = 0;
while (true) {
  const part = pathnameParts.shift();
  if (part === undefined) break;
  PATH[level] = part;
  level++;
}

export { PATH };
