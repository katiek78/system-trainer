const TrafficLights = ({ recentAttempts = [] }) => {   
    return <div className='absolute bottom-8 left-1/2 transform -translate-x-1/2 pl-4 pt-1 w-full h-5 lg:text-lg text-sm'>
        {recentAttempts.map(attempt => attempt ? "🟢" : "🔴")}
    </div>;
  }

export default TrafficLights