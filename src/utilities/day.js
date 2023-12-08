export const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    let month = today.getMonth() + 1;
    let day = today.getDate();
  
    // Pad month and day with leading zeros if needed
    if (month < 10) {
      month = `0${month}`;
    }
    if (day < 10) {
      day = `0${day}`;
    }
  
    return `${year}-${month}-${day}`;
  };

export const formatDate = (dateString) => {
    try {
      const formattedDate = new Date(dateString).toISOString().split('T')[0];
      return formattedDate;
    }
    catch {
      return dateString;
    }
    };

export const DAY_COLOURS = {
    'M' : 'red',
    'Tu' : 'orange',
    'W' : 'yellow',
    'Th' : 'green',
    'F' : '#8888cd',
    'Sa' : 'magenta',
    'Su' : 'pink'
}

export const WEEKDAYS = ['M', 'Tu', 'W', 'Th', 'F', 'Sa', 'Su'];