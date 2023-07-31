import { calculateOverrideValues } from "next/dist/server/font-utils";

const suitValues = ['♥️', '♦️', '♣️', '♠️']
const cardValues = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export const getPopulatedImageArray = (setType) => {
      //get the array that we want to populate the image set with
        let imageArray = [];
        switch(setType) {
            case '2d':
                for (let i = 0; i < 100; i++) {
                    const twoDigitValue = i.toString().padStart(2, '0');
                    imageArray.push({ name: twoDigitValue, imageItem: '' });
                }
                break;
            case '3d':
                for (let i = 0; i < 1000; i++) {
                    const threeDigitValue = i.toString().padStart(3, '0');
                    imageArray.push({ name: threeDigitValue, imageItem: '' });
                    }
                break;
            case '4d':
                for (let i = 0; i < 10000; i++) {
                    const fourDigitValue = i.toString().padStart(4, '0');
                    imageArray.push({ name: fourDigitValue, imageItem: '' });
                    }
                break;
            case '1c':
                for (let i = 0; i < suitValues.length; i++) {
                    for (let j = 0; j < cardValues.length; j++) {
                        imageArray.push({name: cardValues[j] + suitValues[i], imageItem: ''});
                    }    
                }
                break;
            case '2c':
                for (let i = 0; i < suitValues.length; i++) {
                    for (let j = 0; j < cardValues.length; j++) {
                        for (let k = 0; k < suitValues.length; k++) {
                            for (let l = 0; l < cardValues.length; l++) {
                                imageArray.push({name: cardValues[j] + suitValues[i] + cardValues[l] + suitValues[k], imageItem: ''});
                            }
                        }
                    }    
                }
                break;
            case 'other':
            default:
        }
return imageArray; 
}