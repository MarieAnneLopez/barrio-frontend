// Colores escritos en una hoja de estilo, para comprobar la paleta (tokens.test.ts). Devuelve cada hex
// (3, 4, 6 u 8 cifras), cada rgb() y los nombres white y black como hex de 6 cifras, sin la
// transparencia. Lo que no traduce (hsl(), oklch()… y los demás nombres de color) lo devuelve tal
// cual, para que la prueba lo rechace. Solo mira valores de propiedades que llevan color.

const COLOR_PROPS =
  /^(--.+|color|background(-color|-image)?|border(-(top|right|bottom|left|block|inline)(-start|-end)?)?(-color)?|outline(-color)?|box-shadow|text-shadow|text-decoration(-color)?|caret-color|accent-color|column-rule(-color)?|fill|stroke|stop-color|flood-color|filter|scrollbar-color)$/;

const NAMED = new Set(
  ('aliceblue antiquewhite aqua aquamarine azure beige bisque blanchedalmond blue blueviolet brown burlywood cadetblue chartreuse chocolate coral '
    + 'cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen '
    + 'darkorange darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink '
    + 'deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green '
    + 'greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral '
    + 'lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray '
    + 'lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple '
    + 'mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite '
    + 'navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink '
    + 'plum powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue '
    + 'slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat whitesmoke yellow yellowgreen').split(' '),
);
const NAMED_HEX: Record<string, string> = { white: 'ffffff', black: '000000' };

const TOKEN = /#([0-9a-f]{3,8})\b|\brgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)|\b(hsla?|hwb|lab|lch|oklab|oklch|color)\(|\b([a-z]+)\b/gi;

function hex(digits: string): string {
  const six = digits.length <= 4 ? [...digits.slice(0, 3)].map((d) => d + d).join('') : digits.slice(0, 6);
  return six.toLowerCase();
}

export function colorsIn(css: string): string[] {
  const found: string[] = [];
  const body = css.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const [, prop = '', raw = ''] of body.matchAll(/([-a-z]+)\s*:\s*([^;{}]+)/gi)) {
    if (!COLOR_PROPS.test(prop.toLowerCase())) continue;
    const value = raw.replace(/var\(--[\w-]+/g, 'var(').replace(/url\([^)]*\)/g, '');
    for (const [, digits, r, g, b, fn, word] of value.matchAll(TOKEN)) {
      if (digits && [3, 4, 6, 8].includes(digits.length)) found.push(hex(digits));
      else if (r && g && b) found.push([r, g, b].map((v) => Number(v).toString(16).padStart(2, '0')).join(''));
      else if (fn) found.push(`${fn.toLowerCase()}(`);
      else if (word && NAMED_HEX[word.toLowerCase()]) found.push(NAMED_HEX[word.toLowerCase()] as string);
      else if (word && NAMED.has(word.toLowerCase())) found.push(word.toLowerCase());
    }
  }
  return found;
}
