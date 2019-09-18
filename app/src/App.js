import React, {Component} from 'react';
import {connect} from 'react-redux';

import logo from './assets/logo.svg';
import styles from './styles/App.module.css';
import {saveReactAppName} from './actions/actions';
import WelcomeCard from './components/WelcomeCard';

class App extends Component {

    constructor(props) {
        super(props);

        this.state = {
            helloMessage: 'Welcome to React',
        };
    }

    componentDidMount() {
        this.props.onAppMounted('graphelier');
    }

    render() {

        const {helloMessage} = this.state;

        return (
            <div className={styles.app}>
                <header className={styles.appHeader}>
                    <img src={logo} className={styles.appLogo} alt={'logo'} />
                    <p>{helloMessage}</p>
                    <WelcomeCard/>
                </header>
            </div>
        );
    }
}

const mapStateToProps = (state) => {
    return {};
};

const mapDispatchToProps = (dispatch) => {
    return {
        onAppMounted: (name) => dispatch(saveReactAppName(name)),
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(App);
