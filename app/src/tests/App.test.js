import React from 'react';
import App from '../App';
import {shallow} from 'enzyme';

describe('Examining the functionality of App', () => {

    it('renders without crashing', () => {
        shallow(<App />);
    });
});