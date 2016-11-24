$(function () {
    $.getJSON('/api/v1/plugins/' + getPluginId() + '/charts', function (charts) { // Get all charts of the plugin
        for (var chart in charts) {
            if (!charts.hasOwnProperty(chart)) {
                continue;
            }
            switch (charts[chart].type) {
                case 'simple_pie':
                case 'advanced_pie':
                    handlePieChart(chart, charts[chart]);
                    break;
                case 'drilldown_pie':
                    handleDrilldownPieChart(chart, charts[chart]);
                    break;
                case 'single_linechart':
                    handleLineChart(chart, charts[chart]);
                    break;
                case 'simple_map':
                case 'advanced_map':
                    handleMapChart(chart, charts[chart]);
                    break;
                default:
                    break;
            }
        }
    });
});

function handlePieChart(chartId, chart) {
    $.getJSON('/api/v1/plugins/' + getPluginId() + '/charts/' + chartId + '/data', function (data) {
        $('#' + chartId + 'Pie').highcharts({
            chart: {
                plotBackgroundColor: null,
                plotBorderWidth: null,
                plotShadow: false,
                type: 'pie'
            },
            title: {
                text: '<a href="#' + chartId + '" style="text-decoration: none; color: inherit;">' + chart.title + '</a>'
            },
            tooltip: {
                headerFormat: '<span style="font-size: 18px"><u><b>{point.key}</b></u></span><br/>',
                pointFormat: '<b>Share</b>: {point.percentage:.1f} %<br><b>Total</b>: {point.y}'
            },
            exporting: {
                enabled: false
            },
            plotOptions: {
                pie: {
                    size: 180,
                    allowPointSelect: true,
                    cursor: 'pointer',
                    dataLabels: {
                        enabled: $(window).width() > 600,
                        format: '<b>{point.name}</b>: {point.percentage:.1f} %',
                        style: {
                            color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black'
                        }
                    },
                    showInLegend: $(window).width() <= 600
                }
            },
            series: [{
                name: chart.title,
                colorByPoint: true,
                data: data
            }]
        });
    });
}

function handleDrilldownPieChart(chartId, chart) {
    $.getJSON('/api/v1/plugins/' + getPluginId() + '/charts/' + chartId + '/data', function (data) {
        $('#' + chartId + 'Pie').highcharts({
            chart: {
                type: 'pie'
            },
            title: {
                text: '<a href="#' + chartId + '" style="text-decoration: none; color: inherit;">' + chart.title + '</a>'
            },
            subtitle: {
                text: 'Click the slices to view details.'
            },
            plotOptions: {
                pie: {
                    size: 180,
                    allowPointSelect: true,
                    cursor: 'pointer',
                    dataLabels: {
                        enabled: $(window).width() > 600,
                        format: '<b>{point.name}</b>: {point.percentage:.1f} %',
                        style: {
                            color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black'
                        }
                    },
                    showInLegend: $(window).width() <= 600
                }
            },
            tooltip: {
                headerFormat: '<span style="font-size: 18px"><u><b>{point.key}</b></u></span><br/>',
                pointFormat: '<b>Share</b>: {point.percentage:.1f} %<br><b>Total</b>: {point.y}'
            },
            exporting: {
                enabled: false
            },
            series: [{
                name: chart.title,
                colorByPoint: true,
                data: data.seriesData
            }],
            drilldown: {
                series: data.drilldownData
            }
        });
    });
}

function handleLineChart(chartId, chart) {
    $.getJSON('/api/v1/plugins/' + getPluginId() + '/charts/' + chartId + '/data', function (data) {
        $('#' + chartId + 'LineChart').highcharts('StockChart', {

            chart:{
                zoomType: 'x'
            },

            rangeSelector: {
                buttons: [{
                    type: 'day',
                    count: 1,
                    text: '1d'
                }, {
                    type: 'day',
                    count: 3,
                    text: '3d'
                }, {
                    type: 'week',
                    count: 1,
                    text: '1w'
                }, {
                    type: 'month',
                    count: 1,
                    text: '1m'
                }, {
                    type: 'month',
                    count: 6,
                    text: '6m'
                }, {
                    type: 'year',
                    count: 1,
                    text: '1y'
                }, {
                    type: 'all',
                    text: 'All'
                }],
                selected: 3
            },

            exporting: {
                buttons: [
                    {
                        _id: 'signatureImage',
                        symbol: 'diamond',
                        symbolFill: '#B5C9DF',
                        hoverSymbolFill: '#779ABF',
                        onclick: function() {
                            alert('Coming soon™!')
                        },
                        _titleKey: "signatureImageTitle"
                    }
                ]
            },

            yAxis: {
                min: 0,
                labels: {
                    formatter: function () {
                        if (this.value % 1 != 0) {
                            return "";
                        } else {
                            return this.value;
                        }
                    }
                }
            },

            title : {
                text : '<a href="#' + chartId + '" style="text-decoration: none; color: inherit;">' + chart.title + '</a>'
            },

            plotOptions:{
                series:{
                    turboThreshold: 0 // disable the 1000 limit
                }
            },

            series : [{
                name : chart.data.lineName,
                data : data,
                type: 'spline',
                tooltip: {
                    valueDecimals: 0
                }
            }]
        });
    });
}

function handleMapChart(chartId, chart) {
    $.getJSON('/api/v1/plugins/' + getPluginId() + '/charts/' + chartId + '/data', function (data) {
        // Add lower case codes to the data set for inclusion in the tooltip.pointFormat
        $.each(data, function () {
            this.flag = this.code.replace('UK', 'GB').toLowerCase();
        });

        // Initiate the chart
        $('#' + chartId + 'Map').highcharts('Map', {

            title: {
                text: '<a href="#' + chartId + '" style="text-decoration: none; color: inherit;">' + chart.title + '</a>'
            },

            legend: {
                title: {
                    text: chart.data.valueName,
                    style: {
                        color: (Highcharts.theme && Highcharts.theme.textColor) || 'black'
                    }
                }
            },

            exporting: {
                enabled: false
            },

            mapNavigation: {
                enabled: true,
                enableMouseWheelZoom: false,
                buttonOptions: {
                    verticalAlign: 'bottom'
                }
            },

            tooltip: {
                backgroundColor: 'none',
                borderWidth: 0,
                shadow: false,
                useHTML: true,
                padding: 0,
                pointFormat: '<span class="f32"><span class="flag {point.flag}"></span></span>' +
                ' {point.name}: <b>{point.value}</b>',
                positioner: function () {
                    return { x: 0, y: 250 };
                }
            },

            colorAxis: {
                min: 1,
                max: 5000,
                type: 'logarithmic',
                minColor: '#FFCDD2',
                maxColor: '#B71C1C'
            },

            series : [{
                data : data,
                mapData: Highcharts.maps['custom/world'],
                joinBy: ['iso-a2', 'code'],
                name: chart.data.valueName,
                color: '#F44336',
                shadow: false,
                states: {
                    hover: {
                        color: '#B71C1C'
                    }
                }
            }]
        });
    });
}