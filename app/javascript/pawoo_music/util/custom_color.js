import { Map as ImmutableMap } from 'immutable';
import { constructRgbCode } from './musicvideo';

function convertCustomColor(key, value) {
  return `--${key}:${constructRgbCode(value, 1)};`;
}

function convertCustomColors(customColor) {
  if (customColor instanceof ImmutableMap) {
    return customColor.entrySeq().map(([key, value]) => convertCustomColor(key, value));
  }

  return Object.keys(customColor).map((key) => {
    const value = customColor[key];
    return convertCustomColor(key, value);
  });
}

export function createCustomColorStyle(customColor, styleId) {
  const customStyles = convertCustomColors(customColor);
  const css = `body {${customStyles.join('')}}`;

  const style = document.createElement('style');

  style.type = 'text/css';
  style.id = styleId;

  if (style.styleSheet){
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }

  return style;
}
