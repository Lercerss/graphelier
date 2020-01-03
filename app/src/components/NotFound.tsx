import React from 'react';
import { styles } from '../styles/Home';

function NotFound() {
    const classes = styles();
    return (
        <img
            className={classes.notFound}
            src={'/404_cat.jpg'}
            alt={'404 derpy cat'}
        />
    );
}

export default NotFound;
