const EmbedImage = ({width, height, location}) => {

    return(
        <img
        className="mx-auto"
        width={width}
        height={height}
        style={{border:0, padding:'10px'}}
        loading="lazy"
        allowFullScreen        
        src={`${location}`} />      
    );
}

export default EmbedImage;