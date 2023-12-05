import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { DAY_COLOURS } from "../utilities/day";

const FrequencySpecific = ({ day, onRemoveDay }) => {
    const bgColour = DAY_COLOURS[day] || 'lightgrey';    

    const handleTrashClick = () => {
        onRemoveDay(day);
      };

    return (
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 flex items-center justify-center rounded-lg  border border-gray-500 shadow-[inset_0_-2px_4px_rgba(0,0,0,0.6)] mb-2" style={{ backgroundColor: bgColour }}>
            {day}
          </div>
          <div className="mt-2 cursor-pointer" onClick={handleTrashClick}>
            <FontAwesomeIcon icon={faTrash} />
          </div>
        </div>
      );
  }

export default FrequencySpecific
