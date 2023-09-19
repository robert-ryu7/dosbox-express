import Config, { CategoryValue } from "./Config";

describe("clone", () => {
  it("provides a deep clone", () => {
    const config = new Config("COMMENT", "AUTOEXEC", [
      [
        "CAT1",
        new CategoryValue("CAT1_COMMENTS", [
          ["CAT1_SET1", "CAT1_SET1_VALUE"],
          ["CAT1_SET2", "CAT1_SET2_VALUE"],
        ]),
      ],
      [
        "CAT2",
        new CategoryValue("CAT2_COMMENTS", [
          ["CAT2_SET1", "CAT2_SET1_VALUE"],
          ["CAT2_SET2", "CAT2_SET2_VALUE"],
        ]),
      ],
    ]);

    const clone = config.clone();

    expect(clone).not.toBe(config);
    // @ts-ignore
    expect(clone._categories).not.toBe(config._categories);
    // @ts-ignore
    clone.keys.forEach((categoryKey) => {
      // @ts-ignore
      expect(clone._categories.get(categoryKey)).not.toBe(config._categories.get(categoryKey));
      // @ts-ignore
      expect(clone._categories.get(categoryKey)._settings).not.toBe(config._categories.get(categoryKey)._settings);
    });
  });
});

describe("isCategoryEmpty", () => {
  it("returns false if category contains any settings, even with empty strings", () => {
    const config = new Config("", "", [
      [
        "cat1",
        new CategoryValue("", [
          ["set1", ""],
          ["set2", ""],
        ]),
      ],
    ]);

    expect(config.isCategoryEmpty("cat1", false)).toBe(false);
  });

  it("returns true if category contains no settings", () => {
    const config = new Config("", "", [["cat1", new CategoryValue("", [])]]);

    expect(config.isCategoryEmpty("cat1", false)).toBe(true);
  });

  it("returns false if category contains comments regardless of having settings or not", () => {
    const config = new Config("", "", [["cat1", new CategoryValue("COMMENT", [])]]);

    expect(config.isCategoryEmpty("cat1", false)).toBe(false);
  });
});

describe("isCategoryEmpty (strict mode)", () => {
  it("returns true if category holds no truthy values", () => {
    const config = new Config("", "", [
      [
        "cat1",
        new CategoryValue("", [
          ["set1", ""],
          ["set2", ""],
        ]),
      ],
      ["cat2", new CategoryValue("", [])],
    ]);

    expect(config.isCategoryEmpty("cat1", true)).toBe(true);
    expect(config.isCategoryEmpty("cat2", true)).toBe(true);
  });

  it("returns false if category holds any truthy values", () => {
    const config = new Config("", "", [
      [
        "cat1",
        new CategoryValue("", [
          ["set1", ""],
          ["set2", "VALUE"],
        ]),
      ],
      [
        "cat2",
        new CategoryValue("COMMENT", [
          ["set1", ""],
          ["set2", ""],
        ]),
      ],
      ["cat3", new CategoryValue("COMMENT", [])],
    ]);

    expect(config.isCategoryEmpty("cat1", true)).toBe(false);
    expect(config.isCategoryEmpty("cat2", true)).toBe(false);
    expect(config.isCategoryEmpty("cat3", true)).toBe(false);
  });
});

describe("Config.stringify", () => {
  it("correctly stringifies typical config", () => {
    const config = new Config("This is a top level comment.\nThis is another line...", "cmd1\ncmd2", [
      [
        "cat1",
        new CategoryValue("This is cat1 comment.\nThis is another line...", [
          ["set1", "set1 value"],
          ["set2", "set2 value"],
        ]),
      ],
      [
        "cat2",
        new CategoryValue("This is cat2 comment.\nThis is another line...", [
          ["set1", "set1 value"],
          ["set2", "set2 value"],
        ]),
      ],
    ]);

    const result = Config.stringify(config, { allowEmpty: "none" });

    expect(result).toMatchSnapshot();
  });

  it("stringifies empty categories correctly", () => {
    const config = new Config("", "", [["foo", new CategoryValue("", [])]]);

    expect(Config.stringify(config, { allowEmpty: "none" })).toMatchSnapshot();
    expect(Config.stringify(config, { allowEmpty: "settings" })).toMatchSnapshot();
    expect(Config.stringify(config, { allowEmpty: "all" })).toMatchSnapshot();
  });

  it("stringifies settings with empty values correctly", () => {
    const config = new Config("", "", [
      [
        "cat",
        new CategoryValue("", [
          ["set1", ""],
          ["set2", ""],
        ]),
      ],
    ]);

    expect(Config.stringify(config, { allowEmpty: "none" })).toMatchSnapshot();
    expect(Config.stringify(config, { allowEmpty: "settings" })).toMatchSnapshot();
    expect(Config.stringify(config, { allowEmpty: "all" })).toMatchSnapshot();
  });
});
