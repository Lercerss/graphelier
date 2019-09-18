import React, {Component} from 'react';
import {connect} from 'react-redux';
import styles from '../styles/WelcomeCard.module.css';

class WelcomeCard extends Component {

    constructor(props) {
        super(props);

        this.state = {
            appName: ''
        };
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const {appName} = this.props;

        if (prevProps.appName !== appName) {
            this.setState({appName});
        }
    }

    render() {
        const {appName} = this.state;

        return (
            <div>
                <a
                    className={styles.appLink}
                    href={'https://github.com/Lercerss/graphelier'}
                    target={'_blank'}>
                    Welcome to {appName}</a>
            </div>
        );
    }
}

const mapStateToProps = (state) => {
    return {
        appName: state.appName
    };
};

export default connect(
    mapStateToProps,
)(WelcomeCard);
