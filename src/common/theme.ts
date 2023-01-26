import tinycolor from "tinycolor2";

interface ColorShades {
  base: string;
  [key: string]: string;
}

export const getShades = <T extends ColorShades, K extends keyof T>(baseColor: string, model: T): Record<K, string> => {
  const base = tinycolor(baseColor).toRgb();
  const modelBase = tinycolor(model.base).toRgb();

  return Object.entries(model).reduce((acc, [key, value]) => {
    const color = tinycolor(value).toRgb();
    const k = key as K;
    acc[k] = tinycolor({
      r: base.r - (modelBase.r - color.r),
      g: base.g - (modelBase.g - color.g),
      b: base.b - (modelBase.b - color.b),
    }).toHexString();

    return acc;
  }, {} as Record<K, string>);
};

export const normalizeColor = (color: string) => tinycolor(color).toHexString();

export const getContrast = (color: string) => tinycolor.mostReadable(color, ["#fff", "#000"]).toHexString();

export const DEFAULT_PRIMARY_SHADES = {
  base: getComputedStyle(document.documentElement).getPropertyValue("--color-primary").trim(),
  bright: getComputedStyle(document.documentElement).getPropertyValue("--color-primary-bright").trim(),
  dark: getComputedStyle(document.documentElement).getPropertyValue("--color-primary-dark").trim(),
  darker: getComputedStyle(document.documentElement).getPropertyValue("--color-primary-darker").trim(),
};

export const DEFAULT_BUTTON_SHADES = {
  base: getComputedStyle(document.documentElement).getPropertyValue("--color-button").trim(),
  bright: getComputedStyle(document.documentElement).getPropertyValue("--color-button-bright").trim(),
  dark: getComputedStyle(document.documentElement).getPropertyValue("--color-button-dark").trim(),
  darker: getComputedStyle(document.documentElement).getPropertyValue("--color-button-darker").trim(),
  disabled: getComputedStyle(document.documentElement).getPropertyValue("--color-button-disabled").trim(),
  disabledBright: getComputedStyle(document.documentElement).getPropertyValue("--color-button-disabled-bright").trim(),
  disabledDark: getComputedStyle(document.documentElement).getPropertyValue("--color-button-disabled-dark").trim(),
  disabledDarker: getComputedStyle(document.documentElement).getPropertyValue("--color-button-disabled-darker").trim(),
};

export const DEFAULT_SCROLLBAR_COLOR = getComputedStyle(document.documentElement)
  .getPropertyValue("--color-scrollbar")
  .trim();

export const DEFAULT_BACK_COLOR = getComputedStyle(document.documentElement).getPropertyValue("--color-back").trim();
export const DEFAULT_BACK_BRIGHT_COLOR = getComputedStyle(document.documentElement)
  .getPropertyValue("--color-back-bright")
  .trim();
export const DEFAULT_BACK_BRIGHTER_COLOR = getComputedStyle(document.documentElement)
  .getPropertyValue("--color-back-brighter")
  .trim();
export const DEFAULT_FRONT_COLOR = getComputedStyle(document.documentElement).getPropertyValue("--color-front").trim();
export const DEFAULT_FRONT_ALT_COLOR = getComputedStyle(document.documentElement)
  .getPropertyValue("--color-front-alt")
  .trim();
export const DEFAULT_INPUT_PLACEHOLDER_COLOR = getComputedStyle(document.documentElement)
  .getPropertyValue("--color-input-placeholder")
  .trim();
export const DEFAULT_INPUT_DISABLED_BG_COLOR = getComputedStyle(document.documentElement)
  .getPropertyValue("--color-input-disabled-bg")
  .trim();
