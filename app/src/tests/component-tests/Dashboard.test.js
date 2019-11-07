import React from 'react';
import { createMount, createShallow } from '@material-ui/core/test-utils';
import { IconButton } from '@material-ui/core';
import Dashboard from '../../components/template/Dashboard';

describe('Dashboard functionality', () => {
    let mount, shallow;

    beforeEach(() => {
        mount = createMount();
        shallow = createShallow({ dive: true });
    });

    afterEach(() => {
        mount.cleanUp();
    });

    it('renders a Dashboard component without crashing', () => {
        mount(<Dashboard />);
    });

    it('renders a Dashboard component with drawer and simulate open', () => {
        const wrapper = shallow(<Dashboard />);


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
