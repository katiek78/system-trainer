import { confidenceColours, getConfidenceLevel } from "../utilities/confidenceLevel";7

const ConfidenceLevel = ({ recentAttempts }) => {
    const bgColour = confidenceColours[getConfidenceLevel(recentAttempts)];
    console.log(getConfidenceLevel(recentAttempts))
    console.log(bgColour)
    return <div className="absolute top-0 w-full pl-10 h-4 rounded-t-xl" style={{backgroundColor: bgColour}} />;
  }

export default ConfidenceLevel
