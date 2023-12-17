const getRequiredBPM = (ML_discipline, grouping, grabData, grabTime, target) => {
    const DISCIPLINE_TOTALS = {
      'ML Names' : 30,
      'ML International Names' : 30,
      'ML Words' : 50,
      'ML Images' : 30,
      'ML Numbers' : 80,
      'ML Cards' : 52
      }
    return (DISCIPLINE_TOTALS[ML_discipline] - grabData) / grouping / (target - grabTime) * 60
    
  }
  
//Have a button on the goal page next to a goal, with explanatory hover text, that takes you to the page to update your grouping and grab data for a certain discipline.
//Have a form for this data in the Training centre (for now it's just a standalone one that returns to the Goal page)
//The BPM is now a separate column in the Goals list
//When training is added, the grab time can be calculated and refined (grabbed data can be edited after the fact)