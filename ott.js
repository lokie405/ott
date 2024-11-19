const Ajv = require("ajv");
const beautify = require("json-beautify");

const frameStyles = {
  //   stylewe: [   "╠",  "╩", "╫", ],
  //   double : ['╔', /*201*/ '╗', /*187*/ '╚', /*200*/ '╝', /*188*/ '═', /*205*/ '║', /*186*/ '╦', /*203*/ '╩', /*202*/ '╣', /*185*/ '╠', /*204*/ '╬', /*206*/ '╧', /*207*/ '╤', /*209*/ '╢', /*182*/ '╟', /*198*/ '╫', /*215*/ '╪', /*215*/ '─', /*196*/ '│', /*179*/],
  //   double: ["═", "║", "╔", "╦", "╗", "╠", "╬", "╣", "╚", "╩", "╝", "╧", "╤", "╢", "╟", "╫", "╪", "─", "│"],
  //   single: ["┌", /*218*/ "┐", /*191*/ "└", /*192*/ "┘", /*217*/ "─", /*196*/ "│", /*179*/ "┬", /*194*/ "┴", /*193*/ "┤", /*180*/ "├", /*195*/ "┼" /*197*/],
};
//  A __B__ C __B__ D
//  E ****  F ****  E
//  G __H__ I __H__ J
//  K ++++  L ++++  K
//  M __N__ O __N__ P
//  K ++++  L ++++  K
//  Q __R__ S __R__ T
//            0    1    2    3    4    5    6    7    8    9    10   11   12   13   14   15   16   17   18   19
//            a    b    c    d    e    f    g    h    i    j    k    l    m    n    o    p    q    r    s    t   uvwxyz
let style = ["╔", "═", "╦", "╗", "║", "║", "╠", "═", "╩", "╣", "║", "│", "╟", "─", "┼", "╢", "╚", "═", "╧", "╝"];
const frame = {
  a: style[0],
  b: style[1],
  c: style[2],
  d: style[3],
  e: style[4],
  f: style[5],
  g: style[6],
  h: style[7],
  i: style[8],
  j: style[9],
  k: style[10],
  l: style[11],
  m: style[12],
  n: style[13],
  o: style[14],
  p: style[15],
  q: style[16],
  r: style[17],
  s: style[18],
  t: style[19],
};

// ╔════╦═════╦════════╦════╗
// ║    ║     ║        ║    ║
// ╠════╬═════╬════════╬════╣
// ║    │     │        │    ║
// ╟────┼─────┼────────┼────╢

// ╔════╦═════╦════════╦════╗
// ║    ║     ║        ║    ║
// ╠════╩═════╩════════╩════╣
// ║    │     │        │    ║
// ╟────┼─────┼────────┼────╢

// ╔════╦═════╦════════╦════╗
// ║    ║     ║        ║    ║
// ╠════╪═════╪════════╪════╣
// ║    │     │        │    ║
// ╟────┼─────┼────────┼────╢

// ╔════╦═════╦════════╦════╗
// ║    ║     ║        ║    ║
// ╠════╤═════╤════════╤════╣
// ║    │     │        │    ║
// ╟────┼─────┼────────┼────╢

// ╔════════════════════════╗
// ║    ║     ║        ║    ║
// ╠════════════════════════╣
// ║    │     │        │    ║
// ╟────────────────────────╢

// ┳ (U+2533) – Box Drawings Down Single and Horizontal Double
// ┱ (U+2531) – Box Drawings Down Double and Left Single
// ┼ (U+253C) – Box Drawings Light Vertical and Horizontal
// ╀ (U+2560) – Box Drawings Double Vertical and Single Horizontal
// ╂ (U+2562) – Box Drawings Double Vertical
// ╄ (U+2564) – Box Drawings Down Double and Horizontal
// ╆ (U+2566) – Box Drawings Double Vertical and Horizontal
// ╇ (U+2567) – Box Drawings Up Single and Double Horizontal
// ╋ (U+256B) – Box Drawings Double Vertical and Horizontal
// ╪ (U+256A) – Box Drawings Vertical Double and Horizontal Single
// ┲ (U+2532) – Box Drawings Down Double and Horizontal Single
// ╨ (U+2568) – Box Drawings Vertical Double and Horizontal
// style: [ "║", "═", "│", "─", "╔", "╦", "╗", "╠", "╬", "╣", "╚", "╩", "╝", "╧", "╟", "╫", "╢",],
// const frame = {
//   frameVertical : "║",
//   frameHorizontal : "═",
//   frameLeftTop : "╔",
//   frameLeftMiddle : "╠",
//   frameLeftBottom : "╚",
//   frameCenterTop : "╦",
//   frameCenterMiddle : "╬",
//   frameCenterBottom : "╩",
//   frameRightTop : "╗",
//   frameRightMiddle : "╣",
//   frameRightBottom : "╝",
//   frameLineLeft : "╟",
//   frameLineCenter : "┼",
//   frameLineRight : "╢",
//   frameLineTop : "╤",
//   frameLinBottom : "╧",
//   lineVertical : "│",
//   lineHorizontal : "─",
// }

const _schema = {
  type: "object",
  properties: {
    headers: {
      type: "array",
      items: { type: "string" },
    },
    frameStyle: {
      type: "string",
    },
    unsetTemplate: { type: "string" },
    limit: {
      type: "array",
      items: {
        anyOf: [{ type: "integer", minimum: 1 }, { type: "string" }, { type: "object", patternProperties: { ".*": { type: "integer" } } }],
      },
    },
  },
};

function go(arr, oSet = {}) {
  // FUNCTION:

  let oDef = {
    //: "$$" - all item
    //: "_$" - other item
    headers: ["*"], //: <array> with string item;
    frameStyle: "double", //: "double" | "single" (<string>)
    headersAlign: "left", //: "center" | "left" | "right"
    headersGravity: "top",
    limit: ["..."], //: "default" | <number> | {"header": <number>} | [3, , 3]
    alignedHor: "center", //: "center" | "left" | "right"
    alignedVer: "middle", //: "middle" | "top" | "bottom"
    unsetTemplate: "-", // TODO: if length of template more then row limit then cut template
  };

  // :: Fill oDef object. Prepare some field
  const o = (function () {
    Object.keys(oSet).forEach((key) => {
      oDef[key] = oSet[key];
    });

    const validLimit = [];
    for (let i = 0; i < oDef.limit.length; i++) {
      if (oDef.limit[i] === undefined) {
        validLimit.push("void");
      } else {
        validLimit.push(oDef.limit[i]);
      }
    }
    oDef.limit = validLimit;

    // :: Check is oDef valid
    const ajv = new Ajv();
    const validate = ajv.compile(_schema);
    const valid = validate(oDef);
    if (!valid) {
      throw new Error(`OTT___ValidError: ${JSON.stringify(validate.errors, null, 1)}`);
    }
    // :: Prepare object
    //_ headers
    const uniqueHeaders = [...new Set(arr.flatMap(Object.keys))]; //: array with unique header name from all obj
    if (oDef.headers[0] === "*") {
      oDef.headers = uniqueHeaders;
    }
    oDef.headers.forEach((el) => {
      if (el !== "_$" && !uniqueHeaders.includes(el)) {
        //: check for non-exists headers name
        throw new Error(`Error: "${el}" - no such header name. Use keyword "$$" - for all, "_$" - for other left`);
      }
      const otherIndex = oDef["headers"].indexOf("_$"); //: if setArray include _$ keyword
      const other = uniqueHeaders.filter((el) => oDef["headers"].indexOf(el) === -1);
      if (otherIndex > 0) oDef["headers"].splice(otherIndex, 1, ...other);
    });

    //_ limit
    //: Default limits
    const limitDef = new Array(oDef.headers.length); //: Default limit extends maximum length

    limitDef.fill(0);
    const leftOverLimit = limitDef.map((elem, ind) => ind); //: To set left over "..."
    arr.forEach((obj) => {
      oDef.headers.forEach((e, index) => {
        let max;
        if (obj[e] === undefined) {
          max = 0;
        } else if (Array.isArray(obj[e])) {
          max = Math.max(...obj[e].map((el) => el.length));
        } else {
          max = obj[e].toString().length;
        }
        limitDef[index] = Math.max(max, limitDef[index], e.length);
      });
    });
    //: Setting limits
    let limitSet = oDef.limit;
    oDef.limit = limitDef;
    limitSet.forEach((el, index) => {
      if (typeof el === "number") {
        oDef.limit[index] = el;
        leftOverLimit[index] = -1;
      } else if (typeof el === "string") {
        oDef.limit[index] = limitDef[index];
        leftOverLimit[index] = -1;
      } else if (Object.prototype.toString.call(el) === `[object Object]`) {
        const ind = oDef.headers.indexOf(Object.entries(el)[0][0]);
        const lim = Object.entries(el)[0][1];
        if (Object.entries(el)[0][0] === "...") {
          leftOverLimit.map((e, i) => {
            if (e > -1) oDef.limit[i] = lim;
          });
        } else {
          oDef.limit[ind] = lim;
          leftOverLimit[ind] = -1;
        }
      }
    });

    //_ row (private)
    oDef.maxRow = [];
    arr.forEach((el) => {
      oDef.maxRow.push(calculateMaxRows(el));
    });

    //_ style
    oDef.frameStyle = frameStyles[oDef.frameStyle];
    return oDef;
  })();

  // ['═  0', '║  1', '╔  2', '╦  3', '╗  4', '╠  5',
  //  '╬  6', '╣  7', '╚  8', '╩  9', '╝ 10', '╧ 11',
  //  '╤ 12', '╢ 13', '╟ 14', '╫ 15', '╪ 16', '─ 17', '│ 18']

  function breakString(element, lim) {
    let row = [];
    if (typeof element === "string") {
      for (let i = 0; i < element.length; i += lim) {
        row.push(element.substring(i, i + lim));
      }
    } else if (Array.isArray(element)) {
      element.forEach((el, ind) => {
        for (let i = 0; i < el.length; i += lim) {
          row.push(el.substring(i, i + lim));
        }
      });
    } else if (element === undefined) {
      row.push(o.unsetTemplate);
    }
    return row;
  }

  //::: FRAME
  function makeHeader(type) {
    let s = "";
    // const f = o.frameStyle;
    let row;
    // a___b__c___b__d
    // e HEAD e HEAD e
    // f___b__g___b__h
    // e TEXT p TEXT e
    // i___o__j___o__k
    // e TEXT p TEXT e
    // l___b__m___b__n

    // {
    //   0: "bLeftTop",
    //   1: "bHorizontal",
    //   2: "bCenterTop",
    //   3: "bRightTop",
    //   4: "bVertical",
    //   5: "bCross",
    //   6: "bRightMiddle",
    //   7: "tVertical",
    //   8: "bLeft_tMiddle",
    //   9: "tHorizontal",
    //   10: "tCross",
    //   11: "bRight_tMiddle",
    //   12: "bLeftBottom",
    //   13: "tMiddle_bBottom",
    //   14: "bRightBottom"
    // }
    // //: ╔ ║ ╠
    // let leftTop = style[0],
    //   leftMiddle = style[4],
    //   leftBottom = style[8];
    // //: ═ ╦ ╬
    // let bridgeTop = f[0],
    //   bridgeBottom = f[0];
    // // topCross = f[3],
    // // middleCross = f[6];
    // //: ╗ ╣ ╝
    // let rightTop = f[4],
    //   rightMiddle = f[7]
    //   // frameRightBottom = f[10];

    for (let k = -1; k < arr.length; k++) {
      if (k > -1) {
        bridgeTop = "";
        topCross = "";
        if (k === arr.length - 1) {
          // middleCross = f[9];
        }

        rightTop = "";

        leftTop = "";
        // leftBottom = k === arr.length - 1 ? f[8] : f[14];
      }
      if (k === arr.length - 1) {
        // rightMiddle = frameRightBottom;
      }

      if (k === -1) row = o.headers;
      else row = Object.values(arr[k]);

      row.forEach((name, index) => {
        //: break longest as limit string at short pieces
        const length = o.limit[index];
        row[index] = [];
        row[index] = breakString(name, length);
      });
      const maxRow = Math.max(...row.map((el) => el.length)) + 2;

      row.forEach((el, index) => {
        const diff = maxRow - 2 - el.length;

        if (o.headersGravity === "top") {
        } else if (o.headersGravity === "middle") {
          spacePre = diff % 2 === 0 ? diff / 2 : Math.ceil(diff / 2) - 1;
          spacePost = diff % 2 === 0 ? diff / 2 : Math.ceil(diff / 2);
          while (spacePre > 0) {
            el.unshift(" ".repeat(o.limit[index]));
            spacePre--;
          }
          while (spacePost > 0) {
            el.push(" ".repeat(o.limit[index]));
            spacePost--;
          }
        } else if (o.headersGravity === "bottom") {
          for (let i = diff; i > 0; i--) {
            el.unshift(" ".repeat(o.limit[index]));
          }
        }
      });

      for (let i = 0; i < maxRow; i++) {
        // i: horizontal line in row
        // k: number of row in table

        // ╔
        // ║
        // ╠
        let leftTop;
        let leftMiddle;
        let leftBottom;
        // ═╦═
        // Text
        // ═╩═
        let middleTop;
        let middleMiddle;
        let middleBottom;
        // ╗
        // ╣
        // ╝

        let rightTop;
        let rightMiddle;

        let columnLine;
        let columnLast = frame.e;
        let rowLine = "3";


        if (k === -1) {
          //: HEADER
          leftTop = frame.a;
          leftMiddle = frame.e;
          leftBottom = frame.g;
          columnLine = frame.e;
          rowLine = frame.h

          middleTop = frame.b;
          middleMiddle = frame.c;
          middleBottom = frame.i;

          rightTop = frame.d;
          rightMiddle = frame.h;
          rightMiddle = frame.j;
        } else if (k === 0) {
          //: FIRST ROW
          leftTop = "";
          leftBottom = frame.m;
          leftMiddle = frame.e;
          columnLine = frame.l;
          rowLine = frame.n

          middleTop = "";
          middleMiddle = "";
          middleBottom = frame.o;
          rightTop = "";
          rightMiddle = frame.p;
        } else if (k > 0 && k < arr.length - 1) {
          //: OTHER ROW
          leftTop = "";
          leftBottom = frame.m;
          leftMiddle = frame.k;
          columnLine = frame.l;
          rowLine = frame.n

          middleTop = "";
          middleMiddle = "";
          middleBottom = frame.o;

          rightTop = "";
          rightMiddle = frame.p;
        } else if (k === arr.length - 1) {
          //: LAST ROW
          leftTop = "";
          leftBottom = frame.q;
          leftMiddle = frame.k;
          columnLine = frame.l;
          rowLine = frame.r

          middleTop = "";
          middleMiddle = "";
          middleBottom = frame.s;

          rightTop = "";
          rightMiddle = frame.t;
        }

        if (i === 0) s = s + leftTop; //: First row start
        else if (i === maxRow - 1) s = s + leftBottom; //: Last row start
        else s = s + leftMiddle;

        o.limit.forEach((limit, index) => {
          if (i === 0) {
            s = s + middleTop.repeat(limit);
            if (index < o.limit.length - 1) s = s + middleMiddle;
          } else if (i === maxRow - 1) {
            s = s + rowLine.repeat(limit);
            TODO: 
            if (index < o.limit.length - 1) s = s + middleBottom;
          } else {
            const limit = o.limit[index];
            row[index] = row[index] === undefined ? o.unsetTemplate : row[index];
            const rowCount = row[index].length;
            let spacePre, spacePost;
            if (o.headersAlign === "left") {
              spacePre = "";
              spacePost = limit - row[index][0].length;
            } else if (o.headersAlign === "center") {
              const left = limit - row[index][0].length;
              spacePre = left % 2 === 0 ? left / 2 : Math.ceil(left / 2) - 1;
              spacePost = left % 2 === 0 ? left / 2 : Math.ceil(left / 2);
            } else if (o.headersAlign === "right") {
              spacePre = limit - row[index][0].length;
              spacePost = "";
            }
            if (index === o.limit.length - 1) columnLine = columnLast;
            // else if (index === 0) column = columnLeft
            // else column = column\;
            s = s + space(spacePre) + row[index][0] + space(spacePost) + columnLine; //_ <=text=
            if (rowCount === 1) {
              row[index][0] = " ";
            } else {
              row[index].shift();
            }
          }
        });

        if (i === 0) s = s + rightTop; //: First row finish
        else if (i === maxRow - 1) s = s + rightMiddle;
        let end = `\n`;
        if (s.endsWith(`\n`)) end = "";
        else end = `\n`;
        s = s + end;
      }
    }

    return s;
  }

  function space(sp) {
    if (sp > 0) return " ".repeat(sp);
    else if (sp <= 0) return "";
  }

  function calculateMaxRows(obj, limit) {
    let result = 0;
    const r = [];
    oDef.headers.forEach((el) => {
      const row = obj[el];
      if (row !== undefined || row != null) {
        if (Array.isArray(row)) {
          result = Math.max(result, ...row.map((item) => item.length));
        } else if (typeof row === "string") {
          result = Math.max(result, row.length);
        }
        const x = oDef.limit[oDef.headers.indexOf(el)];
        result = Math.ceil(result / oDef.limit[oDef.headers.indexOf(el)]);
        r.push(result);
      }
    });

    return Math.max(...r);
  }

  console.log(`O: ${beautify(o, null, 1, 120)}`);

  console.log(makeHeader());
}

module.exports = go;

// a___b__c___b__d
// e HEAD e HEAD e
// f___b__g___b__h
// e TEXT p TEXT e
// i___o__j___o__k
// e TEXT p TEXT e
// l___b__m___b__n
