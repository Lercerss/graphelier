import React from 'react';
import useDimensions from 'react-use-dimensions';
import TopOfBookGraph from './TopOfBookGraph';

function TopOfBookGraphWrapper(props) {
    const {
        onTimeSelect, selectedDateTimeNano, topOfBookItems,
    } = props;
    const [ref, { width, height }] = useDimensions();
    return (
        <div>
            <div
                ref={ref}
                style={{ width: '100%', height: 350 }}
            >
                <TopOfBookGraph
                    height={height}
                    width={width}
                    onTimeSelect={onTimeSelect}
                    selectedDateTimeNano={selectedDateTimeNano}
                    topOfBookItems={topOfBookItems}
                />
            </div>
        </div>
    );
}

export default TopOfBookGraphWrapper;
