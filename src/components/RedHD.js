const RedHeartsAndDiamonds = ({ text }) => {
  if (!text || text === "") return <span></span>;

  // const coloredText = text.replace(/♦|♥/g, (match) => {
  //   return `<span class="card-suit text-red-600">${match}</span>`;
  // });
  const coloredText = text.replace(/♦|♥/g, (match) => {
    const emoji = match + "\uFE0F"; // Force emoji rendering
    return `<span class="card-suit text-red-600">${emoji}</span>`;
  });

  return <span dangerouslySetInnerHTML={{ __html: coloredText }} />;
};

export default RedHeartsAndDiamonds;
