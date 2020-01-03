import React from 'react';
import TrendingUpOutlinedIcon from '@material-ui/icons/TrendingUpOutlined';
import { styles } from '../styles/Home';

function Home() {
    const classes = styles();
    return (
        <div className={classes.drawerOffset}>
            <TrendingUpOutlinedIcon
                className={classes.home}
            />
        </div>
    );
}
export default Home;
