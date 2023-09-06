import { Config } from "../types";
import stringifyConfig from "./stringifyConfig";

it("correctly stringifies typical config", () => {
  const config: Config = {
    comments: "This is a top level comment.\nThis is another line...",
    categories: {
      cat1: {
        comments: "This is cat1 comment.\nThis is another line...",
        settings: { set1: "set1 value", set2: "set2 value" },
      },
      cat2: {
        comments: "This is cat2 comment.\nThis is another line...",
        settings: { set1: "set1 value", set2: "set2 value" },
      },
    },
    autoexec: "cmd1\ncmd2",
  };

  const result = stringifyConfig(config);

  expect(result).toMatchSnapshot();
});

it("stringifies settings with empty values", () => {
  const config: Config = {
    comments: "",
    categories: {
      cat: {
        comments: "",
        settings: { set1: "", set2: "" },
      },
    },
    autoexec: "",
  };

  const result = stringifyConfig(config);

  expect(result).toMatchSnapshot();
});

it("does not stringify empty categories", () => {
  const config: Config = { comments: "", categories: { foo: { comments: "", settings: {} } }, autoexec: "" };

  const result = stringifyConfig(config);

  expect(result).toMatchSnapshot();
});
