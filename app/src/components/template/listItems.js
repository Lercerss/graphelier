import React from 'react';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import DashboardIcon from '@material-ui/icons/Dashboard';
import Message from '@material-ui/icons/Message';
import BarChartIcon from '@material-ui/icons/BarChart';
import LayersIcon from '@material-ui/icons/Layers';
import AssignmentIcon from '@material-ui/icons/Assignment';
import { NavLink } from 'react-router-dom';
import '../../styles/index.css';

export const mainListItems = (
    <div>
        <NavLink
            exact
            to={'/'}
            className={'mainItemsList-removeLink'}
            activeClassName={'mainItemsList-active'}
        >
            <ListItem button>
                <ListItemIcon>
                    <DashboardIcon />
                </ListItemIcon>
                <ListItemText primary={'Home'} />
            </ListItem>
        </NavLink>
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
        <NavLink
            to={'/Messages'}
            className={'mainItemsList-removeLink'}
            activeClassName={'mainItemsList-active'}
        >
            <ListItem button>
                <ListItemIcon>
                    <Message />
                </ListItemIcon>
                <ListItemText primary={'Message List'} />
            </ListItem>
        </NavLink>
        <NavLink
            to={'/ordergraph'}
            className={'mainItemsList-removeLink'}
            activeClassName={'mainItemsList-active'}
        >
            <ListItem button>
                <ListItemIcon>
                    <BarChartIcon />
                </ListItemIcon>
                <ListItemText primary={'Order Graph'} />
            </ListItem>
        </NavLink>
        <NavLink
            to={'/tbd'}
            className={'mainItemsList-removeLink'}
            activeClassName={'mainItemsList-active'}
        >
            <ListItem button>
                <ListItemIcon>
                    <LayersIcon />
                </ListItemIcon>
                <ListItemText primary={'TBD'} />
            </ListItem>
        </NavLink>
    </div>
);
