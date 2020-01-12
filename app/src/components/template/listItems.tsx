import React from 'react';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import AssignmentIcon from '@material-ui/icons/Assignment';
import { NavLink } from 'react-router-dom';
import '../../styles/index.css';

export const mainListItems = (
    <div>
        <NavLink
            to={'/orderbook'}
            className={'mainItemsList-removeLink'}
            activeClassName={'mainItemsList-active'}
        >
            <ListItem button>
                <ListItemIcon>
                    <AssignmentIcon />
                </ListItemIcon>
                <ListItemText primary={'OrderBook Snapshot'} />
            </ListItem>
        </NavLink>
    </div>
);
