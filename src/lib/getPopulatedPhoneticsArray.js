import { cardValues, suitValues } from "./cardConstants";
import {
  majorValues,
  benVowels,
  kBenCardValues,
  kBenCardValues2704,
  kBenSuitPairs,
  dBenCardVowels,
  dMajorValues,
  dBenCardValues,
  HBHMSuitPairs,
  rModifiedConsonantArray,
  specialVoicedConsonantArray,
  voicedConsonantArray,
} from "./phoneticsConstants";

//♥️', '♦️', '♣️', '♠️
const getBen4Phonetics = (text) => {
  const RULES = [
    //type 0 (STARTS WITH) = CL + V + C   tr ai n
    //type 1 (VOWEL) = C + CL + C   t ow n
    //type 2 (ENDS WITH) = C + V + CL s e nd
    //type3 (STARTS WITH + r OR voiced) = CL + V + r + C    d a r m OR CL + V + Voiced = d a g
    //type 4 = (STARTS WITH + r but for regular consonants) C + V + r + C    t a r t

    { type: 0, cluster: "s" },
    { type: 0, cluster: "st" },
    { type: 0, cluster: "sn" },
    { type: 0, cluster: "sm" },
    { type: 0, cluster: "str" },
    { type: 0, cluster: "sl" },
    { type: 0, cluster: "sw" },
    { type: 0, cluster: "sk" },
    { type: 0, cluster: "squ" },
    { type: 0, cluster: "sp" },
    { type: 0, cluster: "g" }, //10
    { type: 0, cluster: "d" },
    { type: 0, cluster: "h" },
    { type: 0, cluster: "z" }, //changed from tj
    { type: 0, cluster: "tr" },
    { type: 1, cluster: "ow" },
    { type: 1, cluster: "oi" },
    { type: 0, cluster: "t" },
    { type: 3, cluster: "tr" }, //18 was tw (0, tw)
    { type: 0, cluster: "dr" },
    { type: 2, cluster: "ns" }, //20 - changed from 'th..'
    { type: 2, cluster: "nt" }, //changed from nd
    { type: 0, cluster: "n" },
    { type: 3, cluster: "sp" }, //changed from nj and then i- ( { type: 5, cluster: 'i' }) and then type 7 (VRC - CLASH with 32)
    { type: 2, cluster: "nd" }, // changed from thr...
    { type: 0, cluster: "" }, //25 e.g. eg
    { type: 2, cluster: "nch" },
    { type: 2, cluster: "nk" },
    { type: 2, cluster: "v" }, //changed from { type: 2, cluster: 'tle', shortVowelVersion: true },
    { type: 2, cluster: "ng" },
    { type: 0, cluster: "th" }, //30 // changed from mj and then type 5 'u' and then -ns
    { type: 2, cluster: "lt" },
    { type: 3, cluster: "" }, //changed from nt, e.g. arm
    { type: 0, cluster: "m" },
    { type: 0, cluster: "thr" }, //34 - changed from -RC e.g. arm
    { type: 2, cluster: "b" }, //changed from 'ble'
    { type: 2, cluster: "th" },
    { type: 3, cluster: "cr" }, //37, changed from -ct, then th+ (3, th)
    { type: 2, cluster: "ld" }, //changed from vj
    { type: 2, cluster: "mp" },
    { type: 4 }, //40
    { type: 4 },
    { type: 4 },
    { type: 4 },
    { type: 0, cluster: "r" },
    { type: 4 },
    { type: 4 },
    { type: 4 },
    { type: 4 },
    { type: 4 },
    { type: 3, cluster: "z" }, //50
    { type: 3, cluster: "d" },
    { type: 3, cluster: "j" },
    { type: 3, cluster: "y" },
    { type: 3, cluster: "w" },
    { type: 0, cluster: "l" },
    { type: 3, cluster: "ch" },
    { type: 3, cluster: "g" },
    { type: 3, cluster: "v" },
    { type: 3, cluster: "b" },
    { type: 0, cluster: "j" }, //60
    { type: 2, cluster: "d" }, //changed from scht
    { type: 2, cluster: "j" }, //changed from schn
    { type: 0, cluster: "y" }, //changed from schm
    { type: 0, cluster: "shr" },
    { type: 0, cluster: "w" }, //changed from schl
    { type: 0, cluster: "sh" },
    { type: 0, cluster: "skr" },
    { type: 0, cluster: "ch" },
    { type: 3, cluster: "sl" }, //changed from schp and then o- (type 5)
    { type: 2, cluster: "z" }, //70  //changed from kj
    { type: 2, cluster: "ct" }, //changed from gr-
    { type: 3, cluster: "h" }, //changed from kn and then { type: 2, cluster: 'dle', shortVowelVersion: true }
    { type: 2, cluster: "g" }, //changed from zh
    { type: 0, cluster: "kr" },
    { type: 0, cluster: "kl" },
    { type: 0, cluster: "gl" },
    { type: 0, cluster: "k" },
    { type: 0, cluster: "gr" }, //78 changed from kv then ie
    { type: 3, cluster: "br" }, //changed from xh and then ia and then { type: 2, cluster: 'ble', shortVowelVersion: true }
    { type: 0, cluster: "qu" }, //80
    { type: 2, cluster: "st" },
    { type: 2, cluster: "" }, //82 e.g. soo
    { type: 3, cluster: "sk" }, //changed from a- (type 5)
    { type: 0, cluster: "fr" },
    { type: 0, cluster: "fl" },
    { type: 6, cluster: "" }, //changed from ts at start then ts at end
    { type: 2, cluster: "x" },
    { type: 0, cluster: "f" },
    { type: 0, cluster: "v" },
    { type: 2, cluster: "ps" }, //90 //changed from starting with ps
    { type: 2, cluster: "pt" },
    { type: 0, cluster: "br" },
    { type: 0, cluster: "bl" }, //changed from pj
    { type: 0, cluster: "pr" },
    { type: 0, cluster: "pl" },
    { type: 0, cluster: "b" },
    { type: 2, cluster: "ch" }, //changed from bj
    { type: 3, cluster: "st" }, //changed from pf then eo then spr
    { type: 0, cluster: "p" },
  ];

  function getSyllableFromRule(ruleObj, thisNum) {
    var thisSyllable;
    switch (ruleObj.type) {
      case 0:
        thisSyllable =
          ruleObj.cluster +
          benVowels[thisNum.charAt(2)] +
          majorValues[thisNum.charAt(3)];
        break;
      case 1:
        thisSyllable =
          majorValues[thisNum.charAt(2)] +
          ruleObj.cluster +
          majorValues[thisNum.charAt(3)];
        break;
      case 2:
        if (
          ruleObj.shortVowelVersion &&
          benVowels[thisNum.charAt(3)].length == 1
        ) {
          thisSyllable =
            majorValues[thisNum.charAt(2)] +
            benVowels[thisNum.charAt(3)] +
            ruleObj.cluster[0] +
            ruleObj.cluster;
        } else {
          thisSyllable =
            majorValues[thisNum.charAt(2)] +
            benVowels[thisNum.charAt(3)] +
            ruleObj.cluster;
        }
        break;
      case 3:
        var finalCons = majorValues[thisNum.charAt(3)];
        if (
          finalCons == "s" ||
          finalCons == "t" ||
          finalCons == "sh" ||
          finalCons == "k" ||
          finalCons == "f" ||
          finalCons == "p"
        ) {
          thisSyllable =
            ruleObj.cluster +
            benVowels[thisNum.charAt(2)] +
            voicedConsonantArray[thisNum.charAt(3)];
        } else {
          thisSyllable =
            ruleObj.cluster +
            benVowels[thisNum.charAt(2)] +
            "r" +
            rModifiedConsonantArray[thisNum.charAt(3)];
        }
        break;
      case 4:
        thisSyllable =
          majorValues[thisNum.charAt(1)] +
          benVowels[thisNum.charAt(2)] +
          "r" +
          rModifiedConsonantArray[thisNum.charAt(3)];
        break;
      case 5:
        thisSyllable =
          ruleObj.cluster +
          majorValues[thisNum.charAt(2)] +
          benVowels[thisNum.charAt(3)];
        break;
      case 6:
        thisSyllable =
          specialVoicedConsonantArray[thisNum.charAt(2)] +
          benVowels[thisNum.charAt(3)];
        break;
      case 7:
        thisSyllable =
          benVowels[thisNum.charAt(2)] +
          "r" +
          rModifiedConsonantArray[thisNum.charAt(3)];
        break;
    }
    return thisSyllable;
  }

  const firstTwoDigits = Number(text.substring(0, 2));
  return getSyllableFromRule(RULES[firstTwoDigits], text);
};

const getBenCardPhonetics = (text) => {};

const getKBenCardPhonetics = (text) => {
  const { cardVal1, cardVal2, suit1, suit2 } = getCardParts(text);
  const suitPair = convertCardTextToProcessableString(suit1 + suit2);
  return (
    kBenCardValues[cardVal1] +
    kBenSuitPairs[suitPair] +
    kBenCardValues[cardVal2]
  );
};

const getHBHMPhonetics = (text) => {
  const { cardVal1, cardVal2, suit1, suit2 } = getCardParts(text);
  const suitPair = convertCardTextToProcessableString(suit1 + suit2);
  const colourFirst =
    suitPair[0] === "d" || suitPair[0] === "h" ? "red" : "black";

  if (colourFirst === "red") {
    if (cardVal2 === "K") {
      // Special syllable for second card being "K"
      return kBenCardValues2704["red"][cardVal1] + kBenSuitPairs[suitPair];
    }
    // Default red case
    return (
      kBenCardValues[cardVal1] +
      HBHMSuitPairs[suitPair] +
      kBenCardValues[cardVal2]
    );
  } else {
    // Default black case
    return (
      kBenCardValues[cardVal1] +
      kBenSuitPairs[suitPair] +
      kBenCardValues[cardVal2]
    );
  }
};

const getKBenCardPhonetics2704 = (text) => {
  const { cardVal1, cardVal2, suit1, suit2 } = getCardParts(text);
  const suitPair = convertCardTextToProcessableString(suit1 + suit2);
  const colourFirst =
    suitPair[0] === "d" || suitPair[0] === "h" ? "red" : "black";
  return (
    kBenCardValues2704[colourFirst][cardVal1] +
    kBenSuitPairs[suitPair] +
    kBenCardValues[cardVal2]
  );
};

const convertCardTextToProcessableString = (text) => {
  text = text.toString();

  const conversionMap = {
    10: "0",
    "♥": "h",
    "♦": "d",
    "♠": "s",
    "♣": "c",
  };

  let resultString = removeVariationSelectors(text); //ADD THIS TO CODING FRUSTRATIONS

  for (const key in conversionMap) {
    resultString = resultString.split(key).join(conversionMap[key]);
  }

  return resultString;
};

function removeVariationSelectors(inputString) {
  return inputString.replace(/\ufe0f/g, "");
}

const getCardParts = (text) => {
  const convertProcessableStringToCardText = (text) => {
    text = text.toString();
    const conversionMap = {
      0: "10",
      h: "♥",
      d: "♦",
      s: "♠",
      c: "♣",
    };

    return text.replace(/0|h|d|s|c/g, (match) => conversionMap[match]);
  };

  const processableString = convertCardTextToProcessableString(text);

  const cardParts = {
    cardVal1: convertProcessableStringToCardText(processableString[0]),
    cardVal2: convertProcessableStringToCardText(processableString[2]),
    suit1: convertProcessableStringToCardText(processableString[1]),
    suit2: convertProcessableStringToCardText(processableString[3]),
  };

  return cardParts;
};

export const getPopulatedPhoneticsArray = (
  setType,
  phoneticsType,
  replacementMajorValues = [],
  replacementBenVowels = []
) => {
  console.log(setType); //3cv
  console.log(phoneticsType); //dben
  const majorValuesToUse =
    replacementMajorValues.length > 0 ? replacementMajorValues : majorValues;
  const benVowelsToUse =
    replacementBenVowels.length > 0 ? replacementBenVowels : benVowels;
  //get the array that we want to populate the image set with
  let phoneticsArray = [];
  switch (phoneticsType) {
    case "maj":
      if (setType === "2d") {
        for (let i = 0; i < 100; i++) {
          const twoDigitPhonetics =
            majorValuesToUse[i.toString().padStart(2, "0")[0]] +
            "+" +
            majorValuesToUse[i.toString().padStart(2, "0")[1]];
          phoneticsArray.push(twoDigitPhonetics);
        }
      }
      if (setType === "3d") {
        for (let i = 0; i < 1000; i++) {
          const threeDigitPhonetics =
            majorValuesToUse[i.toString().padStart(3, "0")[0]] +
            "+" +
            majorValuesToUse[i.toString().padStart(3, "0")[1]] +
            "+" +
            majorValuesToUse[i.toString().padStart(3, "0")[2]];
          phoneticsArray.push(threeDigitPhonetics);
        }
      }
      if (setType === "4d") {
        for (let i = 0; i < 10000; i++) {
          const fourDigitPhonetics =
            majorValuesToUse[i.toString().padStart(4, "0")[0]] +
            "+" +
            majorValuesToUse[i.toString().padStart(4, "0")[1]] +
            "+" +
            majorValuesToUse[i.toString().padStart(4, "0")[2]] +
            majorValuesToUse[i.toString().padStart(4, "0")[3]];
          phoneticsArray.push(fourDigitPhonetics);
        }
      }
      break;
    case "ben":
      if (setType === "3d") {
        for (let i = 0; i < 1000; i++) {
          const threeDigitPhonetics =
            majorValuesToUse[i.toString().padStart(3, "0")[0]] +
            benVowelsToUse[i.toString().padStart(3, "0")[1]] +
            majorValuesToUse[i.toString().padStart(3, "0")[2]];
          phoneticsArray.push(threeDigitPhonetics);
        }
      }
      // if (setType === '4d') {
      //     for (let i = 0; i < 100; i++) {
      //         const fourDigitPhonetics = getBen4Phonetics(i.toString().padStart(4, '0'));
      //         phoneticsArray.push(fourDigitPhonetics);
      //     }
      // }
      if (setType === "2c") {
        //Conventional 2-card Ben System here
        for (let i = 0; i < 2704; i++) {
          const twoCardPhonetics = getBenCardPhonetics(i);
          phoneticsArray.push(twoCardPhonetics);
        }
      }

      break;
    case "kben":
      if (setType === "4d") {
        for (let i = 0; i < 10000; i++) {
          const fourDigitPhonetics = getBen4Phonetics(
            i.toString().padStart(4, "0")
          ); //Do we need the toString?
          phoneticsArray.push(fourDigitPhonetics);
        }
      }
      if (setType === "2c") {
        //Katie's 2-card Ben System 2704 here
        for (let i = 0; i < suitValues.length; i++) {
          for (let j = 0; j < cardValues.length; j++) {
            for (let k = 0; k < suitValues.length; k++) {
              for (let l = 0; l < cardValues.length; l++) {
                const twoCardPhonetics = getKBenCardPhonetics2704(
                  cardValues[j] + suitValues[i] + cardValues[l] + suitValues[k]
                );
                phoneticsArray.push(twoCardPhonetics);
              }
            }
          }
        }
      }
      if (setType === "2cv") {
        //Katie's 2-card Ben System 1352 here
        for (let i = 2; i < suitValues.length; i++) {
          for (let j = 0; j < cardValues.length; j++) {
            for (let k = 0; k < suitValues.length; k++) {
              for (let l = 0; l < cardValues.length; l++) {
                const twoCardPhonetics = getKBenCardPhonetics(
                  cardValues[j] + suitValues[i] + cardValues[l] + suitValues[k]
                );
                phoneticsArray.push(twoCardPhonetics);
              }
            }
          }
        }
      }
      break;
    case "dben": {
      if (setType === "3d") {
        for (let i = 0; i < 1000; i++) {
          const threeDigitPhonetics =
            dMajorValues[i.toString().padStart(3, "0")[0]] +
            benVowelsToUse[i.toString().padStart(3, "0")[1]] +
            dMajorValues[i.toString().padStart(3, "0")[2]];
          phoneticsArray.push(threeDigitPhonetics);
        }
      }
      if (setType === "3cv") {
        const vowels = benVowels.concat([
          dBenCardVowels["J"],
          dBenCardVowels["Q"],
          dBenCardVowels["K"],
        ]);
        console.log(vowels);
        const cardValues = [
          "A",
          "2",
          "3",
          "4",
          "5",
          "6",
          "7",
          "8",
          "9",
          "10",
          "J",
          "Q",
          "K",
        ]; //TODO; move to constants
        for (let i = 0; i < 13; i++) {
          for (let j = 0; j < 13; j++) {
            for (let k = 0; k < 13; k++) {
              // kBenCardValues[cardVal1] +
              // kBenSuitPairs[suitPair] +
              // kBenCardValues[cardVal2]
              const threeCardPhonetics =
                dBenCardValues[cardValues[i]] +
                vowels[j] +
                dBenCardValues[cardValues[k]];
              console.log(threeCardPhonetics);
              phoneticsArray.push(threeCardPhonetics);
            }
          }
        }
      }
    }
    case "hbhm":
      if (setType === "2c") {
        //Katie's 2-card HBHM here
        for (let i = 0; i < suitValues.length; i++) {
          for (let j = 0; j < cardValues.length; j++) {
            for (let k = 0; k < suitValues.length; k++) {
              for (let l = 0; l < cardValues.length; l++) {
                const twoCardPhonetics = getHBHMPhonetics(
                  cardValues[j] + suitValues[i] + cardValues[l] + suitValues[k]
                );
                phoneticsArray.push(twoCardPhonetics);
              }
            }
          }
        }
      }
      break;
    case "none":
    default:
  }
  return phoneticsArray;
};
