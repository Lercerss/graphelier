import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import { createStyles, WithStyles } from '@material-ui/styles';
import classNames from 'classnames';
import stc from 'string-to-color';

import Img from 'react-image';
import {
    Typography,
    Box,
    ButtonBase,
    Modal,
    Backdrop,
    Fade,
    CircularProgress,
} from '@material-ui/core';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import { Link } from 'react-router-dom';
import bigInt from 'big-integer';
import { Styles } from '../styles/ArticleItem';

import {
    Article,
} from '../models/NewsTimeline';
import { NANOSECONDS_IN_ONE_SECOND } from '../constants/Constants';
import { getHoursMinutesStringFromTimestamp } from '../utils/date-utils';
import ArticleDetails from './ArticleDetails';
import { Colors } from '../styles/App';

const styles = createStyles(Styles);

interface Props extends WithStyles<typeof styles>{
    article: Article,
    isFirstItem: boolean,
    instruments: Array<string>,
}

interface State {
    modalIsOpen: boolean,
}

class ArticleItem extends Component<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
            modalIsOpen: false,
        };
    }

    /**
     * @desc Handles closing the modal
     */
    handleCloseModal = () => {
        this.setState({
            modalIsOpen: false,
        });
    };

    render() {
        const {
            article, classes, isFirstItem, instruments,
        } = this.props;
        const { modalIsOpen } = this.state;
        const nanosecondTimestamp = bigInt(article.timestamp).multiply(NANOSECONDS_IN_ONE_SECOND);
        const timePublishedString = getHoursMinutesStringFromTimestamp(nanosecondTimestamp);
        const orderedInstruments = article.tickers.sort((a, b) => {
            if (instruments.includes(a)) {
                return -1;
            }
            return 1;
        });

        return (
            <div
                className={classNames(classes.articleDiv, !isFirstItem && classes.marginLeft)}
            >
                <ButtonBase
                    onClick={() => { this.setState({ modalIsOpen: true }); }}
                    className={classes.buttonBase}
                >
                    <div>
                        <div
                            className={classes.title}
                        >
                            <Typography
                                variant={'subtitle1'}
                                color={'textPrimary'}
                                align={'left'}
                                className={classes.headline}
                            >
                                {article.title}
                            </Typography>
                            <a
                                href={article.article_url}
                                target={'_blank'}
                                className={classes.articleLink}
                            >
                                <OpenInNewIcon
                                    fontSize={'small'}
                                    className={classes.linkIcon}
                                    color={'primary'}
                                />
                            </a>
                        </div>
                        <div className={classes.stockTimeDiv}>
                            {orderedInstruments.map(instrument => {
                                const style = {
                                    backgroundColor: instruments.includes(instrument) ? stc(instrument) : Colors.grey,
                                };
                                if (instruments.includes(instrument)) {
                                    return (
                                        <Link
                                            to={`/orderbook?instrument=${instrument}&timestamp=${nanosecondTimestamp}`}
                                            className={classes.graphLink}
                                        >
                                            <Box
                                                className={classNames(classes.stockBox, classes.fadeOnHover)}
                                                id={'stockBox'}
                                                style={style}
                                            >
                                                <Typography className={classes.stock}>
                                                    {instrument}
                                                </Typography>
                                            </Box>
                                        </Link>
                                    );
                                }
                                return (
                                    <Box
                                        className={classes.stockBox}
                                        id={'stockBox'}
                                        style={style}
                                    >
                                        <Typography className={classes.stock}>
                                            {instrument}
                                        </Typography>
                                    </Box>
                                );
                            })}
                            <Typography
                                className={classes.time}
                                id={'time'}
                            >
                                {`${timePublishedString} | ${article.source_name}`}
                            </Typography>
                        </div>
                        <Img
                            src={article.image_url}
                            className={classes.image}
                            loader={<CircularProgress />}
                        />
                    </div>
                </ButtonBase>
                <Modal
                    open={modalIsOpen}
                    onClose={this.handleCloseModal}
                    aria-labelledby={'simple-modal-title'}
                    aria-describedby={'simple-modal-description'}
                    BackdropComponent={Backdrop}
                    className={classes.modal}
                >
                    <Fade in={modalIsOpen}>

                        <div className={classes.paper}>
                            <ArticleDetails
                                article={article}
                                instruments={orderedInstruments}
                            />
                        </div>
                    </Fade>
                </Modal>
            </div>
        );
    }
}

export default withStyles(styles)(ArticleItem);
