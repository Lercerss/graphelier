import React from 'react';
import { shallow } from 'enzyme';
import App from '../App';

describe('Examining the functionality of App', () => {
    it('renders without crashing', () => {
        shallow(<App />);
    });
});
