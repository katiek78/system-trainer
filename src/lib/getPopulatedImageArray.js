import { cardValues, suitValues } from "./cardConstants";

export const getPopulatedImageArray = (setType) => {
  //get the array that we want to populate the image set with
  let imageArray = [];
  switch (setType) {
    case "2d":
      for (let i = 0; i < 100; i++) {
        const twoDigitValue = i.toString().padStart(2, "0");
        imageArray.push({ name: twoDigitValue, imageItem: "" });
      }
      break;
    case "3d":
      for (let i = 0; i < 1000; i++) {
        const threeDigitValue = i.toString().padStart(3, "0");
        imageArray.push({ name: threeDigitValue, imageItem: "" });
      }
      break;
    case "4d":
      for (let i = 0; i < 10000; i++) {
        const fourDigitValue = i.toString().padStart(4, "0");
        imageArray.push({ name: fourDigitValue, imageItem: "" });
      }
      break;
    case "1c":
      for (let i = 0; i < suitValues.length; i++) {
        for (let j = 0; j < cardValues.length; j++) {
          imageArray.push({
            name: cardValues[j] + suitValues[i],
            imageItem: "",
          });
        }
      }
      break;
    case "2c":
      for (let i = 0; i < suitValues.length; i++) {
        for (let j = 0; j < cardValues.length; j++) {
          for (let k = 0; k < suitValues.length; k++) {
            for (let l = 0; l < cardValues.length; l++) {
              imageArray.push({
                name:
                  cardValues[j] + suitValues[i] + cardValues[l] + suitValues[k],
                imageItem: "",
              });
            }
          }
        }
      }
      break;
    case "2cv":
      for (let i = 2; i < suitValues.length; i++) {
        for (let j = 0; j < cardValues.length; j++) {
          for (let k = 0; k < suitValues.length; k++) {
            for (let l = 0; l < cardValues.length; l++) {
              imageArray.push({
                name:
                  cardValues[j] + suitValues[i] + cardValues[l] + suitValues[k],
                imageItem: "",
              });
            }
          }
        }
      }
      break;
    case "3cv":
      for (let i = 0; i < cardValues.length; i++) {
        for (let j = 0; j < cardValues.length; j++) {
          for (let k = 0; k < cardValues.length; k++) {
            imageArray.push({
              name: cardValues[i] + " " + cardValues[j] + " " + cardValues[k],
              imageItem: "",
            });
          }
        }
      }
      break;
    case "3cs":
      for (let i = 0; i < suitValues.length; i++) {
        for (let j = 0; j < suitValues.length; j++) {
          for (let k = 0; k < suitValues.length; k++) {
            imageArray.push({
              name: suitValues[i] + suitValues[j] + suitValues[k],
              imageItem: "",
            });
          }
        }
      }
      break;

    case "other":
    default:
  }
  return imageArray;
};
