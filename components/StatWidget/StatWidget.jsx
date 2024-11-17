import {Paper, Text} from "@mantine/core";
import Link from "next/link";
import {CountUp} from "use-count-up";

export default function StatWidget({title, value = 0, link, isMoney = false, currencyPrefix}) {
    return (<Paper maw="100%" miw="10rem" w="18rem" bg="indigo.1">
        <Text mb="0.4rem" size="sm" c="black">{title}</Text>
        <Text component={Link} href={link} c="black" fz="1.4rem">{isMoney ? currencyPrefix : ""}<CountUp decimalPlaces={0}
                                                                          formatter={(value) => value.toLocaleString("en-US", {maximumFractionDigits: 0})}
                                                                          isCounting end={value} duration={2.2}/></Text>
    </Paper>)
}