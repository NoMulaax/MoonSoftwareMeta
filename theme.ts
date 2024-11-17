'use client'

import {createTheme, rem} from "@mantine/core";

export const theme = createTheme({
    fontFamily: 'Inter, sans-serif',
    headings: {fontFamily: 'Inter, sans-serif'},
    breakpoints: {
        xs: '30em', // 480px
        sm: '48em', // 768px
        md: '64em', // 1024px
        lg: '74em', // 1184px
        xl: '90em', // 1440px
    },
    colors: {
        'primary': [
            '#1b1e5d', '#202470', '#272b86', '#2f34a1', '#383fc2',
            '#444ce9', // primary
            '#515bff', '#616dff', '#7583ff', '#8d9dff'
        ],
        'black': [
            '#0E0F12',
            '#1B1C1F',
            '#28292C',
            '#35363A',
            '#424348',
            '#4F5056',
            '#5C5D64',
            '#696A72',
            '#767780',
            '#83848D'
        ],
        'white': [
            '#ffffff',
            '#f2f2f2',
            '#e5e5e5',
            '#d8d8d8',
            '#cccccc',
            '#bfbfbf',
            '#b3b3b3',
            '#a6a6a6',
            '#999999',
            '#8c8c8c',
        ],
        'dark': [
            "#d5d8e0",
            "#929fab",
            "#828b8d",
            "#686e75",
            "#525a62",
            "#424b4d",
            "#282828",
            "#323232",
            "#1C1C1C",
            "#000000"
        ]
    },
    primaryColor: 'primary',
    defaultRadius: 7,
    respectReducedMotion: false,
    components: {
        Tabs: {
            styles: {
                tab: {
                    border: "none",
                    padding: 0,
                },
                tabLabel: {
                    fontSize: rem(14),
                }
            }
        },
        Modal: {
            defaultProps: {
                transitionProps: {transition: 'pop', duration: 150},
                centered: true,
                radius: 5,
                bg: "dark.9",
            },
            styles: {
                title: {
                    fontSize: "1rem",
                    fontWeight: 600,
                },
                body: {
                    padding: "1rem 1.4rem",
                }
            }
        },
        DateTimePicker: {
            defaultProps: {
                withAsterisk: false,
            }
        },
        Input: {
            styles: {
                input: {
                    backgroundColor: "var(--mantine-color-dark-6)",
                    fontSize: 14,
                    borderColor: "var(--mantine-color-dark-7)",
                },
            },
        },
        NumberInput: {
            defaultProps: {
                withAsterisk: false,
                thousandSeparator: ",",
                decimalSeparator: ".",
            },
        },
        TextInput: {
            defaultProps: {
                withAsterisk: false,
            },
        },
        Skeleton: {
            defaultProps: {
                radius: 7,
            },
        },
        Paper: {
            defaultProps: {
                p: '1.2rem',
                radius: 16,
                bg: "dark.6"
            },
            styles: {
                root: {
                    border: "none",
                }
            }
        },
        Text: {
            defaultProps: {
                fw: 500,
            },
        },
        Loader: {
            defaultProps: {
                type: 'dots',
                size: 'xs',
            },
        },
        Avatar: {
            defaultProps: {
                radius: '50%',
            },
        },
        Pagination: {
            classNames: {
                control: 'threeDimensionalShadow',
            },
        },
        Progress: {
            defaultProps: {
                striped: true,
                animated: true,
            }
        },
        Button: {
            defaultProps: {
                color: 'white.0',
                c: "dark.9",
                loaderProps: {
                    color: 'dark.9',
                }
            },
            styles: {
                root: {
                    transition: "80ms ease-in-out"
                },
                label: {
                    fontWeight: 400,
                    fontSize: "0.85rem"
                }
            },
            classNames: {
                root: 'threeDimensionalShadow'
            },
        },
        Menu: {
            defaultProps: {
                transitionProps: {transition: 'pop', duration: 150},
            },
            styles: {
                dropdown: {
                    border: "none",
                    padding: "0.6rem",
                    backgroundColor: "var(--mantine-color-dark-9)",
                },
                itemLabel: {
                    fontSize: rem(14)
                }
            }
        },
        NumberFormatter: {
            defaultProps: {
                thousandSeparator: ",",
                decimalSeparator: ".",
            }
        }
    },


});
