/*
 * This class exists to populate the redis database before the first start.
 * Run it only once.
 */
const databaseManager = require('./util/databaseManager');

const charts = [
    {
        uid: 1,
        id: 'javaVersion',
        type: 'drilldown_pie',
        position: 9,
        title: 'Java Version',
        default: true,
        data: {
            filter: {
                enabled: false,
                useRegex: false,
                blacklist: false,
                filter: []
            }
        }
    },
    {
        uid: 2,
        id: 'os',
        type: 'drilldown_pie',
        position: 7,
        title: 'Operating System',
        default: true,
        data: {
            filter: {
                enabled: false,
                useRegex: false,
                blacklist: false,
                filter: []
            }
        }
    },
    {
        uid: 3,
        id: 'servers',
        type: 'single_linechart',
        position: 0,
        title: 'Servers',
        default: true,
        data: {
            lineName: 'Servers',
            filter: {
                enabled: false,
                maxValue: 2147483647,
                minValue: -2147483647
            }
        }
    },
    {
        uid: 4,
        id: 'players',
        type: 'single_linechart',
        position: 1,
        title: 'Players',
        default: true,
        data: {
            lineName: 'Players',
            filter: {
                enabled: false,
                maxValue: 2147483647,
                minValue: -2147483647
            }
        }
    },
    {
        uid: 5,
        id: 'onlineMode',
        type: 'simple_pie',
        position: 2,
        title: 'Online mode',
        default: true,
        data: {
            filter: {
                enabled: false,
                useRegex: false,
                blacklist: false,
                filter: []
            }
        }
    },
    {
        uid: 6,
        id: 'minecraftVersion',
        type: 'simple_pie',
        position: 3,
        title: 'Minecraft Version',
        default: true,
        data: {
            filter: {
                enabled: false,
                useRegex: false,
                blacklist: false,
                filter: []
            }
        }
    },
    {
        uid: 32,
        id: 'serverSoftware',
        type: 'simple_pie',
        position: 4,
        title: 'Server Software',
        default: true,
        data: {
            filter: {
                enabled: false,
                useRegex: false,
                blacklist: false,
                filter: []
            }
        }
    },
    {
        uid: 8,
        id: 'coreCount',
        type: 'simple_pie',
        position: 5,
        title: 'Core count',
        default: true,
        data: {
            filter: {
                enabled: false,
                useRegex: false,
                blacklist: false,
                filter: []
            }
        }
    },
    {
        uid: 8,
        id: 'osArch',
        type: 'simple_pie',
        position: 6,
        title: 'System arch',
        default: true,
        data: {
            filter: {
                enabled: false,
                useRegex: false,
                blacklist: false,
                filter: []
            }
        }
    },
    {
        uid: 9,
        id: 'location',
        type: 'simple_pie',
        position: 8,
        title: 'Server Location',
        default: true,
        data: {
            filter: {
                enabled: false,
                useRegex: false,
                blacklist: false,
                filter: []
            }
        }
    },
    {
        uid: 10,
        id: 'locationMap',
        type: 'simple_map',
        position: 10,
        title: 'Server Location',
        default: true,
        data: {
            valueName: 'Servers',
            filter: {
                enabled: false,
                useRegex: false,
                blacklist: false,
                filter: []
            }
        }
    },
    {
        uid: 11,
        id: 'servers',
        type: 'single_linechart',
        position: 0,
        title: 'Servers',
        default: true,
        data: {
            lineName: 'Servers',
            filter: {
                enabled: false,
                maxValue: 1,
                minValue: 1
            }
        }
    },
    {
        uid: 12,
        id: 'osArch',
        type: 'simple_pie',
        position: 5,
        title: 'System arch',
        default: true,
        data: {
            filter: {
                enabled: false,
                useRegex: false,
                blacklist: false,
                filter: []
            }
        }
    },
    {
        uid: 13,
        id: 'coreCount',
        type: 'simple_pie',
        position: 4,
        title: 'Core count',
        default: true,
        data: {
            filter: {
                enabled: true,
                useRegex: true,
                blacklist: false,
                filter: [
                    '([0-9]){1,2}'
                ]
            }
        }
    },
    {
        uid: 14,
        id: 'onlineMode',
        type: 'simple_pie',
        position: 2,
        title: 'Online mode',
        default: true,
        data: {
            filter: {
                enabled: false,
                useRegex: false,
                blacklist: false,
                filter: []
            }
        }
    },
    {
        uid: 15,
        id: 'players',
        type: 'single_linechart',
        position: 1,
        title: 'Players',
        default: true,
        data: {
            lineName: 'Players',
            filter: {
                enabled: true,
                maxValue: 200,
                minValue: 0
            }
        }
    },
    {
        uid: 16,
        id: 'location',
        type: 'simple_pie',
        position: 7,
        title: 'Server Location',
        default: true,
        data: {
            filter: {
                enabled: false,
                useRegex: false,
                blacklist: false,
                filter: []
            }
        }
    },
    {
        uid: 17,
        id: 'os',
        type: 'drilldown_pie',
        position: 6,
        title: 'Operating System',
        default: true,
        data: {
            filter: {
                enabled: false,
                useRegex: false,
                blacklist: false,
                filter: []
            }
        }
    },
    {
        uid: 18,
        id: 'minecraftVersion',
        type: 'simple_pie',
        position: 3,
        title: 'Minecraft Version',
        default: true,
        data: {
            filter: {
                enabled: false,
                useRegex: false,
                blacklist: false,
                filter: []
            }
        }
    },
    {
        uid: 19,
        id: 'locationMap',
        type: 'simple_map',
        position: 9,
        title: 'Server Location',
        default: true,
        data: {
            valueName: 'Servers',
            filter: {
                enabled: false,
                useRegex: false,
                blacklist: false,
                filter: []
            }
        }
    },
    {
        uid: 20,
        id: 'javaVersion',
        type: 'drilldown_pie',
        position: 8,
        title: 'Java Version',
        default: true,
        data: {
            filter: {
                enabled: false,
                useRegex: false,
                blacklist: false,
                filter: []
            }
        }
    },
    {
        uid: 21,
        id: 'location',
        type: 'simple_pie',
        position: 8,
        title: 'Server Location',
        default: true,
        data: {
            filter: {
                enabled: false,
                useRegex: false,
                blacklist: false,
                filter: []
            }
        }
    },
    {
        uid: 22,
        id: 'servers',
        type: 'single_linechart',
        position: 0,
        title: 'Proxy Servers',
        default: true,
        data: {
            lineName: 'Servers',
            filter: {
                enabled: false,
                maxValue: 1,
                minValue: 1
            }
        }
    },
    {
        uid: 23,
        id: 'players',
        type: 'single_linechart',
        position: 2,
        title: 'Players',
        default: true,
        data: {
            lineName: 'Players',
            filter: {
                enabled: true,
                maxValue: 200,
                minValue: 0
            }
        }
    },
    {
        uid: 24,
        id: 'managed_servers',
        type: 'single_linechart',
        position: 1,
        title: 'Managed Servers',
        default: true,
        data: {
            lineName: 'Servers',
            filter: {
                enabled: true,
                maxValue: 25,
                minValue: 0
            }
        }
    },
    {
        uid: 25,
        id: 'onlineMode',
        type: 'simple_pie',
        position: 3,
        title: 'Online mode',
        default: true,
        data: {
            filter: {
                enabled: false,
                useRegex: false,
                blacklist: false,
                filter: []
            }
        }
    },
    {
        uid: 26,
        id: 'bungeecordVersion',
        type: 'simple_pie',
        position: 4,
        title: 'Bungeecord Version',
        default: true,
        data: {
            filter: {
                enabled: false,
                useRegex: false,
                blacklist: false,
                filter: []
            }
        }
    },
    {
        uid: 27,
        id: 'coreCount',
        type: 'simple_pie',
        position: 5,
        title: 'Core count',
        default: true,
        data: {
            filter: {
                enabled: true,
                useRegex: true,
                blacklist: false,
                filter: [
                    '([0-9]){1,2}'
                ]
            }
        }
    },
    {
        uid: 28,
        id: 'osArch',
        type: 'simple_pie',
        position: 6,
        title: 'System arch',
        default: true,
        data: {
            filter: {
                enabled: false,
                useRegex: false,
                blacklist: false,
                filter: []
            }
        }
    },
    {
        uid: 29,
        id: 'os',
        type: 'drilldown_pie',
        position: 7,
        title: 'Operating System',
        default: true,
        data: {
            filter: {
                enabled: false,
                useRegex: false,
                blacklist: false,
                filter: []
            }
        }
    },
    {
        uid: 30,
        id: 'javaVersion',
        type: 'drilldown_pie',
        position: 9,
        title: 'Java Version',
        default: true,
        data: {
            filter: {
                enabled: false,
                useRegex: false,
                blacklist: false,
                filter: []
            }
        }
    },
    {
        uid: 31,
        id: 'locationMap',
        type: 'simple_map',
        position: 10,
        title: 'Server Location',
        default: true,
        data: {
            valueName: 'Servers',
            filter: {
                enabled: false,
                useRegex: false,
                blacklist: false,
                filter: []
            }
        }
    }
];

const plugins = [
    {
        id: 1,
        name: '_bukkit_',
        owner: 'Admin',
        software: 1,
        global: true,
        charts: [1,2,3,4,5,6,7,8,9,10,32]
    },
    {
        id: 2,
        name: '_bungeecord_',
        owner: 'Admin',
        software: 2,
        global: true,
        charts: [21,22,23,24,25,26,27,28,29,30,31]
    },
    {
        id: 3,
        name: '_sponge_',
        owner: 'Admin',
        software: 3,
        global: true,
        charts: [11,12,13,14,15,16,17,18,19,20]
    }
];

const serverSoftware = [
    {
        id: 1,
        name: 'Bukkit / Spigot',
        url: 'bukkit',
        globalPlugin: 1,
        defaultCharts: [
            {
                type: 'single_linechart',
                id: 'servers',
                title: 'Servers using %plugin.name%',
                data: {
                    lineName: 'Servers',
                    filter: {
                        enabled: false,
                        maxValue: 1,
                        minValue: 1
                    }
                },
                requestParser: {
                    predefinedValue: 1
                }
            },
            {
                type: 'single_linechart',
                id: 'players',
                title: 'Players on servers using %plugin.name%',
                data: {
                    lineName: 'Players',
                    filter: {
                        enabled: true,
                        maxValue: 200,
                        minValue: 0
                    }
                },
                requestParser: {
                    nameInRequest: 'playerAmount',
                    type: 'number',
                    position: 'global'
                }
            },
            {
                type: 'simple_pie',
                id: 'onlineMode',
                title: 'Online mode',
                data: {
                    filter: {
                        enabled: false,
                        useRegex: false,
                        blacklist: false,
                        filter: []
                    }
                },
                requestParser: {
                    nameInRequest: 'onlineMode',
                    position: 'global',
                    type: 'boolean',
                    trueValue: 'online',
                    falseValue: 'offline'
                }
            },
            {
                type: 'simple_pie',
                id: 'minecraftVersion',
                title: 'Minecraft Version',
                data: {
                    filter: {
                        enabled: false,
                        useRegex: false,
                        blacklist: false,
                        filter: []
                    }
                },
                requestParser: {
                    useHardcodedParser: 'bukkitMinecraftVersion',
                    position: 'global'
                }
            },
            {
                type: 'simple_pie',
                id: 'serverSoftware',
                title: 'Server Software',
                data: {
                    filter: {
                        enabled: false,
                        useRegex: false,
                        blacklist: false,
                        filter: []
                    }
                },
                requestParser: {
                    useHardcodedParser: 'bukkitServerSoftware',
                    position: 'global'
                }
            },
            {
                type: 'simple_pie',
                id: 'pluginVersion',
                title: 'Plugin Version',
                data: {
                    filter: {
                        enabled: false,
                        useRegex: false,
                        blacklist: false,
                        filter: []
                    }
                },
                requestParser: {
                    nameInRequest: 'pluginVersion',
                    position: 'plugin'
                }
            },
            {
                type: 'simple_pie',
                id: 'coreCount',
                title: 'Core count',
                data: {
                    filter: {
                        enabled: true,
                        useRegex: true,
                        blacklist: false,
                        filter: ['([0-9]){1,2}']
                    }
                },
                requestParser: {
                    nameInRequest: 'coreCount',
                    type: 'number',
                    position: 'global'
                }
            },
            {
                type: 'simple_pie',
                id: 'osArch',
                title: 'System arch',
                data: {
                    filter: {
                        enabled: false,
                        useRegex: false,
                        blacklist: false,
                        filter: []
                    }
                },
                requestParser: {
                    nameInRequest: 'osArch',
                    position: 'global'
                }
            },
            {
                type: 'drilldown_pie',
                id: 'os',
                title: 'Operating System',
                data: {
                    filter: {
                        enabled: false,
                        useRegex: false,
                        blacklist: false,
                        filter: []
                    }
                },
                requestParser: {
                    position: 'global',
                    useHardcodedParser: 'os'
                }
            },
            {
                type: 'simple_pie',
                id: 'location',
                title: 'Server Location',
                data: {
                    filter: {
                        enabled: false,
                        useRegex: false,
                        blacklist: false,
                        filter: []
                    }
                },
                requestParser: { predefinedValue: '%country.name%' }
            },
            {
                type: 'drilldown_pie',
                id: 'javaVersion',
                title: 'Java Version',
                data: {
                    filter: {
                        enabled: false,
                        useRegex: false,
                        blacklist: false,
                        filter: []
                    }
                },
                requestParser: {
                    useHardcodedParser: 'javaVersion',
                    position: 'global'
                }
            },
            {
                type: 'simple_map',
                id: 'locationMap',
                title: 'Server Location',
                data: {
                    valueName: 'Servers',
                    filter: {
                        enabled: false,
                        useRegex: false,
                        blacklist: false,
                        filter: []
                    }
                },
                requestParser: {
                    predefinedValue: 'AUTO'
                }
            }
        ],
        maxRequestsPerIp: 16,
        metricsClass: 'https://github.com/Bastian/bStats-Metrics/blob/master/bstats-bukkit/src/main/java/org/bstats/bukkit/Metrics.java',
        examplePlugin: 'https://github.com/Bastian/bStats-Metrics/blob/master/bstats-bukkit/src/examples/java/ExamplePlugin.java'
    },
    {
        id: 2,
        name: 'Bungeecord',
        url: 'bungeecord',
        globalPlugin: 2,
        defaultCharts: [
            {
                type: 'single_linechart',
                id: 'servers',
                title: 'Bungeecord Servers using %plugin.name%',
                data: {
                    lineName: 'Servers',
                    filter: {
                        enabled: false,
                        maxValue: 1,
                        minValue: 1
                    }
                },
                requestParser: {
                    predefinedValue: 1
                }
            },
            {
                type: 'single_linechart',
                id: 'players',
                title: 'Players on servers using %plugin.name%',
                data: {
                    lineName: 'Players',
                    filter: {
                        enabled: true,
                        maxValue: 800,
                        minValue: 0
                    }
                },
                requestParser: {
                    nameInRequest: 'playerAmount',
                    type: 'number',
                    position: 'global'
                }
            },
            {
                type: 'single_linechart',
                id: 'managed_servers',
                title: 'Servers managed by Bungeecord servers',
                data: {
                    lineName: 'Servers',
                    filter: {
                        enabled: true,
                        maxValue: 25,
                        minValue: 0
                    }
                },
                requestParser: {
                    nameInRequest: 'managedServers',
                    type: 'number',
                    position: 'global'
                }
            },
            {
                type: 'simple_pie',
                id: 'onlineMode',
                title: 'Online mode',
                data: {
                    filter: {
                        enabled: false,
                        useRegex: false,
                        blacklist: false,
                        filter: [

                        ]
                    }
                },
                requestParser: {
                    nameInRequest: 'onlineMode',
                    position: 'global',
                    type: 'boolean',
                    trueValue: 'online',
                    falseValue: 'offline'
                }
            },
            {
                type: 'simple_pie',
                id: 'bungeecordVersion',
                title: 'Bungeecord Version',
                data: {
                    filter: {
                        enabled: false,
                        useRegex: false,
                        blacklist: false,
                        filter: [

                        ]
                    }
                },
                requestParser: {
                    position: 'global',
                    useHardcodedParser: 'bungeecordVersion'
                }
            },
            {
                type: 'simple_pie',
                id: 'pluginVersion',
                title: 'Plugin Version',
                data: {
                    filter: {
                        enabled: false,
                        useRegex: false,
                        blacklist: false,
                        filter: [

                        ]
                    }
                },
                requestParser: {
                    nameInRequest: 'pluginVersion',
                    position: 'plugin'
                }
            },
            {
                type: 'simple_pie',
                id: 'coreCount',
                title: 'Core count',
                data: {
                    filter: {
                        enabled: true,
                        useRegex: true,
                        blacklist: false,
                        filter: [
                            '([0-9]){1,2}'
                        ]
                    }
                },
                requestParser: {
                    nameInRequest: 'coreCount',
                    type: 'number',
                    position: 'global'
                }
            },
            {
                type: 'simple_pie',
                id: 'osArch',
                title: 'System arch',
                data: {
                    filter: {
                        enabled: false,
                        useRegex: false,
                        blacklist: false,
                        filter: [

                        ]
                    }
                },
                requestParser: {
                    nameInRequest: 'osArch',
                    position: 'global'
                }
            },
            {
                type: 'drilldown_pie',
                id: 'os',
                title: 'Operating System',
                data: {
                    filter: {
                        enabled: false,
                        useRegex: false,
                        blacklist: false,
                        filter: [

                        ]
                    }
                },
                requestParser: {
                    position: 'global',
                    useHardcodedParser: 'os'
                }
            },
            {
                type: 'simple_pie',
                id: 'location',
                title: 'Server Location',
                data: {
                    filter: {
                        enabled: false,
                        useRegex: false,
                        blacklist: false,
                        filter: [

                        ]
                    }
                },
                requestParser: {
                    predefinedValue: '%country.name%'
                }
            },
            {
                type: 'drilldown_pie',
                id: 'javaVersion',
                title: 'Java Version',
                data: {
                    filter: {
                        enabled: false,
                        useRegex: false,
                        blacklist: false,
                        filter: [

                        ]
                    }
                },
                requestParser: {
                    useHardcodedParser: 'javaVersion',
                    position: 'global'
                }
            },
            {
                type: 'simple_map',
                id: 'locationMap',
                title: 'Server Location',
                data: {
                    valueName: 'Servers',
                    filter: {
                        enabled: false,
                        useRegex: false,
                        blacklist: false,
                        filter: [

                        ]
                    }
                },
                requestParser: {
                    predefinedValue: 'AUTO'
                }
            }
        ],
        maxRequestsPerIp: 4,
        metricsClass: 'https://github.com/Bastian/bStats-Metrics/blob/master/bstats-bungeecord/src/main/java/org/bstats/bungeecord/Metrics.java',
        examplePlugin: 'https://github.com/Bastian/bStats-Metrics/blob/master/bstats-bungeecord/src/examples/java/ExamplePlugin.java'
    },
    {
        id: 3,
        name: 'Sponge',
        url: 'sponge',
        globalPlugin: 3,
        defaultCharts: [
            {
                type: 'single_linechart',
                id: 'servers',
                title: 'Servers using %plugin.name%',
                data: {
                    lineName: 'Servers',
                    filter: {
                        enabled: false,
                        maxValue: 1,
                        minValue: 1
                    }
                },
                requestParser: {
                    predefinedValue: 1
                }
            },
            {
                type: 'single_linechart',
                id: 'players',
                title: 'Players on servers using %plugin.name%',
                data: {
                    lineName: 'Players',
                    filter: {
                        enabled: true,
                        maxValue: 200,
                        minValue: 0
                    }
                },
                requestParser: {
                    nameInRequest: 'playerAmount',
                    type: 'number',
                    position: 'global'
                }
            },
            {
                type: 'simple_pie',
                id: 'onlineMode',
                title: 'Online mode',
                data: {
                    filter: {
                        enabled: false,
                        useRegex: false,
                        blacklist: false,
                        filter: [

                        ]
                    }
                },
                requestParser: {
                    nameInRequest: 'onlineMode',
                    position: 'global',
                    type: 'boolean',
                    trueValue: 'online',
                    falseValue: 'offline'
                }
            },
            {
                type: 'simple_pie',
                id: 'minecraftVersion',
                title: 'Minecraft Version',
                data: {
                    filter: {
                        enabled: false,
                        useRegex: false,
                        blacklist: false,
                        filter: [

                        ]
                    }
                },
                requestParser: {
                    nameInRequest: 'minecraftVersion',
                    position: 'global'
                }
            },
            {
                type: 'simple_pie',
                id: 'pluginVersion',
                title: 'Plugin Version',
                data: {
                    filter: {
                        enabled: false,
                        useRegex: false,
                        blacklist: false,
                        filter: [

                        ]
                    }
                },
                requestParser: {
                    nameInRequest: 'pluginVersion',
                    position: 'plugin'
                }
            },
            {
                type: 'simple_pie',
                id: 'coreCount',
                title: 'Core count',
                data: {
                    filter: {
                        enabled: true,
                        useRegex: true,
                        blacklist: false,
                        filter: ['([0-9]){1,2}']
                    }
                },
                requestParser: {
                    nameInRequest: 'coreCount',
                    type: 'number',
                    position: 'global'
                }
            },
            {
                type: 'simple_pie',
                id: 'osArch',
                title: 'System arch',
                data: {
                    filter: {
                        enabled: false,
                        useRegex: false,
                        blacklist: false,
                        filter: [

                        ]
                    }
                },
                requestParser: {
                    nameInRequest: 'osArch',
                    position: 'global'
                }
            },
            {
                type: 'drilldown_pie',
                id: 'os',
                title: 'Operating System',
                data: {
                    filter: {
                        enabled: false,
                        useRegex: false,
                        blacklist: false,
                        filter: [

                        ]
                    }
                },
                requestParser: {
                    position: 'global',
                    useHardcodedParser: 'os'
                }
            },
            {
                type: 'simple_pie',
                id: 'location',
                title: 'Server Location',
                data: {
                    filter: {
                        enabled: false,
                        useRegex: false,
                        blacklist: false,
                        filter: [

                        ]
                    }
                },
                requestParser: {
                    predefinedValue: '%country.name%'
                }
            },
            {
                type: 'drilldown_pie',
                id: 'javaVersion',
                title: 'Java Version',
                data: {
                    filter: {
                        enabled: false,
                        useRegex: false,
                        blacklist: false,
                        filter: [

                        ]
                    }
                },
                requestParser: {
                    useHardcodedParser: 'javaVersion',
                    position: 'global'
                }
            },
            {
                type: 'simple_map',
                id: 'locationMap',
                title: 'Server Location',
                data: {
                    valueName: 'Servers',
                    filter: {
                        enabled: false,
                        useRegex: false,
                        blacklist: false,
                        filter: [

                        ]
                    }
                },
                requestParser: {
                    predefinedValue: 'AUTO'
                }
            }
        ],
        maxRequestsPerIp: 16,
        metricsClass: 'https://github.com/Bastian/bStats-Metrics/blob/master/bstats-sponge/src/main/java/org/bstats/sponge/Metrics.java',
        examplePlugin: 'https://github.com/Bastian/bStats-Metrics/blob/master/bstats-sponge/src/examples/java/ExamplePlugin.java'
    },
    {
        id: 4,
        name: 'Server Implementation',
        url: 'server-implementation',
        globalPlugin: null,
        defaultCharts: [
            {
                type: 'single_linechart',
                id: 'servers',
                title: 'Servers using %plugin.name%',
                data: {
                    lineName: 'Servers',
                    filter: {
                        enabled: false,
                        maxValue: 1,
                        minValue: 1
                    }
                },
                requestParser: {
                    predefinedValue: 1
                }
            },
            {
                type: 'simple_pie',
                id: 'coreCount',
                title: 'Core count',
                data: {
                    filter: {
                        enabled: true,
                        useRegex: true,
                        blacklist: false,
                        filter: [
                            '([0-9]){1,2}'
                        ]
                    }
                },
                requestParser: {
                    nameInRequest: 'coreCount',
                    type: 'number',
                    position: 'global'
                }
            },
            {
                type: 'simple_pie',
                id: 'osArch',
                title: 'System arch',
                data: {
                    filter: {
                        enabled: false,
                        useRegex: false,
                        blacklist: false,
                        filter: [

                        ]
                    }
                },
                requestParser: {
                    nameInRequest: 'osArch',
                    position: 'global'
                }
            },
            {
                type: 'drilldown_pie',
                id: 'os',
                title: 'Operating System',
                data: {
                    filter: {
                        enabled: false,
                        useRegex: false,
                        blacklist: false,
                        filter: [

                        ]
                    }
                },
                requestParser: {
                    position: 'global',
                    useHardcodedParser: 'os'
                }
            },
            {
                type: 'simple_pie',
                id: 'location',
                title: 'Server Location',
                data: {
                    filter: {
                        enabled: false,
                        useRegex: false,
                        blacklist: false,
                        filter: [

                        ]
                    }
                },
                requestParser: {
                    predefinedValue: '%country.name%'
                }
            },
            {
                type: 'simple_map',
                id: 'locationMap',
                title: 'Server Location',
                data: {
                    valueName: 'Servers',
                    filter: {
                        enabled: false,
                        useRegex: false,
                        blacklist: false,
                        filter: [

                        ]
                    }
                },
                requestParser: {
                    predefinedValue: 'AUTO'
                }
            }
        ],
        maxRequestsPerIp: 16,
        metricsClass: null,
        examplePlugin: null
    },
    {
        id: 5,
        name: 'Other',
        url: 'other',
        hideInPluginList: 1,
        globalPlugin: null,
        defaultCharts: [],
        maxRequestsPerIp: 100,
        metricsClass: null,
        examplePlugin: null
    }
];

const users = [
    {
        username: 'Admin',
        password: 'none',
        admin: true
    }
];

// Populate chart related stuff
populateCharts();
// Populate plugins
populatePlugins();
// Populate software
populateSoftware();
// Populate users
populateUsers();

/**
 * Populates the charts.* and charts:* keys.
 */
function populateCharts() {
    let largestChartUid = 0;
    for (let i = 0; i < charts.length; i++) {
        let data = {
            id: charts[i].id,
            type: charts[i].type,
            position: charts[i].position,
            title: charts[i].title,
            data: JSON.stringify(charts[i].data)
        };
        if (charts[i].default) {
            data.default = 1;
        }
        // Set chart
        databaseManager.getRedisCluster().hmset(`charts:${charts[i].uid}`, data, getCallbackFunction(`charts:${charts[i].uid}`));
        // Set index
        for (let j = 0; j < plugins.length; j++) {
            if (plugins[j].charts.indexOf(charts[i].uid) > -1) {
                databaseManager.getRedisCluster().set(
                    `charts.index.uid.pluginId+chartId:${plugins[j].id}.${charts[i].id}`, charts[i].uid,
                    getCallbackFunction(`charts.index.uid.pluginId+chartId:${plugins[j].id}.${charts[i].id}`)
                )
            }
        }
        // Add chart to uid set
        databaseManager.getRedisCluster().sadd(
            'charts.uids', charts[i].uid, getCallbackFunction(`Added ${charts[i].uid} to 'charts.uids'`, true)
        );

        largestChartUid = largestChartUid > charts[i].uid ? largestChartUid : charts[i].uid;
    }

    // Set chart uid increment
    databaseManager.getRedisCluster().set('charts.uid-increment', largestChartUid, getCallbackFunction('charts.uid-increment'));
}

/**
 * Populates the plugins.* and plugins:* keys.
 */
function populatePlugins() {
    let largestPluginId = 0;
    for (let i = 0; i < plugins.length; i++) {
        let data = {
            name: plugins[i].name,
            software: plugins[i].software,
            charts: JSON.stringify(plugins[i].charts),
            owner: plugins[i].owner
        };
        if (plugins[i].global) {
            data.global = 1;
        }
        // Set chart
        databaseManager.getRedisCluster().hmset(
            `plugins:${plugins[i].id}`, data, getCallbackFunction(`plugins:${plugins[i].id}`)
        );
        // Set index
        for (let j = 0; j < serverSoftware.length; j++) {
            if (serverSoftware[j].id === plugins[i].software) {
                databaseManager.getRedisCluster().set(
                    `plugins.index.id.url+name:${serverSoftware[j].url.toLowerCase()}.${plugins[i].name.toLowerCase()}`, plugins[i].id,
                    getCallbackFunction(`plugins.index.id.url+name:${serverSoftware[j].url.toLowerCase()}.${plugins[i].name.toLowerCase()}`)
                )
            }
        }
        // Add plugin to id set
        databaseManager.getRedisCluster().sadd(
            'plugins.ids', plugins[i].id, getCallbackFunction(`Added ${plugins[i].id} to 'plugins.ids'`, true)
        );

        // Add plugin to the owner's plugin list
        databaseManager.getRedisCluster().sadd(
            `users.index.plugins.username:${plugins[i].owner.toLowerCase()}`, plugins[i].id,
            getCallbackFunction(
                `Added ${plugins[i].id} to 'users.index.plugins.username:${plugins[i].owner.toLowerCase()}'`, true
            )
        );

        largestPluginId = largestPluginId > plugins[i].id ? largestPluginId : plugins[i].id;
    }

    // Set plugin id increment
    databaseManager.getRedisCluster().set(
        'plugins.id-increment', largestPluginId, getCallbackFunction('plugins.id-increment')
    );
}

/**
 * Populates the software.* and software:* keys.
 */
function populateSoftware() {
    let largestSoftwareId = 0;
    for (let i = 0; i < serverSoftware.length; i++) {
        let data = {
            name: serverSoftware[i].name,
            url: serverSoftware[i].url,
            maxRequestsPerIp: serverSoftware[i].maxRequestsPerIp,
            defaultCharts: JSON.stringify(serverSoftware[i].defaultCharts)
        };
        if (serverSoftware[i].globalPlugin !== null) {
            data.globalPlugin = serverSoftware[i].globalPlugin;
        }
        if (serverSoftware[i].metricsClass !== null) {
            data.metricsClass = serverSoftware[i].metricsClass;
        }
        if (serverSoftware[i].examplePlugin !== null) {
            data.examplePlugin = serverSoftware[i].examplePlugin;
        }
        // Set software
        databaseManager.getRedisCluster().hmset(
            `software:${serverSoftware[i].id}`, data, getCallbackFunction(`software:${serverSoftware[i].id}`)
        );
        // Set index
        databaseManager.getRedisCluster().set(
            `software.index.id.url:${serverSoftware[i].url.toLowerCase()}`, serverSoftware[i].id,
            getCallbackFunction(`software.index.id.url:${serverSoftware[i].url.toLowerCase()}`)
        );
        // Add software to id set
        databaseManager.getRedisCluster().sadd(
            'software.ids', serverSoftware[i].id, getCallbackFunction(`Added ${serverSoftware[i].id} to 'software.ids'`, true)
        );

        largestSoftwareId = largestSoftwareId > serverSoftware[i].id ? largestSoftwareId : serverSoftware[i].id;
    }

    // Set software id increment
    databaseManager.getRedisCluster().set(
        'software.id-increment', largestSoftwareId, getCallbackFunction('software.id-increment')
    );
}

/**
 * Populates the users.* and users:* keys.
 */
function populateUsers() {
    for (let i = 0; i < users.length; i++) {
        let data = {
            name: users[i].username,
            password: users[i].password
        };
        if (users[i].admin) {
            data.admin = 1;
        }
        // Set user
        databaseManager.getRedisCluster().hmset(
            `users:${users[i].username.toLowerCase()}`, data, getCallbackFunction(`users:${users[i].username.toLowerCase()}`)
        );

        // Add software to username set
        databaseManager.getRedisCluster().sadd(
            'users.usernames', users[i].username.toLowerCase(),
            getCallbackFunction(`Added ${users[i].username.toLowerCase()} to 'users.usernames'`, true)
        );
    }
}

/**
 * Gets a function used for the callback.
 *
 * @param text The name of the redis key or a custom text.
 * @param customText A boolean.
 * @returns {Function}
 */
function getCallbackFunction(text, customText) {
    return function (err, res) {
        if (err) {
            console.log(err);
        } else {
            if (customText) {
                console.log(text);
            } else {
                console.log(`Set key '${text}'`);
            }
        }
    };
}