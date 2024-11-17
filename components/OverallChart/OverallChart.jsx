'use client'

import {
    CheckIcon,
    Combobox,
    Flex,
    Group,
    InputBase,
    Paper,
    rem,
    Text,
    useCombobox
} from "@mantine/core";
import React from "react";
import {AreaChart} from '@mantine/charts';

const options = [
    {label: "Linear", value: "linear"},
    {label: "Bump", value: "bump"},
    {label: "Natural", value: "natural"},
    {label: "Monotone", value: "monotone"},
    {label: "Step", value: "step"},
    {label: "Step Before", value: "stepBefore"},
    {label: "Step After", value: "stepAfter"}
];

export default function OverallChart({data, currencyPrefix}) {
    const [selected, setSelected] = React.useState(0);
    const [variant, setVariant] = React.useState("linear");
    const combobox = useCombobox({
        onDropdownClose: () => combobox.resetSelectedOption(),
    });

    const items = options.map((item, index) => (
        <Combobox.Option value={item.value} key={index}>
            <Group gap="0.4rem">
                {item.value === variant && <CheckIcon size={12}/>}
                {item.label}
            </Group>
        </Combobox.Option>
    ));


    return (
        <Paper mih={rem(360)}>
            <Flex justify="space-between" align="center" gap="0.6rem">
                    <Flex gap="1rem">
                        <Text style={{whiteSpace: "nowrap"}} c={selected === 0 ? "white" : "dimmed"} className="pointer"
                              onClick={() => setSelected(0)}
                              size="sm">Total value</Text>
                    </Flex>
                <Combobox
                    store={combobox}
                    withinPortal={false}
                    transitionProps={{duration: 200, transition: 'pop'}}
                    onOptionSubmit={(val) => {
                        setVariant(val);
                        combobox.closeDropdown();
                    }}
                >
                    <Combobox.Target>
                        <InputBase
                            component="button"
                            pointer
                            maw="14rem"
                            w="100%"
                            styles={{
                                input: {border: "1px solid var(--mantine-color-dark-5)", fontSize: 14},
                            }}
                            transitionProps={{duration: 200, transition: 'pop'}}
                            rightSection={<Combobox.Chevron/>}
                            onClick={() => combobox.toggleDropdown()}
                            rightSectionPointerEvents="none"
                        >
                            {options.find(option => option.value === variant).label}
                        </InputBase>
                    </Combobox.Target>

                    <Combobox.Dropdown>
                        <Combobox.Options>{items}</Combobox.Options>
                    </Combobox.Dropdown>
                </Combobox>
            </Flex>
            <AreaChart
                valueFormatter={(value) => currencyPrefix + new Intl.NumberFormat('en-US').format(value)}
                curveType={variant}
                mt="1.2rem"
                tickLine="xy"
                h={260}
                // data={[
                //     {
                //         date: 'Mon',
                //         "current week": 2890,
                //         "previous week": 1238,
                //     },
                //     {
                //         date: 'Tue',
                //         "current week": 4810,
                //         "previous week": 3800,
                //     },
                //     {
                //         date: 'Wed',
                //         "current week": 3800,
                //         "previous week": 4300,
                //     },
                //     {
                //         date: 'Thu',
                //         "current week": 4300,
                //         "previous week": 3800,
                //     },
                //     {
                //         date: 'Fri',
                //         "current week": 4500,
                //         "previous week": 3800,
                //     },
                //     {
                //         date: 'Sat',
                //         "current week": 5400,
                //         "previous week": 3500,
                //     },
                //     {
                //         date: 'Sun',
                //         "current week": 6400,
                //         "previous week": 5000,
                //     },
                // ]}
                data={data}
                dataKey="date"
                type="stacked"
                tooltipAnimationDuration={200}
                withLegend
                series={[
                    {name: 'current week', color: 'indigo.6'},
                    {name: 'previous week', color: 'gray.6'},
                ]}
            />
        </Paper>
    )
}
