
import { withPageAuthRequired, getSession } from "@auth0/nextjs-auth0";
import { useEffect } from "react";
import dbConnect from "@/lib/dbConnect";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faEdit, faMagic, faCalendar, faPalette} from "@fortawesome/free-solid-svg-icons";
import { refreshData } from "@/lib/refreshData";
import { useState } from "react";
import { useRouter } from "next/router";
import PlanEntry from "@/models/PlanEntry";
import SmallFrequencySpecific from "@/components/SmallFrequencySpecific";
import AutoGenerate from "@/components/AutoGenerate";
import { generatePlan } from "@/utilities/generatePlan";
import { WEEKDAYS, DAY_COLOURS } from "@/utilities/day";
import './styles.css';


const PlanPage = ({ user, planEntries }) => {

    const [message, setMessage] = useState('')
    const [isAGButtonDisabled, setIsAGButtonDisabled] = useState(false);
    const [isDisciplineView, setIsDisciplineView] = useState(true);
    const [today, setToday] = useState('');

    const contentType = 'application/json'
    const router = useRouter();

    useEffect(() => {
      const currentDate = new Date();
      const currentDay = WEEKDAYS[currentDate.getDay() - 1 % WEEKDAYS.length];
      setToday(currentDay);
      setActiveTab(currentDay);    
    }, [WEEKDAYS]);

      const getFormattedFrequencyType = (str) => {        
        if (str === 'D') return 'day';
        if (str === 'W') return 'week';
        return 'month';
      }
    

    const handleDelete = async (id) => {
        const confirmed = window.confirm('Are you sure you want to delete this entry?');
        if (confirmed) {

            //remove it from the database
            try {
                await fetch(`/api/planEntries/${id}`, {
                    method: 'Delete',
                })
                refreshData(router);
            } catch (error) {
                setMessage('Failed to delete the entry.')
            }
        }
    }

    const handleClickAutoGenerate = () => {
       setIsAGButtonDisabled(true);
    }

    const autoGenerateForm = {
      minutes: 0,     
      ML: true,
      traditional: true,
      IAMImages: true,
      AI: true
  }

  const handleCancelClick = () => {
    setIsAGButtonDisabled(false);   
  };

  const handleGenerate = (form) => {   
    //call code to generate a plan here
    const plan = generatePlan(form.minutes, form.ML, form.traditional, form.IAMImages, form.AI)
    savePlan(plan);
  }

  const handleDisciplineView = () => {
    setIsDisciplineView(true);
  }

  const handleDayView = () => {
    setIsDisciplineView(false);
  }

  const savePlan = async (plan) => {
    console.log(plan);
    //remove all existing plan entries for this user
    try {
      await fetch(`/api/planEntries/user/${user.sub}`, {
          method: 'Delete',
      })
     // refreshData(router);
  } catch (error) {
      setMessage('Failed to delete the entry.')
  }

    //add the id to each plan entry
    plan = plan.map(p => ({ ...p, userId: user.sub }));

  console.log(plan);
    //insert the plan entries
    try {
      const res = await fetch('/api/planEntries/user/${user.sub}', {
        method: 'POST',
        headers: {
          Accept: contentType,
          'Content-Type': contentType,
        },
        body: JSON.stringify(plan),        
      })

      // Throw error with status code in case Fetch API req failed
      if (!res.ok) {
        throw new Error(res.status)
      }
    
      router.push({pathname: `/plan`})
    } catch (error) {
      setMessage('Failed to add plan entries')
    }
  }
  
console.log(planEntries)
  const [activeTab, setActiveTab] = useState(WEEKDAYS[0]); // Set default active tab to Monday

  const openDay = (day) => {
    setActiveTab(day);
  };


    return (
        <>
            <div className="z-10 justify-between font-mono text-lg max-w-5xl">
                <h1 className="py-2 font-mono text-4xl">Training plan</h1>

                <br />
                <div className="bg-white dark:bg-slate-800 py-5 px-5 rounded">
                    <h3 className="font-semibold">Plan your training</h3>
                    <p className="font-mono">Click 'Add entry' to plan your daily/weekly/monthly memory training. 
                        You can also click 'Auto-generate' to create a weekly training plan that fits the time you have available. It's also possible to edit your plan afterwards.</p>
                </div>
            

            </div>
            <div>{message}</div>
            <br />
            <div className="bg-white dark:bg-slate-800 py-5 px-5 rounded" style={{ maxWidth: '100vw', overflowX: 'auto' }}>
                <h2 className="text-2xl font-semibold">My training plan</h2>                
              <br />
              {/* <button className="btn bg-green-400 hover:bg-green-700 text-black font-bold mt-3 py-1 px-4 rounded focus:outline-none focus:shadow-outline"> */}
              <Link href="/newPlanEntry"><button className="btn bg-black hover:bg-gray-700 text-white font-bold mt-3 py-2 px-6 rounded focus:outline-none focus:shadow-outline">
                    Add entry
                </button></Link>
              <button onClick={handleClickAutoGenerate} disabled={isAGButtonDisabled} className={`btn ${isAGButtonDisabled ? 'bg-gray-300 cursor-not-allowed' : 'bg-gradient-to-br from-purple-500 to-blue-500 hover:from-purple-700 hover:to-blue-700'} text-white font-bold mt-3 py-2 px-6 rounded focus:outline-none focus:shadow-outline flex items-center`}>
                      Auto-generate  <FontAwesomeIcon icon={faMagic} className="ml-2" />
                </button>
                {isAGButtonDisabled &&
                  <AutoGenerate formId='auto-generate-form' doesPlanExist={planEntries.length > 0} autoGenerateForm={autoGenerateForm} onCancelClick={handleCancelClick} onGenerate={handleGenerate} />                
                }
                <br />
                    {planEntries?.length === 0 && 
                    <p>You have not added any entries to your training plan yet.</p>
                    }
                    {planEntries?.length > 0 && (
                        <>
                  <div className="flex justify-center">
                    {/* <FontAwesomeIcon onClick={handleDisciplineView} icon={faPalette} className="cursor-pointer mr-3 pb-5" size="3x" />
                    <FontAwesomeIcon onClick={handleDayView} icon={faCalendar} className="cursor-pointer pb-5" size="3x" />
                     */}
                     <p onClick={handleDisciplineView} className={`cursor-pointer mr-3 mb-3 lg:text-3xl sm:text-2xl ${isDisciplineView ? 'active-view' : ''}`}>Discipline view</p>
                     <p className="lg:text-3xl sm:text-2xl mr-3">|</p>
                     <p onClick={handleDayView} className={`cursor-pointer mr-3 mb-3 lg:text-3xl sm:text-2xl ${!isDisciplineView ? 'active-view' : ''}`}>Day view</p>
                  </div>        
                
                  {isDisciplineView &&
                        <table className="border-collapse border w-full responsive-table-plan">
                          <thead>
                            <tr className="bg-gray-200">
                              <th className="border border-gray-400 px-4 py-2">Discipline</th>
                              <th className="border border-gray-400 px-4 py-2">Frequency</th>
                              <th className="border border-gray-400 px-4 py-2">On</th>
                              <th className="border lg:border-gray-400 px-4 py-2"></th>
                              <th className="border lg:border-gray-400 px-4 py-2"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {planEntries.map(entry => (
                              <tr key={entry._id}>          
                                <td className="lg:border border-gray-400 px-4 py-2">{entry.discipline}</td>
                                <td className="lg:border border-gray-400 px-4 py-2">{entry.frequency} per {getFormattedFrequencyType(entry.frequencyType)}</td>          
                                <td className="lg:border border-gray-400 px-4 py-2"><div className=" flex gap-2">{entry.frequencySpecifics
                                  .sort((a, b) => WEEKDAYS.indexOf(a) - WEEKDAYS.indexOf(b))
                                  .map((el, index) => <SmallFrequencySpecific key={index} day={el} />)}</div></td>     
                                <td className="icon-cell lg:border border-gray-400 px-4 py-2">
                                <Link href="/plan/[id]/editEntry" as={`/plan/${entry._id}/editEntry`} legacyBehavior>
                                  <FontAwesomeIcon
                                    className="cursor-pointer"             
                                    icon={faEdit}
                                    size="1x"
                                  />
                                  </Link>
                                </td>
                                <td className="icon-cell lg:border border-gray-400 px-4 py-2">
                                  <FontAwesomeIcon
                                    className="cursor-pointer"
                                    onClick={() => handleDelete(entry._id)}
                                    icon={faTrash}
                                    size="1x"
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                  }

                  {!isDisciplineView &&
                  //day view
                  <div className="tabs">
                    {WEEKDAYS.map((day) => (
                      <button
                        key={day}
                        className={`tablinks ${activeTab === day ? 'active' : ''}`}
                        onClick={() => openDay(day)}
                        style={{backgroundColor:DAY_COLOURS[day] || 'lightgrey'}}
                      >
                        {day}
                      </button>
                    ))}

                    {WEEKDAYS.map((day) => (
                      <div
                        key={day}
                        id={day}
                        className={`tabcontent ${activeTab === day ? 'active' : ''}`}
                        style={{ display: activeTab === day ? 'block' : 'none' }}
                      >
                      {today === day && <p className="lg:text-4xl md:text-3xl sm:text-3xl mt-3 font-bold">Today's plan:</p>}
              
                      
                      
                      <div>
    {
      (() => {
        const disciplinesCount = {};

        // Count occurrences of each discipline for the specified day
        planEntries.forEach(entry => {
          if (entry.frequencySpecifics.includes(day)) {
            if (!disciplinesCount[entry.discipline]) {
              disciplinesCount[entry.discipline] = entry.frequencySpecifics.filter(spec => spec === day).length;
            } else {
              disciplinesCount[entry.discipline] += entry.frequencySpecifics.filter(spec => spec === day).length;
            }
          }
        });

        // Render each discipline based on its count
        const renderedDisciplines = [];
        Object.keys(disciplinesCount).forEach(discipline => {
          const repetitions = disciplinesCount[discipline];
          for (let i = 0; i < repetitions; i++) {
            renderedDisciplines.push(
              <div key={`${discipline}-${i}`} className="lg:mt-5 sm:mt-3 lg:text-3xl sm:text-2xl">
                {discipline}
              </div>
            );
          }
        });

        return renderedDisciplines;
      })()
    }
  </div>


                       </div>
                    ))}
                  </div>
                  
                  
                  }
         
          </>
)}
            </div>
        
        </>
    )
}

export default PlanPage;

export const getServerSideProps = withPageAuthRequired({
    getServerSideProps: async ({ req, res }) => {
    const auth0User = await getSession(req, res);
     const db = await dbConnect()
     const user = (auth0User).user

      // Function to fetch log entries with pagination
      const fetchPlanEntries = async (userId) => {
            try {
            const result2 = await PlanEntry.find({ userId })
                .sort({ discipline: 1, _id: -1 }) // Sort by discipline               

                const planEntries = result2.map((doc) => {
                    const planEntry = JSON.parse(JSON.stringify(doc));
                    planEntry._id = planEntry._id.toString()
                    return planEntry
                })
                return planEntries;
            } catch (error) {
            console.error('Error fetching plan entries:', error);
            throw new Error('Failed to fetch plan entries');  
            }         
        };


    const planEntries = await fetchPlanEntries(user.sub);
    
    return {
      props: { 
        user,
        planEntries
        //eventually will want goals and best scores here?
      },
    };
  },
})

