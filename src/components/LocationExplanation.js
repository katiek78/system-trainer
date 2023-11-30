// import locationExplanation from '../../public/assets/location-explanation.png'
// import locationExplanation2 from '../../public/assets/location-explanation2.png'

const LocationExplanation = () => {
    return(
    <details>
        <summary>What should go here?</summary>
        <div className='bg-gray-100 rounded-lg p-4'>
    <p>Go to Google Street View, find your location and paste the address from the address bar. 
    <img className="w-full" id="location-explanation" alt="screenshot of part of a Google Street View URL with red box around co-ordinates" src="/assets/location-explanation.png"></img>
        <br /><br />
        If you're on the Google Maps app, simply copy the coordinates.
    <img className="h-64" id="location-explanation2" alt="screenshot from Google Street View app" height={100} src="/assets/location-explanation2.jpg"></img> 
    </p>
    </div>
    </details>
    );
}

export default LocationExplanation;