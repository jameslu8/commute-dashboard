// 你的公開 JSON 檔案 URL
const DATA_URL = 'https://storage.googleapis.com/commute-data-public-james/commute_data.json';

// 定義星期和小時的標籤
const days = ['週一', '週二', '週三', '週四', '週五', '週六', '週日'];
const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);

async function fetchDataAndRenderChart() {
    try {
        const response = await fetch(DATA_URL + `?t=${new Date().getTime()}`); // 加上時間戳避免瀏覽器快取
        const data = await response.json();

        // 將資料轉換成 Chart.js 熱圖需要的格式
        const chartData = [];
        data.forEach(row => {
            for (let hour = 0; hour < 24; hour++) {
                // row['DayOfWeek'] 是 0-6，對應我們的 days 陣列
                // row[hour] 是該小時的平均時間，如果沒有數據會是 null
                if (row[hour] !== null && row[hour] !== undefined) {
                    chartData.push({
                        x: hour, // X 軸是小時
                        y: row['DayOfWeek'], // Y 軸是星期
                        v: row[hour] // 值是通勤時間
                    });
                }
            }
        });

        renderHeatmap(chartData);
        document.getElementById('last-updated').textContent = new Date().toLocaleString('zh-TW');

    } catch (error) {
        console.error('無法獲取或渲染圖表:', error);
        document.getElementById('last-updated').textContent = '資料讀取失敗';
    }
}

function renderHeatmap(data) {
    const ctx = document.getElementById('heatmap').getContext('2d');

    new Chart(ctx, {
        type: 'matrix',
        data: {
            datasets: [{
                label: '平均行車時間 (分鐘)',
                data: data,
                backgroundColor: function(context) {
                    const value = context.dataset.data[context.dataIndex].v;
                    if (value < 25) return 'rgba(75, 192, 192, 0.6)'; // 綠色 (順暢)
                    if (value < 35) return 'rgba(255, 206, 86, 0.6)'; // 黃色 (略塞)
                    if (value < 45) return 'rgba(255, 159, 64, 0.6)'; // 橘色 (塞)
                    return 'rgba(255, 99, 132, 0.6)';     // 紅色 (很塞)
                },
                borderColor: 'rgba(255, 255, 255, 1)',
                borderWidth: 1,
                width: ({chart}) => (chart.chartArea || {}).width / 24 - 1,
                height: ({chart}) => (chart.chartArea || {}).height / 7 - 1
            }]
        },
        options: {
            scales: {
                x: {
                    type: 'category',
                    labels: hours,
                    ticks: {
                        stepSize: 1
                    }
                },
                y: {
                    type: 'category',
                    labels: days,
                    offset: true
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        title: function(context) {
                            const dayIndex = context[0].parsed.y;
                            const hourIndex = context[0].parsed.x;
                            return `${days[dayIndex]} ${hours[hourIndex]}`;
                        },
                        label: function(context) {
                            const value = context.raw.v;
                            return `平均時間: ${value} 分鐘`;
                        }
                    }
                }
            }
        }
    });
}

// 網頁載入後立即執行
fetchDataAndRenderChart();