const process = require("process");
const util = require("util");
const {
  BencodeType,
} = require('./utils/enum');


const evaluateWord = (word) => {
  if (isNaN(+word))
    return word;
  else
    return +word;
}

const decodeBencode = (bencodedValue, valueType = null) => {
  //TODO: memoization somewhere?
  const firstElement = bencodedValue[0], lastElement = bencodedValue[bencodedValue.length-1];
  
  //string
  if (!isNaN(bencodedValue[0]) || valueType === BencodeType.str) {
    const firstColonIndex = bencodedValue.indexOf(":");
    if (firstColonIndex === -1) { //TODO: length-based error handling? this assumes that all is well
      throw new Error("Invalid encoded value");
    }
    return bencodedValue.substr(firstColonIndex + 1);
  } 
  
  //integer
  else if (firstElement === 'i' && lastElement === 'e') {
    return +bencodedValue.slice(1, -1);
  } 
  
  //list
  else if (firstElement === 'l' && lastElement === 'e') {
    let acc = '', ans = [];
    let i=1;
    while(i<bencodedValue.length-1) {
      let currentEl = bencodedValue[i], nextEl = bencodedValue[i+1];
      // console.log("CURRENT--->", currentEl, acc);

      if (!isNaN(+currentEl) && nextEl === ':') {
        // console.log("BHAI DEKH--->", acc+currentEl)
        let strLen = +(acc+currentEl);
        acc = '';
        i+= 2;
        // console.log("BANA--->", bencodedValue.slice(+i, +i+strLen+1), "AND--->", strLen)
        ans.push(decodeBencode(`${strLen}:${bencodedValue.slice(+i, +i+strLen)}`, BencodeType.str));
        i += strLen;

        continue;
      }
      if (currentEl === 'i' && !isNaN(+nextEl)) {
        if (acc.length)
          ans.push(evaluateWord(acc));
        acc = '';
        i++;
        continue;
      }
      if (currentEl === 'e' && !isNaN(+acc)) {
        if (acc.length)
          ans.push(+acc);
        acc = '';
        i++;
        continue;
      }
      acc += currentEl;
      i++;
    }
    return ans;
  } 
  
  //dictionary
  else if (firstElement === 'd' && lastElement === 'e') {
    let acc = '', ans = {}, key = null;
    let i = 1;
    while(i<bencodedValue.length-1) {
      let currentEl = bencodedValue[i], nextEl = bencodedValue[i+1];
      
      if (!isNaN(+currentEl) && nextEl === ':') {
        let strLen = +(acc+currentEl);
        acc = '';
        i+= 2;
        let decodedStr = decodeBencode(`${strLen}:${bencodedValue.slice(+i, +i+strLen)}`, BencodeType.str);
        if (!key)
          key = decodedStr;
        else {
          ans[key] = decodedStr;
          key = null;
        }
        i += strLen;

        continue;
      }
      if (currentEl === 'i' && !isNaN(+nextEl)) {
        if (acc.length) {
          ans[key] = acc;
        }
        acc = '';
        i++;
        continue;
      }
      if (currentEl === 'e' && !isNaN(+acc)) {
        if (acc.length) {
          ans[key] = +acc;
        }
        acc = '';
        i++;
        continue;
      }
      acc += currentEl;
      i++;
    }
    return ans;
  }

  else {
    throw new Error("Only strings, lists, and integers are supported at the moment");
  }
}

function main() {
  const command = process.argv[2];

  // You can use print statements as follows for debugging, they'll be visible when running tests.
  console.error("Logs from your program will appear here!");

  // Uncomment this block to pass the first stage
  if (command === "decode") {
    const bencodedValue = process.argv[3];
  
    // In JavaScript, there's no need to manually convert bytes to string for printing
    // because JS doesn't distinguish between bytes and strings in the same way Python does.
    console.log(JSON.stringify(decodeBencode(bencodedValue)));
  } else {
    throw new Error(`Unknown command ${command}`);
  }
}

main();
