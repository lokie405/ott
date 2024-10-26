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
        anyOf: [{ type: "integer", minimum: 1 },{type: "string"}, { type: "object", patternProperties: { ".*": { type: "integer" } } }],
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

    limit: ["..."], //: "default" | <number> | {"header": <number>}
    alignedHor: "center",  //: "center" | "left" | "right"
    alignedVer: "middle",  //: "middle" | "top" | "bottom"
    unsetTemplate: "-", // TODO: if length of template more then row limit then cut template
  };

  // :: Fill oDef object. Prepare some field
  const o = (function () {
    Object.keys(oSet).forEach((key) => {
      oDef[key] = oSet[key];
    });

    //_ Set "-1" instead "undefined" in array like [v1,v2, , v4] -> because ajv does not have undefined concept
    //_ in first time replace set limit
    // console.log(`oDef.limit = ${JSON.stringify(oDef.limit, null, 1)}`);
    const validLimit = [];
    for (let i = 0; i < oDef.limit.length; i++) {
      // console.log(`${oDef.limit[i] === "null"} p: ${i}`);
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
      // console.log(`ERROR: ${validate.errors.message}`);
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
    // console.log(`limit = ${oDef.limit}`)
    //: Default limits
    const limitDef = new Array(oDef.headers.length);  //: Default limit extends maximum length
    
    limitDef.fill(0);
    const leftOverLimit = limitDef.map((elem, ind) => ind)  //: To set left over "..."
    // console.log(`leftOverLimit = ${leftOverLimit}`)
    arr.forEach((obj) => {
      oDef.headers.forEach((e, index) => {
        let max;
        if (obj[e] === undefined) {
          max = 0;
        } else if (typeof obj[e] === "array") {
          max = Math.max(...obj[e]);
        } else {
          max = obj[e].length;
        }
        limitDef[index] = Math.max(max, limitDef[index], e.length);
      });
    });
    let limitSet = oDef.limit
    oDef.limit = limitDef
    limitSet.forEach((el, index) => {
      if (typeof el === "number") {
        oDef.limit[index] = el
        leftOverLimit[index] = -1
      } else if (typeof el === "string") {
        oDef.limit[index] = limitDef[index]
        leftOverLimit[index] = -1
      } else if (Object.prototype.toString.call(el) === `[object Object]`) {
        const ind = oDef.headers.indexOf(Object.entries(el)[0][0])
        const lim = Object.entries(el)[0][1]
        if (Object.entries(el)[0][0] === "..."){
          console.log(`ind`)
          leftOverLimit.map((e, i) => {
            if (e > -1) oDef.limit[i] = lim
          })
        } else {
          oDef.limit[ind] = lim
          leftOverLimit[ind] = -1
        }
      }
      console.log(`leftOverLimit = ${leftOverLimit}`)
    })

    //_ row (private)
    oDef.maxRow = []
    arr.forEach(el => {
      oDef.maxRow.push(calculateMaxRows(el))
    })

    //_ style
    oDef.frameStyle = frameStyles[oDef.frameStyle]
    return oDef
  })();

// ['═  0', '║  1', '╔  2', '╦  3', '╗  4', '╠  5',
//  '╬  6', '╣  7', '╚  8', '╩  9', '╝ 10', '╧ 11',
//  '╤ 12', '╢ 13', '╟ 14', '╫ 15', '╪ 16', '─ 17', '│ 18']
   //::: FRAME
   function makeHeader(kind) {
    const f = o.frameStyle
    const headers = o.headers
    headers.forEach((el, index) => {
      const rowCount = Math.ceil(headers[index].length / o.limit[index])
      // console.log(`index: ${rowCount}`)
      const name = headers[index]
      const length = o.limit[index]
        headers[index] = []
        for(let i = 0; i < name.length; i += length) {
          headers[index].push(name.substring(i, i + length))
          //TODO: in here set align algorithm
          // console.log(`i = ${i} ;length = ${headers[index].length} h = ${headers[index][headers[index].length - 1]}`)
        }
    })
    // console.log(`mmm = ${Math.max(...headers.map(el => el.length))}`)
    const maxRow = Math.max(...headers.map(el => el.length)) + 2
    // console.log(`maxRow: ${maxRow}`)
    let s = ""
    for (let i = 0; i < maxRow; i++) {
      if (i === 0) s = s + f[2]  //: First row start
      else if (i === maxRow - 1) s = s + f[5]  //: Last row start
      else s = s + f[1]

      o.limit.forEach((limit, index) => {
        if (i ===  0 || i === maxRow - 1) {  //: First and last row center
          s = s + f[0].repeat(limit)
          if (index < o.limit.length - 1) {
           if (i === 0) s = s + f[3]
           else if (i === maxRow - 1) s = s + f[6]
          }
        } else {
          //: Text
          const limit = o.limit[index]
          const rowCount = headers[index].length
          const space = limit - headers[index][0].length
          s = s + headers[index][0] + " ".repeat(space) + f[1]  //_ <= text =
          if (rowCount === 1) {
            headers[index][0] = " "
          } else {
            headers[index].shift()
          }
        }
      })
      if (i === 0) s = s + f[4]  //: First row finish
      else if (i === maxRow - 1) s = s + f[7]
      s = s + `\n`
    }
    return s
   }


  function calculateMaxRows(obj, limit) {
    let result = 0
    const r = []
    oDef.headers.forEach(el => {
      const row = obj[el]
      if (row !== undefined || row != null) {
        if (Array.isArray(row)) {
          result = Math.max(result, ...row.map(item => item.length))
          // console.log(`arr: ${row.length}`)
        }
        else if (typeof row === "string") {
          // console.log(`name: ${el} ; str: ${row}`)
          result = Math.max(result, row.length)
        } 
        const x = oDef.limit[oDef.headers.indexOf(el)]
        // console.log(`r: ${result} limit: ${x} ; res: ${Math.ceil(result / x)}`)

        result = Math.ceil(result / oDef.limit[oDef.headers.indexOf(el)])
        r.push(result)
      }
    })
    
    return Math.max(...r)
  }



  console.log(`O: ${beautify(o, null, 1, 120)}`)

  console.log(makeHeader("top"))
}

module.exports = go;
