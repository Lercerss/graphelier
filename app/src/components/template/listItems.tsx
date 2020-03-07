import React from 'react';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import { NavLink } from 'react-router-dom';
import '../../styles/index.css';
import { Newspaper, ChartAreasplineVariant } from 'mdi-material-ui';

export const mainListItems = (
    <div>
        <NavLink
            to={'/orderbook'}
            className={'mainItemsList-removeLink'}
            activeClassName={'mainItemsList-active'}
        >
            <ListItem button>
                <ListItemIcon>
                    <ChartAreasplineVariant />
                </ListItemIcon>
                <ListItemText primary={'OrderBook Snapshot'} />
            </ListItem>
        </NavLink>
        <NavLink
            to={'/timeline'}
            className={'mainItemsList-removeLink'}
            activeClassName={'mainItemsList-active'}
        >
            <ListItem button>
                <ListItemIcon>
                    <Newspaper />
                </ListItemIcon>
                <ListItemText primary={'News Timeline'} />
            </ListItem>
        </NavLink>
    </div>
);
