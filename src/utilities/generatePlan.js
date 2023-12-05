import { ML_DISCIPLINES_WITH_TIME, TRADITIONAL_DISCIPLINES_WITH_TIME } from "@/lib/disciplines"
import { WEEKDAYS } from "./day";

export const generatePlan = (minutes, ML, traditional, IAMImages, AI) => {

    const planEntries = [];
    const totalWeekMinutes = minutes * 7; // Total minutes in a week
    const remainingDayMinutes = [minutes, minutes, minutes, minutes, minutes, minutes, minutes];
  
    //First, gather the disciplines we are using
    const trainingDisciplines = [];
    if (ML) trainingDisciplines.push(...ML_DISCIPLINES_WITH_TIME);
    if (traditional) trainingDisciplines.push(...TRADITIONAL_DISCIPLINES_WITH_TIME);
    
    //Order the disciplines by size and eliminate disciplines that we do not have enough minutes for in a day
    const sortedAndFilteredTrainingDisciplines = trainingDisciplines.filter(el => el.time <= minutes).sort((a, b) => b.time - a.time);

    const getShuffledDisciplines = (disciplines) => {        
            // Group disciplines by their 'time' property
            const groupedByTime = disciplines.reduce((acc, discipline) => {
              const key = discipline.time;
              if (!acc[key]) {
                acc[key] = [];
              }
              acc[key].push(discipline);
              return acc;
            }, {});
          
            // Sort keys (time values) in descending order
            const sortedKeys = Object.keys(groupedByTime).sort((a, b) => b - a);
          
            // Shuffle each group independently
            sortedKeys.forEach(key => {
              groupedByTime[key] = shuffleArray(groupedByTime[key]);
            });
          
            // Function to shuffle an array (Fisher-Yates shuffle algorithm)
            function shuffleArray(array) {
              for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
              }
              return array;
            }
          
            // Concatenate the shuffled groups back into a single array
            return sortedKeys.flatMap(key => groupedByTime[key]);
    }

    const shuffledDisciplines = getShuffledDisciplines(sortedAndFilteredTrainingDisciplines);
    console.log(shuffledDisciplines)
    
 var counter = 100;
    //While the max remainingDayMinutes >= smallest discipline time
    while (counter > 0 && Math.max(...remainingDayMinutes) >= Math.min(...shuffledDisciplines.map(discipline => discipline.time))) {
          //Keep trying to assign each discipline in the sortedAndFiltered array
          //Eventually we must shuffle disciplines with same time but keep them grouped by time
        for (let i = 0; i < shuffledDisciplines.length; i++) {
            //Check if this discipline can fit in at least one day
            const canFit = shuffledDisciplines[i].time <= Math.max(...remainingDayMinutes);
            if (canFit) {
                //assign it to a day            
                let randomDayIndex = Math.floor(Math.random() * WEEKDAYS.length); 
                //check if we can fit it in that day and if not, keep looking for another random day
                while (remainingDayMinutes[randomDayIndex] < shuffledDisciplines[i].time) {
                    randomDayIndex = (randomDayIndex + 1) % WEEKDAYS.length; 
                }
                //add it to the plan
                planEntries.push({discipline: shuffledDisciplines[i].name, frequency: 1, frequencyType: 'W', frequencySpecifics: [WEEKDAYS[randomDayIndex]]})                   
                //remove minutes from day
                remainingDayMinutes[randomDayIndex] -= shuffledDisciplines[i].time;           
            }
        }
        counter--;
    }

    const aggregatedEntries = Object.values(planEntries.reduce((acc, entry) => {
        if (!acc[entry.discipline]) {
          acc[entry.discipline] = { ...entry };
          acc[entry.discipline].frequencySpecifics = [entry.frequencySpecifics].flat(); // Flatten initial frequencySpecifics array
        } else {
          acc[entry.discipline].frequency++;
          acc[entry.discipline].frequencySpecifics = acc[entry.discipline].frequencySpecifics.concat(entry.frequencySpecifics).flat(); // Concatenate and flatten frequencySpecifics arrays
        }
        return acc;
      }, {}));
  

    return aggregatedEntries;

  };

