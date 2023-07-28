import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";

const QuickEditForm = ({imageItem, name, handleSubmitEdit}) => {



    const [formItem, setFormItem] = useState(imageItem);
    // document.addEventListener('keydown', handleKeyDown)
 

    // function handleKeyDown(e) {       
    //     e.stopPropagation();       
    //     if (e.keyCode === 13) {
    //         console.log(e.keyCode)
    //         console.log(e.target)
    //         e.preventDefault();
    //         // e.preventDefault();
    //         // console.log(formItem)
    //         // handleSubmitEdit(e, formItem);
    //     } else return;
    // }

    const handleEditChange = (e) => {       
       e.stopPropagation();
       e.preventDefault();
        const target = e.target
        const value = target.value
        //const name = target.name
    
        // setForm({
        //   ...form,
        //   imageItem: value,
        // })
        setFormItem(value)
      }
    
      const handleClickSubmit = (e, formItem) => {    
        e.preventDefault();
        e.stopPropagation();  
        console.log("submitting")    
        handleSubmitEdit(e, formItem);   
      }

      const handleClickForm = (e) => {
        e.preventDefault();
        e.stopPropagation();
      }

return(
<div>
    <form onSubmit={(e) => handleClickSubmit(e, formItem)}><input name='imageItem' 
    onChange={(e) => handleEditChange(e)} 
    onClick={(e) => handleClickForm(e)} 
    className='text-black w-40 lg:w-60 text-lg rounded-xl absolute top-3/4 left-1 lg:left-5' 
    value={formItem}></input>{name}
    <button type="submit"><FontAwesomeIcon className='absolute left-3/4 top-3/4 text-white h-8' icon={faCheck}  /> </button>
    </form>
    </div>
)
}

export default QuickEditForm