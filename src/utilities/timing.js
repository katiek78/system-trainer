export const getRequiredBPM = (ML_discipline, grouping, grabData, grabTime, target) => {
    const DISCIPLINE_TOTALS = {
      'ML Names' : 30,
      'ML International Names' : 30,
      'ML Words' : 50,
      'ML Images' : 30,
      'ML Numbers' : 80,
      'ML Cards' : 52
      }
    // return (DISCIPLINE_TOTALS[ML_discipline] - grabData) / grouping / (target - grabTime) * 60

    const result = (DISCIPLINE_TOTALS[ML_discipline] - grabData) / grouping / (target - grabTime) * 60;

    // const roundedResult = Math.round(result * 2) / 2; // Round to the nearest half value

    // return roundedResult;

   // Initialize an array to store feasible BPM options
  let feasibleBPMs = [];

  const checkFeasible = (bpm) => {
    if (bpm >= 60 && bpm <= 200) {
      feasibleBPMs.push(bpm);
    }
  };

  // Check the result and possible halved/doubled values for feasibility
  checkFeasible(result);
  checkFeasible(result * 2);
  checkFeasible(result / 2);

  // Check for factors of 4 and 8 by multiplying/dividing the result
  for (let i = 2; i <= 8; i *= 2) {
    const multipliedResult = result * i;
    const dividedResult = result / i;

    if (multipliedResult >= 60 && multipliedResult <= 200) {
      feasibleBPMs.push(Math.round(multipliedResult));
    }
    if (dividedResult >= 60 && dividedResult <= 200) {
      feasibleBPMs.push(Math.round(dividedResult));
    }
  }

  return feasibleBPMs;
    
  }
  
//Have a button on the goal page next to a goal, with explanatory hover text, that takes you to the page to update your grouping and grab data for a certain discipline.
//Have a form for this data in the Training centre (for now it's just a standalone one that returns to the Goal page)
//The BPM is now a separate column in the Goals list
//When training is added, the grab time can be calculated and refined (grabbed data can be edited after the fact)