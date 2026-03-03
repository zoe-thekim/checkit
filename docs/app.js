const STORAGE_KEY = "checkit_pages_tasks_v1";
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

let tasksByDate = loadTasks();
const now = new Date();
const todayKey = dateKey(now);
let selectedDateKey = todayKey;
let shownMonth = new Date(now.getFullYear(), now.getMonth(), 1);

const tabToday = document.getElementById("tab-today");
const tabCalendar = document.getElementById("tab-calendar");
const todayView = document.getElementById("today-view");
const calendarView = document.getElementById("calendar-view");
const todoForm = document.getElementById("todo-form");
const todoInput = document.getElementById("todo-input");
const todayList = document.getElementById("today-list");
const selectedList = document.getElementById("selected-list");
const todayProgressText = document.getElementById("today-progress-text");
const selectedProgressText = document.getElementById("selected-progress-text");
const todayProgressFill = document.getElementById("today-progress-fill");
const selectedProgressFill = document.getElementById("selected-progress-fill");
const monthLabel = document.getElementById("month-label");
const calendarGrid = document.getElementById("calendar-grid");
const selectedDayTitle = document.getElementById("selected-day-title");
const prevMonth = document.getElementById("prev-month");
const nextMonth = document.getElementById("next-month");

tabToday.addEventListener("click", () => switchTab("today"));
tabCalendar.addEventListener("click", () => switchTab("calendar"));
prevMonth.addEventListener("click", () => {
    shownMonth = new Date(shownMonth.getFullYear(), shownMonth.getMonth() - 1, 1);
    renderCalendar();
});
nextMonth.addEventListener("click", () => {
    shownMonth = new Date(shownMonth.getFullYear(), shownMonth.getMonth() + 1, 1);
    renderCalendar();
});

todoForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = todoInput.value.trim();
    if (!text) {
        return;
    }
    const item = { id: Date.now(), text, completed: false };
    const list = tasksByDate[todayKey] || [];
    list.push(item);
    tasksByDate[todayKey] = sortTasks(list);
    saveTasks();
    todoInput.value = "";
    renderAll();
});

function switchTab(tab) {
    const showToday = tab === "today";
    todayView.classList.toggle("active", showToday);
    calendarView.classList.toggle("active", !showToday);
    tabToday.classList.toggle("active", showToday);
    tabCalendar.classList.toggle("active", !showToday);
}

function renderAll() {
    renderDay(todayKey, todayList, true, todayProgressText, todayProgressFill);
    renderCalendar();
    renderSelected();
}

function renderSelected() {
    const d = parseDateKey(selectedDateKey);
    selectedDayTitle.textContent = `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
    renderDay(selectedDateKey, selectedList, false, selectedProgressText, selectedProgressFill);
}

function renderDay(key, listEl, editable, progressTextEl, progressFillEl) {
    const tasks = sortTasks(tasksByDate[key] || []);
    tasksByDate[key] = tasks;

    listEl.innerHTML = "";
    if (tasks.length === 0) {
        const empty = document.createElement("li");
        empty.className = "todo-item";
        empty.textContent = "할 일이 없습니다.";
        listEl.appendChild(empty);
    } else {
        tasks.forEach((task) => {
            const li = document.createElement("li");
            li.className = `todo-item${task.completed ? " done" : ""}`;

            const label = document.createElement("label");
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = task.completed;
            checkbox.disabled = !editable;
            checkbox.addEventListener("change", () => {
                task.completed = checkbox.checked;
                tasksByDate[key] = sortTasks(tasks);
                saveTasks();
                renderAll();
            });

            const text = document.createElement("span");
            text.className = "text";
            text.textContent = task.text;

            label.appendChild(checkbox);
            label.appendChild(text);
            li.appendChild(label);
            listEl.appendChild(li);
        });
    }

    const total = tasks.length;
    const done = tasks.filter((t) => t.completed).length;
    const rate = total === 0 ? 0 : Math.round((done * 100) / total);
    progressTextEl.textContent = `완성률 ${rate}% (${done}/${total})`;
    progressFillEl.style.width = `${rate}%`;
}

function renderCalendar() {
    calendarGrid.innerHTML = "";
    monthLabel.textContent = `${shownMonth.getFullYear()}년 ${shownMonth.getMonth() + 1}월`;

    WEEKDAYS.forEach((day) => {
        const head = document.createElement("div");
        head.className = "weekday";
        head.textContent = day;
        calendarGrid.appendChild(head);
    });

    const y = shownMonth.getFullYear();
    const m = shownMonth.getMonth();
    const start = new Date(y, m, 1).getDay();
    const days = new Date(y, m + 1, 0).getDate();
    const prevDays = new Date(y, m, 0).getDate();

    for (let i = 0; i < start; i += 1) {
        const d = prevDays - start + i + 1;
        calendarGrid.appendChild(makeDateCell(new Date(y, m - 1, d), true));
    }
    for (let d = 1; d <= days; d += 1) {
        calendarGrid.appendChild(makeDateCell(new Date(y, m, d), false));
    }
    const count = start + days;
    const tail = (7 - (count % 7)) % 7;
    for (let d = 1; d <= tail; d += 1) {
        calendarGrid.appendChild(makeDateCell(new Date(y, m + 1, d), true));
    }
}

function makeDateCell(d, otherMonth) {
    const key = dateKey(d);
    const tasks = tasksByDate[key] || [];
    const hasDone = tasks.some((t) => t.completed);

    const button = document.createElement("button");
    button.type = "button";
    button.className = "date-cell";
    if (otherMonth) {
        button.classList.add("other");
    }
    if (key === selectedDateKey) {
        button.classList.add("selected");
    }
    if (hasDone) {
        button.classList.add("has-done");
    }
    button.textContent = String(d.getDate());
    button.addEventListener("click", () => {
        selectedDateKey = key;
        shownMonth = new Date(d.getFullYear(), d.getMonth(), 1);
        renderCalendar();
        renderSelected();
    });
    return button;
}

function sortTasks(tasks) {
    return [...tasks].sort((a, b) => {
        if (a.completed === b.completed) {
            return a.id - b.id;
        }
        return a.completed ? 1 : -1;
    });
}

function dateKey(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function parseDateKey(key) {
    const [y, m, d] = key.split("-").map(Number);
    return new Date(y, m - 1, d);
}

function loadTasks() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
        return {};
    }
    try {
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
        return {};
    }
}

function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasksByDate));
}

renderAll();
