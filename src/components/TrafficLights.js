const TrafficLights = ({ recentAttempts = [] }) => {   
    return <div className='absolute top-53/100 left-1/2 -translate-y-1/2 -translate-x-1/2 pl-10 w-6/10 h-5 text-lg'>
        {recentAttempts.map(attempt => attempt ? "🟢" : "🔴")}
    </div>;
  }

export default TrafficLights