const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

const EmbedStreetView = ({width, height, location, heading, pitch, fov}) => {
    if (heading === '') heading=90;
    if (!pitch) pitch=0;
    if (!fov) fov=100;
    return(
        <iframe
        className="mx-auto"
        width={width}
        height={height}
        style={{border:0, padding:'10px'}}
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        src={`https://www.google.com/maps/embed/v1/streetview?key=${API_KEY}
          &location=${location}
          &heading=${heading}&pitch=${pitch}&fov=${fov}`}>
      </iframe>
    );
}

export default EmbedStreetView;