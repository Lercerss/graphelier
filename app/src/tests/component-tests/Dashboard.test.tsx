import React from 'react';
import { createMount, createShallow } from '@material-ui/core/test-utils';
import { IconButton } from '@material-ui/core';
import { NonConnectedDashboard as Dashboard } from '../../components/template/Dashboard';

describe('Dashboard functionality', () => {
    let mount, shallow, props;

    beforeEach(() => {
        mount = createMount();
        shallow = createShallow({ dive: true });
        props = {
            onInstrumentsReceived: jest.fn(),
        };
    });

    afterEach(() => {
        mount.cleanUp();
    });

    it('renders a Dashboard component with drawer and simulate open and close', () => {
        const wrapper = shallow(<Dashboard
            onInstrumentsReceived={props.onInstrumentsReceived}
        />);

        wrapper.find(IconButton).last().simulate('click');
        expect(wrapper.state().open).toBe(true);
        wrapper.find(IconButton).first().simulate('click');
        expect(wrapper.state().open).toBe(false);
    });
});
