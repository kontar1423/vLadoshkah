    import React from 'react';
    import { Helmet } from 'react-helmet-async';
    import LapaIcon from '../assets/images/lapa.png';

    const Favicon = () => {
    return (
        <Helmet>
        <link rel="icon" type="image/png" href={LapaIcon} />
        <link rel="apple-touch-icon" href={LapaIcon} />
        </Helmet>
    );
    };

    export default Favicon;