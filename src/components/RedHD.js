const RedHeartsAndDiamonds = ({ text }) => {
    if (!text || text === "") return <span></span>;
    
    const coloredText = text.replace(/♦|♥/g, (match) => {
      return `<span class="text-red-600">${match}</span>`;
    });
  
    return <span dangerouslySetInnerHTML={{ __html: coloredText }} />;
  };
  
  export default RedHeartsAndDiamonds;