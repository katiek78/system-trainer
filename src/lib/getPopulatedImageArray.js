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
            case 'other':
            default:
        }
return imageArray; 
}