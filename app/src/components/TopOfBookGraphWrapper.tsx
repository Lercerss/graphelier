import React from 'react';
import useDimensions from 'react-use-dimensions';
import { withStyles } from '@material-ui/core';
import TopOfBookGraph from './TopOfBookGraph';
import { Styles } from '../styles/TopOfBookGraphWrapper';


function TopOfBookGraphWrapper(props) {
    const { classes } = props;
    const [ref, { width, height }] = useDimensions();
    return (
        <div className={classes.graph}>
            <div
                ref={ref}
                style={{ width: '100%', height: 350 }}
            >
                <TopOfBookGraph
                    className={classes.graph}
                    height={height}
                    width={width}
                />
            </div>
        </div>
    );
}

export default withStyles(Styles)(TopOfBookGraphWrapper);
