import React from 'react';
import TimestampOrderBookScroller from '../../components/TimestampOrderBookScroller';
import { createMount, createShallow } from '@material-ui/core/test-utils';
import { IconButton, AppBar } from '@material-ui/core';
import {ORDERBOOK_FROM_BACKEND} from '../utils/mock-data';
import Dashboard from '../../components/template/Dashboard';

describe('Dashboard functionality', () => {
    let mount, shallow;

    beforeEach(() => {
        mount = createMount();
        shallow = createShallow({dive: true});
    });

    afterEach(() => {
        mount.cleanUp();
    });

    it('renders a Dashboard component without crashing', () => {
        const wrapper = mount(<Dashboard/>);
    });

    it('renders a Dashboard component with drawer and simulate open', () => {
        const wrapper = shallow(<Dashboard/>);


        wrapper.find(IconButton).last().simulate('click');
        const isOpen = wrapper.state().open;
        expect(isOpen).toBe(true);
    });

    it('renders a Dashboard component with drawer and simulate close', () => {
        const wrapper = shallow(<Dashboard />);

        wrapper.find(IconButton).last().simulate('click');
        wrapper.find(IconButton).first().simulate('click');
        const isOpen = wrapper.state().open;
        expect(isOpen).toBe(false);
    });
});