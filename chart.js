const chartContainer = document.getElementById('chart-container');
const symbolSelect = document.getElementById('symbol-select');
const timeframeSelect = document.getElementById('timeframe-select');
const settingsIcon = document.getElementById('settings-icon');
const settingsPanel = document.getElementById('settings-panel');
const bullishBodyColorInput = document.getElementById('bullish-body-color');
const bullishShadowColorInput = document.getElementById('bullish-shadow-color');
const bearishBodyColorInput = document.getElementById('bearish-body-color');
const bearishShadowColorInput = document.getElementById('bearish-shadow-color');
const backgroundColorInput = document.getElementById('background-color');
const textColorInput = document.getElementById('text-color');
const gridColorInput = document.getElementById('grid-color');
const applySettingsButton = document.getElementById('apply-settings');
const gridColor = gridColorInput.value;
let chart, candleSeries;
let symbol = 'BTCUSDT';
let timeframe = '15m';
let allData = [];

function initChart() {
    chart = LightweightCharts.createChart(chartContainer, {
        width: chartContainer.clientWidth,
        height: chartContainer.clientHeight,
        layout: {
            backgroundColor: backgroundColorInput.value,
            textColor: 'rgba(33, 56, 77, 1)',
        },
        grid: {
            vertLines: {
                color: gridColor,
            },
            horzLines: {
                color: gridColor,
            },
        },
        timeScale: {
            timeVisible: true,
            secondsVisible: true,
        },
    });

    candleSeries = chart.addCandlestickSeries({
        upColor: bullishBodyColorInput.value,
        downColor: bearishBodyColorInput.value,
        borderVisible: false,
        wickUpColor: bullishShadowColorInput.value,
        wickDownColor: bearishShadowColorInput.value,
    });

    console.log("Chart initialized");
}

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

const resizeChart = debounce(() => {
    if (chart) {
        chart.applyOptions({
            width: chartContainer.clientWidth,
            height: chartContainer.clientHeight
        });
    }
}, 200);

async function getHistoricalData(startTime = null) {
    let url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${timeframe}&limit=200`;
    if (startTime) {
        url += `&endTime=${startTime}`;
    }
    console.log("Fetching data from:", url);
    const response = await fetch(url);
    const data = await response.json();
    return data.map(d => ({
        time: d[0] / 1000,
        open: parseFloat(d[1]),
        high: parseFloat(d[2]),
        low: parseFloat(d[3]),
        close: parseFloat(d[4])
    })).sort((a, b) => a.time - b.time);
}

async function loadInitialData() {
    allData = await getHistoricalData();
    console.log("Initial data loaded:", allData.length, "candles");
    if (candleSeries) {
        candleSeries.setData(allData);
        chart.timeScale().fitContent();
    } else {
        console.error("Candle series not initialized");
    }
}

let isLoadingMore = false;

async function loadMoreData() {
    if (isLoadingMore) return;
    isLoadingMore = true;
    const firstCandle = allData[0];
    if (!firstCandle) return;

    try {
        const moreData = await getHistoricalData(firstCandle.time * 1000);
        
        const uniqueNewData = moreData.filter(newCandle => 
            !allData.some(existingCandle => existingCandle.time === newCandle.time)
        );
        
        if (uniqueNewData.length > 0) {
            allData = [...uniqueNewData, ...allData];
            console.log("More data loaded, new candles:", uniqueNewData.length, "total candles:", allData.length);
            if (candleSeries) {
                candleSeries.setData(allData);
            } else {
                console.error("Candle series not initialized");
            }
        } else {
            console.log("No new data to load");
        }
    } catch (error) {
        console.error("Error loading more data:", error);
    } finally {
        isLoadingMore = false;
    }
}

function initWebSocket() {
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_${timeframe}`);

    ws.onmessage = function (event) {
        const data = JSON.parse(event.data);
        const candle = data.k;
        
        const updatedCandle = {
            time: candle.t / 1000,
            open: parseFloat(candle.o),
            high: parseFloat(candle.h),
            low: parseFloat(candle.l),
            close: parseFloat(candle.c)
        };

        const existingCandleIndex = allData.findIndex(c => c.time === updatedCandle.time);
        if (existingCandleIndex !== -1) {
            allData[existingCandleIndex] = updatedCandle;
        } else {
            allData.push(updatedCandle);
        }

        if (candleSeries) {
            candleSeries.update(updatedCandle);
        } else {
            console.error("Candle series not initialized");
        }
    };

    return ws;
}

let ws;

async function changeSymbolOrTimeframe() {
    symbol = symbolSelect.value;
    timeframe = timeframeSelect.value;
    
    if (ws) {
        ws.close();
    }

    allData = [];
    if (candleSeries) {
        candleSeries.setData([]);
    } else {
        console.error("Candle series not initialized");
    }
    await loadInitialData();
    ws = initWebSocket();
}

window.addEventListener('resize', resizeChart);

symbolSelect.addEventListener('change', changeSymbolOrTimeframe);
timeframeSelect.addEventListener('change', changeSymbolOrTimeframe);

settingsIcon.addEventListener('click', () => {
    settingsPanel.style.display = settingsPanel.style.display === 'none' ? 'block' : 'none';
});

applySettingsButton.addEventListener('click', () => {
    const bullishBodyColor = bullishBodyColorInput.value;
    const bullishShadowColor = bullishShadowColorInput.value;
    const bearishBodyColor = bearishBodyColorInput.value;
    const bearishShadowColor = bearishShadowColorInput.value;
    const backgroundColor = backgroundColorInput.value;
    const textColor = textColorInput.value;
    const gridColor = gridColorInput.value;


    if (candleSeries) {
        candleSeries.applyOptions({
            upColor: bullishBodyColor,
            downColor: bearishBodyColor,
            borderVisible: false,
            wickUpColor: bullishShadowColor,
            wickDownColor: bearishShadowColor,
        });
    }

    if (chart) {
        chart.applyOptions({
            layout: {
                textColor: textColor, background: { type: 'solid', color: backgroundColor }
            },
            grid: {
                vertLines: {
                    color: gridColor,
                },
                horzLines: {
                    color: gridColor,
                }
            }
        });
    }

    settingsPanel.style.display = 'none';
});

function setupChartEvents() {
    if (chart) {
        chart.timeScale().subscribeVisibleLogicalRangeChange(() => {
            const logicalRange = chart.timeScale().getVisibleLogicalRange();
            if (logicalRange !== null && !isLoadingMore) {
                const barsInfo = candleSeries.barsInLogicalRange(logicalRange);
                if (barsInfo !== null && barsInfo.barsBefore < 50) {
                    loadMoreData();
                }
            }
        });
    } else {
        console.error("Chart not initialized");
    }
}

initChart();
loadInitialData().then(() => {
    ws = initWebSocket();
    setupChartEvents(); 
});
