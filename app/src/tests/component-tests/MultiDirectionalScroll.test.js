import React from 'react';
import { createMount, createShallow } from '@material-ui/core/test-utils';
import { Box } from '@material-ui/core';
import MultiDirectionalScroll from '../../components/MultiDirectionalScroll';

describe('multidirectional scroll functionality', () => {
    let mount, shallow, scrollProps;

    const scroller = {
        firstChild: {
            offsetTop: 0,
        },
        lastChild: {
            offsetTop: 0,
            offsetHeight: 0,
        },
        scrollTop: 0,
        offsetTop: 0,
        offsetHeight: 0,
    };

    beforeEach(() => {
        mount = createMount();
        shallow = createShallow({ dive: true });

        scrollProps = {
            position: 10,
            onScroll: jest.fn(),
            onReachBottom: jest.fn(),
            onReachTop: jest.fn(),
        };
    });

    afterEach(() => {
        mount.cleanUp();
    });

    it('renders a MultiDirectionalScroll component with expected props', () => {
        const wrapper = mount(
            <MultiDirectionalScroll
                position={scrollProps.position}
                onScroll={scrollProps.onScroll}
                onReachBottom={scrollProps.onReachBottom}
                onReachTop={scrollProps.onReachTop}
            />,
        );
        expect(wrapper.props().position).toEqual(10);
        expect(wrapper.props().onScroll).toBeDefined();
    });

    it('renders a MultiDirectionalScroll component without optional props and without crashing', () => {
        shallow(<MultiDirectionalScroll />);
    });


    it('renders a MultiDirectionalScroll component with correct amount of boxes', () => {
        const wrapper = mount(<MultiDirectionalScroll />);
        expect(wrapper.find(Box).length).toEqual(1);
    });


    it('should trigger onScroll on scroll', () => {
        const wrapper = shallow(<MultiDirectionalScroll />);
        wrapper.instance().scroller = scroller;

        wrapper.setProps(scrollProps);

        expect(wrapper.instance().scroller).toBeTruthy();
        wrapper.find(Box).simulate('scroll');
        expect(scrollProps.onScroll).toHaveBeenCalledTimes(1);
    });

    it('should trigger onReachBottom when hitting bottom', () => {
        const wrapper = shallow(
            <MultiDirectionalScroll>
                <div>Test</div>
            </MultiDirectionalScroll>,
        );

        wrapper.instance().scroller = {
            ...scroller,
            offsetTop: 100,
            scrollTop: 100,
            offsetHeight: 1000,
        };

        wrapper.setProps(scrollProps);

        expect(wrapper.instance().scroller).toBeTruthy();
        wrapper.find(Box).simulate('scroll');
        expect(scrollProps.onScroll).toHaveBeenCalled();
        expect(scrollProps.onReachTop).toHaveBeenCalledTimes(0);
        expect(scrollProps.onReachBottom).toHaveBeenCalled();
    });

    it('should trigger onReachTop when hitting top', () => {
        const wrapper = shallow(
            <MultiDirectionalScroll>
                <div>Test</div>
            </MultiDirectionalScroll>,
        );

        wrapper.instance().scroller = {
            ...scroller,
            firstChild: {
                offsetTop: 100,
            },
            lastChild: {
                offsetTop: 100,
                offsetHeight: 100,
            },
            offsetTop: -1000,
            scrollTop: -1000,
        };

        wrapper.setProps(scrollProps);

        expect(wrapper.instance().scroller).toBeTruthy();
        wrapper.find(Box).simulate('scroll');
        expect(scrollProps.onScroll).toHaveBeenCalled();
        expect(scrollProps.onReachTop).toHaveBeenCalled();
        expect(scrollProps.onReachBottom).toHaveBeenCalledTimes(0);
    });
});
