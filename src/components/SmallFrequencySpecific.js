import { DAY_COLOURS } from "../utilities/day";

const SmallFrequencySpecific = ({ day, onRemoveDay }) => {
    const bgColour = DAY_COLOURS[day] || 'lightgrey';    

 
    return (
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 flex items-center justify-center rounded-lg  border border-gray-500 shadow-[inset_0_-2px_4px_rgba(0,0,0,0.6)] mb-2" style={{ backgroundColor: bgColour }}>
            {day}
          </div>         
        </div>
      );
  }

export default SmallFrequencySpecific
