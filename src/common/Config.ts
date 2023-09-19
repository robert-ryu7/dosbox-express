import { N } from "./constants";

export class CategoryValue {
  private _settings: Map<string, string>;

  constructor(private _comments: string = "", _settings: Iterable<readonly [string, string]> = []) {
    this._settings = new Map(_settings);
  }

  clone = (): CategoryValue => {
    const clone = new CategoryValue();
    clone._comments = this._comments;
    clone._settings = new Map(this._settings);

    return clone;
  };

  get comments() {
    return this._comments;
  }

  get keys() {
    return Array.from(this._settings.keys());
  }

  get entries() {
    return Array.from(this._settings.entries());
  }

  getSetting(key: string): string | undefined {
    return this._settings.get(key);
  }

  setSetting(key: string, value: string): boolean {
    const created = !this._settings.has(key);
    this._settings.set(key, value);
    return created;
  }

  deleteSetting(key: string): boolean {
    return this._settings.delete(key);
  }

  getComments(): string {
    return this._comments;
  }

  setComments(value: string) {
    this._comments = value;
  }

  appendComments(value: string) {
    this._comments += value;
  }

  isEmpty(strict: boolean): boolean {
    const hasTruthyComments = Boolean(this._comments);
    let hasSettings = false;
    if (strict) {
      for (const setting of this._settings.values()) {
        if (Boolean(setting)) {
          hasSettings = true;
          continue;
        }
      }
    } else {
      hasSettings = this._settings.size > 0;
    }

    return !hasTruthyComments && !hasSettings;
  }
}

class Config {
  private _categories: Map<string, CategoryValue>;

  constructor(
    private _comments: string = "",
    private _autoexec: string = "",
    _categories: Iterable<readonly [string, CategoryValue]> = []
  ) {
    this._categories = new Map(_categories);
  }

  clone = (): Config =>
    new Config(
      this._comments,
      this._autoexec,
      new Map(Array.from(this._categories.entries()).map(([key, value]) => [key, value.clone()]))
    );

  static parse(text: string): Config {
    const lines = text.replaceAll("\r\n", N).split(N);
    let categoryKey = "";
    let comments = "";
    let autoexec: string[] = [];
    const categories: Map<string, CategoryValue> = new Map();
    for (const line of lines) {
      if (line.startsWith("[") && line.endsWith("]")) {
        categoryKey = line.slice(1, -1);
      } else if (categoryKey === "autoexec") {
        autoexec.push(line);
      } else if (line.startsWith("#")) {
        if (categoryKey) {
          let category = categories.get(categoryKey);
          if (!category) categories.set(categoryKey, (category = new CategoryValue()));
          category.appendComments((category.comments ? N : "") + line.slice(1));
        } else {
          comments += (comments ? N : "") + line.slice(1);
        }
      } else if (line !== "") {
        if (categoryKey) {
          let category = categories.get(categoryKey);
          if (!category) categories.set(categoryKey, (category = new CategoryValue()));
          const [settingKey, settingValue] = line.split("=").map((part) => part.trim());
          category.setSetting(settingKey, settingValue);
        }
      }
    }

    return new Config(comments, autoexec.join(N), categories);
  }

  static stringify(config: Config, options: { allowEmpty: "none" | "settings" | "all" }): string {
    let result = "";

    if (config.comments) {
      result += config.comments
        .split(N)
        .map((line) => `#${line}`)
        .join(N);
      result += N + N;
    }

    for (const categoryKey of config.keys) {
      if (options.allowEmpty !== "all" && config.isCategoryEmpty(categoryKey, options.allowEmpty === "none")) continue;

      const categoryComments = config.getCategoryComments(categoryKey);
      const categoryEntries = config.getCategoryEntries(categoryKey);

      result += `[${categoryKey}]` + N;

      if (categoryComments) {
        result += categoryComments
          .split(N)
          .map((line) => `#${line}`)
          .join(N);
        result += N + N;
      }

      if (categoryEntries) {
        const padding = categoryEntries.reduce((acc, [key]) => Math.max(acc, key.length), 0);
        for (const [key, value] of categoryEntries) {
          result += `${key.padEnd(padding)} = ${value}` + N;
        }
      }

      result += N;
    }

    result += "[autoexec]" + N;
    result += config.autoexec;

    return result.replaceAll(N, "\r\n");
  }

  get comments() {
    return this._comments;
  }

  set comments(value: string) {
    this._comments = value;
  }

  get autoexec() {
    return this._autoexec;
  }

  set autoexec(value: string) {
    this._autoexec = value;
  }

  get keys() {
    return Array.from(this._categories.keys());
  }

  getCategoryKeys(categoryKey: string): string[] | undefined {
    return this._categories.get(categoryKey)?.keys;
  }

  getCategoryEntries(categoryKey: string): [string, string][] | undefined {
    return this._categories.get(categoryKey)?.entries;
  }

  getCategorySetting(categoryKey: string, settingKey: string): string | undefined {
    return this._categories.get(categoryKey)?.getSetting(settingKey);
  }

  setCategorySetting(categoryKey: string, settingKey: string, value: string): boolean {
    let category = this._categories.get(categoryKey);
    if (!category) this._categories.set(categoryKey, (category = new CategoryValue()));
    return category.setSetting(settingKey, value);
  }

  getCategoryComments(categoryKey: string): string | undefined {
    return this._categories.get(categoryKey)?.comments;
  }

  setCategoryComments(categoryKey: string, value: string): void {
    let category = this._categories.get(categoryKey);
    if (!category) this._categories.set(categoryKey, (category = new CategoryValue()));
    category.setComments(value);
  }

  deleteCategorySetting(categoryKey: string, settingKey: string): boolean {
    return this._categories.get(categoryKey)?.deleteSetting(settingKey) ?? false;
  }

  setCategory(categoryKey: string): boolean {
    const created = !this._categories.has(categoryKey);
    this._categories.set(categoryKey, new CategoryValue());
    return created;
  }

  deleteCategory(categoryKey: string): boolean {
    return this._categories.delete(categoryKey);
  }

  isCategoryEmpty(categoryKey: string, strict: boolean): boolean {
    return this._categories.get(categoryKey)?.isEmpty(strict) ?? true;
  }
}

export default Config;
