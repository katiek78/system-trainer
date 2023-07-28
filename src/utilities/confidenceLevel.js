export const getConfidenceLevel = (recentAttempts) => {
    if (!recentAttempts) recentAttempts = [];
    return recentAttempts.length > 0 ? recentAttempts.reduce((acc, val) => acc + val, 0) + 1 : 0;
  }
  

//now return a score, have some labels in here as a const, and then 8 colours
export const confidenceLabels = ['Untested ❓', 'Very tricky 🤯', 'Tricky 😓', 'A little tricky 🙁', 'Medium 😑', 'Fairly easy 🙂', 'Easy 😊', 'Very easy 😁', 'Perfect 🤩'];
//export const confidenceColours = ['bg-slate-300', 'bg-red-700', 'bg-orange-500', 'bg-amber-300', 'bg-yellow-300', 'bg-lime-300', 'bg-lime-500', 'bg-green-500', 'bg-teal-400']
export const confidenceColours = ['lightgray', 'red', 'orangered', 'orange', 'yellow', 'greenyellow', 'limegreen', 'green', 'turquoise']
