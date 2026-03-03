const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const now = new Date();
const todayKey = toDateKey(now);

let tasksByDate = {};
let monthSummary = {};
let calendarMonth = new Date(now.getFullYear(), now.getMonth(), 1);
let selectedDateKey = todayKey;

const todayView = document.getElementById("today-view");
const calendarView = document.getElementById("calendar-view");
const tabToday = document.getElementById("tab-today");
const tabCalendar = document.getElementById("tab-calendar");
const todoForm = document.getElementById("todo-form");
const todoInput = document.getElementById("todo-input");
const todayList = document.getElementById("today-list");
const selectedList = document.getElementById("selected-list");
const todayProgressText = document.getElementById("today-progress-text");
const todayProgressFill = document.getElementById("today-progress-fill");
const selectedProgressText = document.getElementById("selected-progress-text");
const selectedProgressFill = document.getElementById("selected-progress-fill");
const monthLabel = document.getElementById("month-label");
const calendarGrid = document.getElementById("calendar-grid");
const selectedDayTitle = document.getElementById("selected-day-title");
const prevMonthBtn = document.getElementById("prev-month");
const nextMonthBtn = document.getElementById("next-month");
const userLabel = document.getElementById("user-label");
const logoutBtn = document.getElementById("logout-btn");

tabToday.addEventListener("click", () => switchTab("today"));
tabCalendar.addEventListener("click", () => switchTab("calendar"));
prevMonthBtn.addEventListener("click", async () => {
    calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1);
    await loadMonthSummary();
    renderCalendar();
});
nextMonthBtn.addEventListener("click", async () => {
    calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1);
    await loadMonthSummary();
    renderCalendar();
});
logoutBtn.addEventListener("click", logout);

todoForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await createTodayTask();
});

function switchTab(tab) {
    const isToday = tab === "today";
    todayView.classList.toggle("active", isToday);
    calendarView.classList.toggle("active", !isToday);
    tabToday.classList.toggle("active", isToday);
    tabCalendar.classList.toggle("active", !isToday);
}

function renderAll() {
    renderToday();
    renderCalendar();
    renderSelectedDayPanel();
}

function renderToday() {
    const tasks = sortTasks(tasksByDate[todayKey] || []);
    renderTaskList(todayList, tasks, true, todayKey);
    renderProgress(tasks, todayProgressText, todayProgressFill);
}

function renderSelectedDayPanel() {
    const tasks = sortTasks(tasksByDate[selectedDateKey] || []);
    const d = fromDateKey(selectedDateKey);
    selectedDayTitle.textContent = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} checklist`;
    renderTaskList(selectedList, tasks, false, selectedDateKey);
    renderProgress(tasks, selectedProgressText, selectedProgressFill);
}

function renderTaskList(container, tasks, editable, dateKey) {
    container.innerHTML = "";
    if (!tasks.length) {
        const empty = document.createElement("li");
        empty.className = "todo-item";
        empty.textContent = "No items";
        container.appendChild(empty);
        return;
    }

    tasks.forEach((task) => {
        const li = document.createElement("li");
        li.className = `todo-item${task.completed ? " done" : ""}`;

        const label = document.createElement("label");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = task.completed;
        checkbox.disabled = !editable;

        const text = document.createElement("span");
        text.className = "text";
        text.textContent = task.text;

        if (editable) {
            checkbox.addEventListener("change", async () => {
                await updateTaskCompletion(dateKey, task.id, checkbox.checked);
            });
        }

        label.appendChild(checkbox);
        label.appendChild(text);
        li.appendChild(label);
        container.appendChild(li);
    });
}

function renderProgress(tasks, textEl, fillEl) {
    const total = tasks.length;
    const completed = tasks.filter((task) => task.completed).length;
    const ratio = total === 0 ? 0 : Math.round((completed * 100) / total);
    textEl.textContent = `Done ${ratio}% (${completed}/${total})`;
    fillEl.style.width = `${ratio}%`;
}

function renderCalendar() {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    monthLabel.textContent = `${year}-${String(month + 1).padStart(2, "0")}`;
    calendarGrid.innerHTML = "";

    WEEKDAYS.forEach((day) => {
        const header = document.createElement("div");
        header.className = "weekday";
        header.textContent = day;
        calendarGrid.appendChild(header);
    });

    const first = new Date(year, month, 1);
    const startWeek = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    for (let i = 0; i < startWeek; i += 1) {
        const day = prevMonthDays - startWeek + i + 1;
        calendarGrid.appendChild(makeDateCell(new Date(year, month - 1, day), true));
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
        calendarGrid.appendChild(makeDateCell(new Date(year, month, day), false));
    }

    const totalCells = startWeek + daysInMonth;
    const trailing = (7 - (totalCells % 7)) % 7;
    for (let day = 1; day <= trailing; day += 1) {
        calendarGrid.appendChild(makeDateCell(new Date(year, month + 1, day), true));
    }
}

function makeDateCell(dateObj, otherMonth) {
    const cell = document.createElement("button");
    const key = toDateKey(dateObj);
    const summary = monthSummary[key];

    cell.type = "button";
    cell.className = "date-cell";
    if (otherMonth) {
        cell.classList.add("other");
    }
    if (key === selectedDateKey) {
        cell.classList.add("selected");
    }
    if (summary && summary.completed > 0) {
        cell.classList.add("has-done");
    }
    cell.textContent = String(dateObj.getDate());
    cell.addEventListener("click", async () => {
        selectedDateKey = key;
        calendarMonth = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1);
        await loadTasksForDate(selectedDateKey);
        await loadMonthSummary();
        renderCalendar();
        renderSelectedDayPanel();
    });
    return cell;
}

function sortTasks(tasks) {
    return [...tasks].sort((a, b) => {
        if (a.completed === b.completed) {
            return a.id - b.id;
        }
        return a.completed ? 1 : -1;
    });
}

async function ensureAuthenticated() {
    const response = await fetch("/api/me");
    if (!response.ok) {
        location.href = "/login.html";
        return false;
    }
    const me = await response.json();
    userLabel.textContent = `${me.username} (${me.provider})`;
    return true;
}

async function loadTasksForDate(dateKey) {
    const response = await fetch(`/api/todos?date=${dateKey}`);
    if (!response.ok) {
        tasksByDate[dateKey] = [];
        return [];
    }
    const tasks = await response.json();
    tasksByDate[dateKey] = tasks;
    return tasks;
}

async function loadMonthSummary() {
    const month = `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, "0")}`;
    const response = await fetch(`/api/todos/summary?month=${month}`);
    if (!response.ok) {
        monthSummary = {};
        return;
    }
    monthSummary = await response.json();
}

async function createTodayTask() {
    const text = todoInput.value.trim();
    if (!text) {
        return;
    }
    const response = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, date: todayKey })
    });
    if (!response.ok) {
        return;
    }
    todoInput.value = "";
    await loadTasksForDate(todayKey);
    if (selectedDateKey === todayKey) {
        await loadTasksForDate(selectedDateKey);
    }
    await loadMonthSummary();
    renderAll();
}

async function updateTaskCompletion(dateKey, taskId, completed) {
    const response = await fetch(`/api/todos/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed })
    });
    if (!response.ok) {
        return;
    }
    await loadTasksForDate(dateKey);
    if (selectedDateKey !== dateKey) {
        await loadTasksForDate(selectedDateKey);
    }
    await loadMonthSummary();
    renderAll();
}

async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    location.href = "/login.html";
}

function toDateKey(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    const d = String(dateObj.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function fromDateKey(key) {
    const [y, m, d] = key.split("-").map(Number);
    return new Date(y, m - 1, d);
}

async function init() {
    const ok = await ensureAuthenticated();
    if (!ok) {
        return;
    }
    await loadTasksForDate(todayKey);
    if (selectedDateKey !== todayKey) {
        await loadTasksForDate(selectedDateKey);
    }
    await loadMonthSummary();
    renderAll();
}

init();
