const go = require("./ott.js");

const humans = [
  {
    id: "1",
    name: "Frederica",
    profession: "Engineer",
    skills: ["JavaScript", "Python", "  Problem-solving"],
    country: "USA",
  },
  {
    id: "12",
    name: "Bob",
    profession: "Designer",
    skills: ["Photoshop", "Illustrator", "Creativity"],
    pet: "Dog", // This object contains the 'pet' key
    country: "Canada",
  },
  {
    id: "3",
    name: "Charlie",
    profession: "Teacher",
    skills: ["Communication", "Patience", "Organization"],

    country: "UK",
  },
];

go(humans, {
  margin: 3,
  // margin: [{profession: 4}, {pet: 6}],
  // limit: [{id: 6}, {_$: 9}, {pet: 5}],
  // headers: ["name", "_$"],
  // limit: [{ id: 250 }, { "...": 300 }, { country: 100 }],
  // limit: [5, , 7, 5],
  limit: []
  // limit: [{ f: 4 }, {"...": 4}],
  // headers: ["pet", "_$"],
  // headers: ["id", "profession", "skills", "_$"]
});

// const a = [1,2, , ""]
// for(let i = 0; i < a.length; i++){
//   console.log(`i = ${i}; type: ${typeof a[i]}`)
// }

// const a = [1, 2,  , 4, 5];
// console.log(`${a.length}`)
// for (let i = 0; i <= 7; i++) {
//   try{
//     console.log(`a[${i}] = ${a[i]}`)
//   } catch {new Error(`Error: ${a[i]}`)}

// }
