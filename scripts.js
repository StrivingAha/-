let scheduleData = [];

// 从 localStorage 中加载数据
function loadFromLocalStorage() {
    const storedData = localStorage.getItem('scheduleData');
    if (storedData) {
        scheduleData = JSON.parse(storedData);
        populateWeekSelect(); // 根据存储数据更新周次选择器
        displaySchedule(); // 直接展示课程表
        console.log("从 localStorage 加载的课程数据:", scheduleData);
    }
}

// 保存到 localStorage
function saveToLocalStorage(data) {
    localStorage.setItem('scheduleData', JSON.stringify(data));
}

function loadSchedule() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];

    if (!file) {
        alert('请上传一个课程表文件');
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
        
        loadScheduleData(jsonData);
    };
    reader.readAsArrayBuffer(file);
}

function loadScheduleData(data) {
    scheduleData = parseCourses(data);
    saveToLocalStorage(scheduleData); // 将解析后的数据保存到 localStorage
    populateWeekSelect(); // 加载后更新周次选择
    displaySchedule(); // 显示默认课程表
}

function parseCourses(data) {
    const parsedData = [];
    const days = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];

    const timeSlots = data.slice(1); // 从第2行开始读取
    
    timeSlots.forEach((row, rowIndex) => {
        const timeSlot = rowIndex + 1; // 直接使用 rowIndex + 1 作为节次
        
        row.slice(1).forEach((cell, colIndex) => {
            if (cell) {
                const courses = cell.split('<br/>'); // 按照换行符分割多个课程
                courses.forEach(course => {
                    const match = course.match(/(.+?)\[(\d+-\d+周|\d+周)\]\s(.+?)\[(.+?)\]/);
                    if (match) {
                        const weeks = match[2];
                        const [startWeek, endWeek] = weeks.includes('-') 
                            ? weeks.split('-').map(w => parseInt(w.replace('周', '').trim())) 
                            : [parseInt(weeks.replace('周', '').trim()), parseInt(weeks.replace('周', '').trim())];
                        
                        parsedData.push({
                            courseName: match[1],
                            weeks: `${startWeek}-${endWeek}`,
                            teacher: match[3],
                            location: match[4],
                            day: days[colIndex],
                            timeSlot: timeSlot
                        });
                    } else {
                        console.error("无法匹配课程信息:", course);
                    }
                });
            }
        });
    });

    console.log("解析后的课程数据:", parsedData);
    return parsedData;
}

function getMaxWeek() {
    let maxWeek = 0;
    
    scheduleData.forEach(course => {
        const weeks = course.weeks.split('-');
        const endWeek = parseInt(weeks[1].replace('周', '').trim());
        if (endWeek > maxWeek) {
            maxWeek = endWeek;
        }
    });

    return maxWeek;
}

function getMinWeek() {
    let minWeek = Infinity; // 使用 Infinity 以便找到最小值
    
    scheduleData.forEach(course => {
        const weeks = course.weeks.split('-');
        const startWeek = parseInt(weeks[0].replace('周', '').trim());
        if (startWeek < minWeek) {
            minWeek = startWeek;
        }
    });

    return minWeek === Infinity ? 0 : minWeek; // 如果没有找到，返回 0
}

function populateWeekSelect() {
    const weekSelect = document.getElementById('weekSelect');
    weekSelect.innerHTML = ''; // 清空现有选项
    
    const minWeek = getMinWeek(); // 获取最小周次
    const maxWeek = getMaxWeek(); // 获取最大周次
    for (let i = minWeek; i <= maxWeek; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `第${i}周`;
        weekSelect.appendChild(option);
    }
}

function displaySchedule() {
    const selectedWeek = parseInt(document.getElementById('weekSelect').value);
    const scheduleTableBody = document.getElementById('scheduleTable').querySelector('tbody');
    scheduleTableBody.innerHTML = ''; // 清空现有课程表数据

    const weekData = scheduleData.filter(course => {
        const [startWeek, endWeek] = course.weeks.includes('-') ? course.weeks.split('-').map(Number) : [Number(course.weeks), Number(course.weeks)];
        return selectedWeek >= startWeek && selectedWeek <= endWeek;
    });

    console.log("筛选后的课程数据:", weekData);

    for (let i = 1; i < 13; i++) { // 假设最多12节
        const row = document.createElement('tr');
        const timeSlotCell = document.createElement('td');
        timeSlotCell.textContent = `第${i}节`;
        row.appendChild(timeSlotCell);

        for (let j = 0; j < 7; j++) { // 7天
            const cell = document.createElement('td');
            const coursesForCell = weekData.filter(course => course.day === `周${['一', '二', '三', '四', '五', '六', '日'][j]}` && course.timeSlot === i);

            if (coursesForCell.length > 0) {
                cell.innerHTML = coursesForCell.map(c => `${c.courseName}<br/>${c.teacher}<br/>${c.location}`).join('<br/>');
            }
				
            // 设置背景颜色
            if (i >= 1 && i <= 4) { // 第一节到第四节
                cell.style.backgroundColor = '#f5fffa'; // 这里可以更改为你想要的颜色
            } else if (i >= 5 && i <= 8) { 
                cell.style.backgroundColor = '#e0ffff'; 
            } else { 
                cell.style.backgroundColor = '#fffafa'; 
            }
            row.appendChild(cell);
        }

        scheduleTableBody.appendChild(row);
    }
}

// 初次加载时从 localStorage 读取数据
window.onload = function() {
    loadFromLocalStorage();
};
