import React, { useEffect, useState } from 'react';
import { Avatar, List, message,Spin } from 'antd';


import VirtualList from 'rc-virtual-list';
const fakeDataUrl =
    'https://randomuser.me/api/?results=20&inc=name,gender,email,nat,picture&noinfo';
const ContainerHeight = 400;
const App = () => {
    const [data, setData] = useState([]);
    const appendData = (showMessage = true) => {
        fetch(fakeDataUrl)
            .then((res) => res.json())
            .then((body) => {
                setData(data.concat(body.results));
                showMessage && message.success(`${body.results.length} more items loaded!`);
            });
    };
    useEffect(() => {
        appendData(false);
    }, []);
    const onScroll = (e) => {
        // Refer to: https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollHeight#problems_and_solutions
        if (Math.abs(e.currentTarget.scrollHeight - e.currentTarget.scrollTop - ContainerHeight) <= 1) {
            appendData();
        }
    };
    return (
        <List>
            <VirtualList
                data={data}
                height={ContainerHeight}
                itemHeight={47}
                itemKey="email"
                onScroll={onScroll}
            >
                {(item) => (
                    <List.Item key={item.email}>
                        <List.Item.Meta
                            avatar={<Avatar src={item.picture.large} />}
                            title={<a href="https://ant.design">{item.name.last}</a>}
                            description={item.email}
                        />
                        <div>Content</div>
                    </List.Item>
                )}
            </VirtualList>
        </List>
    );
};
export default App;