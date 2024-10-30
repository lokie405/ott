const Ajv = require("ajv");
const beautify = require("json-beautify");

const frameStyles = {
  // double : ['╔', /*201*/ '╗', /*187*/ '╚', /*200*/ '╝', /*188*/ '═', /*205*/ '║', /*186*/ '╦', /*203*/ '╩', /*202*/ '╣', /*185*/ '╠', /*204*/ '╬', /*206*/ '╧', /*207*/ '╤', /*209*/ '╢', /*182*/ '╟', /*198*/ '╫', /*215*/ '╪', /*215*/ '─', /*196*/ '│', /*179*/],
  double: ["═", "║", "╔", "╦", "╗", "╠", "╬", "╣", "╚", "╩", "╝", "╧", "╤", "╢", "╟", "╫", "╪", "─", "│"],

  single: ["┌", /*218*/ "┐", /*191*/ "└", /*192*/ "┘", /*217*/ "─", /*196*/ "│", /*179*/ "┬", /*194*/ "┴", /*193*/ "┤", /*180*/ "├", /*195*/ "┼" /*197*/],
};

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
  
  //::: FRAME
  function makeHeader(type) {

    const f = o.frameStyle;
    const headers = o.headers;
    headers.forEach((name, index) => {  //: break longest as limit string at short pieces
      const rowCount = Math.ceil(headers[index].length / o.limit[index]);
      const length = o.limit[index];
      headers[index] = [];
      for (let i = 0; i < name.length; i += length) {
        headers[index].push(name.substring(i, i + length))
      }
    });
    const maxRow = Math.max(...headers.map((el) => el.length)) + 2;

    headers.forEach((el, index) => {
      const diff = maxRow - 2 - el.length

      if(o.headersGravity === "top") {
        // console.log(`maxRow: ${maxRow}`)
      } else if (o.headersGravity === "middle") {
        spacePre = diff % 2 === 0 ? diff / 2 : Math.ceil(diff / 2) - 1
        spacePost = diff % 2 === 0 ? diff / 2 : Math.ceil(diff / 2)
        // headers[index].unshift()
        while (spacePre > 0) {
          headers[index].unshift(" ".repeat(o.limit[index]))
          spacePre--
        }
        while (spacePost > 0) {
          headers[index].push(" ".repeat(o.limit[index]))
          spacePost--
        }
      } else if (o.headersGravity === "bottom") {
        for(let i = diff; i > 0; i--) {
          headers[index].unshift(" ".repeat(o.limit[index]))
        }
      }
    })

    let s = "";
    for (let i = 0; i < maxRow; i++) {
      if (i === 0) s = s + f[2]; //: First row start
      else if (i === maxRow - 1) s = s + f[5]; //: Last row start
      else s = s + f[1];

      o.limit.forEach((limit, index) => {
        if (i === 0 || i === maxRow - 1) {
          //: First and last row center
          s = s + f[0].repeat(limit);
          if (index < o.limit.length - 1) {
            if (i === 0) s = s + f[3];
            else if (i === maxRow - 1) s = s + f[6];
          }
        } else {
          //: Text
          const limit = o.limit[index];
          const rowCount = headers[index].length;
          let spacePre, spacePost;
          if (o.headersAlign === "left") {
            spacePre = "";
            spacePost = limit - headers[index][0].length;
          } else if (o.headersAlign === "center") {
            const left = limit - headers[index][0].length
            spacePre = left % 2 === 0 ? left / 2 : Math.ceil(left / 2) - 1
            spacePost = left % 2 === 0 ? left / 2 : Math.ceil(left / 2)
            // console.log(`left: ${left}; spacePre: ${spacePre}; spacePost: ${spacePost} `)

          } else if (o.headersAlign === "right") {
            spacePre = limit - headers[index][0].length;
            spacePost = "";
          }
          s = s + space(spacePre) + headers[index][0] + space(spacePost) + f[1]; //_ <=text=
          if (rowCount === 1) {
            headers[index][0] = " ";
          } else {
            headers[index].shift();
          }
        }
      });
      if (i === 0) s = s + f[4]; //: First row finish
      else if (i === maxRow - 1) s = s + f[7];
      s = s + `\n`;
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
          // console.log(`arr: ${row.length}`)
        } else if (typeof row === "string") {
          // console.log(`name: ${el} ; str: ${row}`)
          result = Math.max(result, row.length);
        }
        const x = oDef.limit[oDef.headers.indexOf(el)];
        // console.log(`r: ${result} limit: ${x} ; res: ${Math.ceil(result / x)}`)

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
