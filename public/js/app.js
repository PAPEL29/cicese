// =====================================
// NAVEGACIÓN SPA
// =====================================
const screens = document.querySelectorAll(".screen");
const navButtons = document.querySelectorAll(".nav-btn");

navButtons.forEach(button => {
    button.addEventListener("click", () => {
        const target = button.dataset.target;
        screens.forEach(screen => screen.classList.remove("active"));
        navButtons.forEach(btn => btn.classList.remove("active"));

        document.getElementById(target).classList.add("active");
        button.classList.add("active");

        // Resize al mapa si se entra a la sección de actividades
        if (target === "activities" && window.mapInstance) {
            setTimeout(() => window.mapInstance.invalidateSize(), 200);
        }
    });
});

// =====================================
// RULETA DE EMOCIONES CIRCULAR (SVG)
// =====================================
const emotionData = {
    "Miedo": {
        color: "#8e44ad",
        sub: {
            "Humillado": ["Ridiculizado", "Apenado"],
            "Rechazado": ["Inseguro", "Devastado"],
            "Sumiso": ["Inadecuado", "Insignificante"],
            "Asustado": ["Espantado", "Aterrado"]
        }
    },
    "Ira": {
        color: "#ef4444",
        sub: {
            "Herido": ["Abochornado", "Devastado"],
            "Amenazado": ["Inseguro", "Celoso"],
            "Agresivo": ["Provocado", "Hostil"],
            "Frustrado": ["Enfadado", "Irritado"]
        }
    },
    "Disgusto": {
        color: "#f97316",
        sub: {
            "Desaprobado": ["Sentencioso", "Aborrecido"],
            "Decepcionado": ["Repugnante", "Rebelado"],
            "Evasivo": ["Aversivo", "Indeciso"]
        }
    },
    "Tristeza": {
        color: "#10b981",
        sub: {
            "Culpable": ["Atormentado", "Avergonzado"],
            "Abandonado": ["Ignorado", "Discriminado"],
            "Deprimido": ["Inferior", "Vacío"],
            "Aburrido": ["Apático", "Indiferente"]
        }
    },
    "Felicidad": {
        color: "#eab308",
        sub: {
            "Optimista": ["Inspirado", "Receptivo"],
            "Pacífico": ["Esperanzado", "Amoroso"],
            "Poderoso": ["Valiente", "Provocativo"],
            "Orgulloso": ["Confiado", "Importante"]
        }
    },
    "Sorpresa": {
        color: "#3b82f6",
        sub: {
            "Jubiloso": ["Liberado", "Eufórico"],
            "Asombrado": ["Pasmado", "Atónito"],
            "Confundido": ["Perplejo", "Desilusionado"],
            "Interesado": ["Curioso", "Entretenido"]
        }
    }
};

const svg = document.getElementById('wheel');
const resultBox = document.getElementById('center-result');
const resultPath = document.getElementById('result-path');
const finalEmotion = document.getElementById('final-emotion');
const selectedEmotionDisplay = document.getElementById('selectedEmotion');
const lastMoodDisplay = document.getElementById('lastMood');

const center = 250;
const radii = [0, 80, 165, 245];
let currentWheelSelection = { l1: null, l2: null, l3: null };

let emotionStats = JSON.parse(localStorage.getItem("emotionStats")) || {
    Felicidad: 0, Tristeza: 0, Ira: 0, Miedo: 0, Disgusto: 0, Sorpresa: 0
};

function polarToCartesian(cx, cy, r, angleInDegrees) {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
        x: cx + (r * Math.cos(angleInRadians)),
        y: cy + (r * Math.sin(angleInRadians))
    };
}

function describeArc(x, y, innerR, outerR, startAngle, endAngle) {
    const startOuter = polarToCartesian(x, y, outerR, endAngle);
    const endOuter = polarToCartesian(x, y, outerR, startAngle);
    const startInner = polarToCartesian(x, y, innerR, endAngle);
    const endInner = polarToCartesian(x, y, innerR, startAngle);

    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    return [
        "M", startOuter.x, startOuter.y,
        "A", outerR, outerR, 0, largeArcFlag, 0, endOuter.x, endOuter.y,
        "L", endInner.x, endInner.y,
        "A", innerR, innerR, 0, largeArcFlag, 1, startInner.x, startInner.y,
        "Z"
    ].join(" ");
}

function drawWheel() {
    svg.innerHTML = '';
    const l1Keys = Object.keys(emotionData);
    const l1AngleStep = 360 / l1Keys.length;
    let currentL1Angle = 0;

    l1Keys.forEach((l1Key) => {
        const l1Data = emotionData[l1Key];
        const l1EndAngle = currentL1Angle + l1AngleStep;

        createSector(radii[0], radii[1], currentL1Angle, l1EndAngle, l1Data.color, l1Key, 1, { l1: l1Key });

        const l2Keys = Object.keys(l1Data.sub);
        const l2AngleStep = l1AngleStep / l2Keys.length;
        let currentL2Angle = currentL1Angle;

        l2Keys.forEach((l2Key) => {
            const l3Array = l1Data.sub[l2Key];
            const l2EndAngle = currentL2Angle + l2AngleStep;

            createSector(radii[1], radii[2], currentL2Angle, l2EndAngle, l1Data.color, l2Key, 2, { l1: l1Key, l2: l2Key });

            const l3AngleStep = l2AngleStep / l3Array.length;
            let currentL3Angle = currentL2Angle;

            l3Array.forEach((l3Key) => {
                const l3EndAngle = currentL3Angle + l3AngleStep;
                createSector(radii[2], radii[3], currentL3Angle, l3EndAngle, l1Data.color, l3Key, 3, { l1: l1Key, l2: l2Key, l3: l3Key });
                currentL3Angle = l3EndAngle;
            });
            currentL2Angle = l2EndAngle;
        });
        currentL1Angle = l1EndAngle;
    });
}

function createSector(innerR, outerR, startAngle, endAngle, color, label, level, pathData) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("data-level", level);
    g.setAttribute("data-l1", pathData.l1);
    if(pathData.l2) g.setAttribute("data-l2", pathData.l2);
    if(pathData.l3) g.setAttribute("data-l3", pathData.l3);

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", describeArc(center, center, innerR, outerR, startAngle, endAngle));
    path.setAttribute("fill", color);
    path.setAttribute("class", "sector");
    path.style.opacity = level === 1 ? "1" : level === 2 ? "0.85" : "0.7";

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    const midAngle = startAngle + (endAngle - startAngle) / 2;
    const midRadius = innerR + (outerR - innerR) / 2;
    const pos = polarToCartesian(center, center, midRadius, midAngle);

    text.setAttribute("x", pos.x);
    text.setAttribute("y", pos.y);
    text.setAttribute("class", "label");
    text.setAttribute("transform", `rotate(${midAngle + 90}, ${pos.x}, ${pos.y})`);
    text.textContent = label;

    g.appendChild(path);
    g.appendChild(text);

    g.onclick = () => handleSectorClick(level, pathData);
    if (level > 1) g.style.pointerEvents = "none";

    svg.appendChild(g);
}

function handleSectorClick(level, pathData) {
    if (level === 1) {
        currentWheelSelection.l1 = pathData.l1;
        document.querySelectorAll('[data-level="1"]').forEach(el => el.classList.add('hidden'));
        document.querySelectorAll('[data-level="2"]').forEach(el => {
            if (el.getAttribute('data-l1') === pathData.l1) {
                el.style.pointerEvents = "auto";
            } else {
                el.classList.add('hidden');
            }
        });
    } else if (level === 2) {
        currentWheelSelection.l2 = pathData.l2;
        document.querySelectorAll('[data-level="2"]').forEach(el => el.classList.add('hidden'));
        document.querySelectorAll('[data-level="3"]').forEach(el => {
            if (el.getAttribute('data-l1') === currentWheelSelection.l1 && el.getAttribute('data-l2') === pathData.l2) {
                el.style.pointerEvents = "auto";
            } else {
                el.classList.add('hidden');
            }
        });
    } else if (level === 3) {
        currentWheelSelection.l3 = pathData.l3;
        document.querySelectorAll('[data-level="3"]').forEach(el => {
            if (el.getAttribute('data-l3') !== pathData.l3) {
                el.classList.add('hidden');
            }
        });

        saveEmotionRecord(currentWheelSelection.l1, currentWheelSelection.l3);
        showWheelResult();
    }
}

function showWheelResult() {
    resultPath.textContent = `${currentWheelSelection.l1} → ${currentWheelSelection.l2}`;
    finalEmotion.textContent = currentWheelSelection.l3;
    finalEmotion.style.color = emotionData[currentWheelSelection.l1].color;
    resultBox.classList.add('visible');
}

function resetWheel() {
    currentWheelSelection = { l1: null, l2: null, l3: null };
    resultBox.classList.remove('visible');
    document.querySelectorAll('g').forEach(el => {
        el.classList.remove('hidden');
        if (el.getAttribute('data-level') > 1) {
            el.style.pointerEvents = "none";
        }
    });
}

function saveEmotionRecord(category, specificEmotion) {
    selectedEmotionDisplay.textContent = specificEmotion;
    lastMoodDisplay.textContent = specificEmotion;

    if (emotionStats[category] !== undefined) {
        emotionStats[category]++;
    } else {
        emotionStats[category] = 1;
    }

    localStorage.setItem("emotionStats", JSON.stringify(emotionStats));
    localStorage.setItem("lastEmotion", specificEmotion);

    // Marcar día de hoy en el calendario
    const todayStr = new Date().toISOString().split('T')[0];
    if (!completedDays.includes(todayStr)) {
        completedDays.push(todayStr);
        localStorage.setItem('habit_completed_days', JSON.stringify(completedDays));
        renderCalendar();
    }

    updateChart();
    updateStats();
}

// Restablecer última emoción si existe
const savedEmotion = localStorage.getItem("lastEmotion");
if(savedEmotion){
    selectedEmotionDisplay.textContent = savedEmotion;
    lastMoodDisplay.textContent = savedEmotion;
}

// =====================================
// CALENDARIO Y RACHAS
// =====================================
let currentDate = new Date();
let completedDays = JSON.parse(localStorage.getItem('habit_completed_days')) || [];

const monthYearDisplay = document.getElementById('month-year-display');
const calendarGrid = document.getElementById('calendarGrid');
const streakDisplay = document.getElementById('streakDisplay');
const totalRegs = document.getElementById('totalRegs');
const statBestStreak = document.getElementById('statBestStreak');

const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    monthYearDisplay.textContent = `${months[month]} ${year}`;
    calendarGrid.innerHTML = '';

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    for (let i = 0; i < firstDayIndex; i++) {
        const emptyDiv = document.createElement('div');
        emptyDiv.classList.add('day', 'empty');
        calendarGrid.appendChild(emptyDiv);
    }

    for (let day = 1; day <= totalDays; day++) {
        const dayDiv = document.createElement('div');
        dayDiv.classList.add('day');
        dayDiv.textContent = day;

        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
            dayDiv.classList.add('today');
        }

        if (completedDays.includes(dateString)) {
            dayDiv.classList.add('completed');
        }

        dayDiv.onclick = () => toggleDay(dateString);
        calendarGrid.appendChild(dayDiv);
    }

    calculateStreaks();
}

function toggleDay(dateString) {
    const index = completedDays.indexOf(dateString);
    if (index === -1) {
        completedDays.push(dateString);
    } else {
        completedDays.splice(index, 1);
    }
    localStorage.setItem('habit_completed_days', JSON.stringify(completedDays));
    renderCalendar();
    updateStats();
}

function calculateStreaks() {
    if (completedDays.length === 0) {
        streakDisplay.textContent = "🔥 0 días";
        statBestStreak.textContent = "0 días";
        totalRegs.textContent = "0";
        return;
    }

    const sortedDates = [...new Set(completedDays)].sort();
    let currentStreak = 0;
    let maxStreak = 0;
    let tempStreak = 0;

    for (let i = 0; i < sortedDates.length; i++) {
        if (i === 0) {
            tempStreak = 1;
        } else {
            const prev = new Date(sortedDates[i - 1]);
            const curr = new Date(sortedDates[i]);
            const diffDays = Math.ceil(Math.abs(curr - prev) / (1000 * 60 * 60 * 24));

            if (diffDays === 1) tempStreak++;
            else tempStreak = 1;
        }
        if (tempStreak > maxStreak) maxStreak = tempStreak;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let checkDate = completedDays.includes(todayStr) ? new Date() : (completedDays.includes(yesterdayStr) ? yesterday : null);

    if (checkDate) {
        while (true) {
            const dateStr = checkDate.toISOString().split('T')[0];
            if (completedDays.includes(dateStr)) {
                currentStreak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else break;
        }
    }

    streakDisplay.textContent = `🔥 ${currentStreak} días`;
    statBestStreak.textContent = `${maxStreak} días`;
    totalRegs.textContent = completedDays.length;
}

document.getElementById('prev-month').onclick = () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
};

document.getElementById('next-month').onclick = () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
};

// =====================================
// CHAT CON IA (GPT-4o-mini API)
// =====================================
const API_KEY = "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"; // Reemplazar con clave OpenAI activa
const chatMessages = document.getElementById('chatMessages');
const chatForm = document.getElementById('chatForm');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');

const conversationHistory = [
    {
        role: "system",
        content: `Eres un asistente virtual de MindCare empático, calmado y moderado especializado en soporte emocional y escucha activa. 
        Reglas:
        1. Valida las emociones del usuario de manera cercana.
        2. Mantén respuestas concisas (máximo 3 oraciones) ideales para una app móvil.
        3. Haz preguntas abiertas suaves para profundizar en lo que siente.
        4. No des diagnósticos ni recetas médicas.`
    }
];

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = userInput.value.trim();
    if (!text) return;

    appendMessage(text, 'user');
    userInput.value = '';
    userInput.disabled = true;
    sendBtn.disabled = true;

    conversationHistory.push({ role: "user", content: text });
    const typingMessage = appendMessage('Pensando...', 'bot');

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: conversationHistory,
                temperature: 0.7,
                max_tokens: 150
            })
        });

        const data = await response.json();
        if (data.choices && data.choices[0]) {
            const botReply = data.choices[0].message.content;
            typingMessage.textContent = botReply;
            conversationHistory.push({ role: "assistant", content: botReply });
        } else {
            typingMessage.textContent = "Lo siento, tuve un detalle al procesar. ¿Intentamos de nuevo?";
        }
    } catch (error) {
        typingMessage.textContent = "Estamos para escucharte. (Verifica la conexión o API Key).";
    } finally {
        userInput.disabled = false;
        sendBtn.disabled = false;
        userInput.focus();
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
});

function appendMessage(text, sender) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', sender);
    msgDiv.textContent = text;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return msgDiv;
}

// =====================================
// DIARIO EMOCIONAL
// =====================================
const journalText = document.getElementById("journalText");
const saveJournal = document.getElementById("saveJournal");
const journalEntries = document.getElementById("journalEntries");

let entries = JSON.parse(localStorage.getItem("journalEntries")) || [];

function renderEntries() {
    journalEntries.innerHTML = "";
    [...entries].reverse().forEach(entry => {
        const div = document.createElement("div");
        div.classList.add("entry");
        div.innerHTML = `
            <strong>${entry.date}</strong>
            <p>${entry.text}</p>
        `;
        journalEntries.appendChild(div);
    });
}

saveJournal.addEventListener("click", () => {
    const text = journalText.value.trim();
    if (text === "") {
        alert("Escribe algo antes de guardar.");
        return;
    }

    const newEntry = {
        date: new Date().toLocaleDateString(),
        text: text
    };

    entries.push(newEntry);
    localStorage.setItem("journalEntries", JSON.stringify(entries));
    journalText.value = "";
    renderEntries();
    updateStats();
    alert("Entrada guardada en tu diario.");
});

// =====================================
// RESPIRACIÓN GUIADA CON CONTEO Y TIEMPO REAL
// =====================================
const breathText = document.getElementById("breathText");
const breathTimer = document.getElementById("breathTimer");
const breathingCircle = document.getElementById("breathingCircle");
const breathButtons = document.querySelectorAll(".breath-btn");

let breathingCount = Number(localStorage.getItem("breathingCount")) || 0;
let breathInterval = null;

// Definición de las secuencias con tiempos exactos en segundos por fase
const breathTechniques = {
    "4444": [
        { phase: "Inhala", duration: 4, scale: 1.25 },
        { phase: "Mantén", duration: 4, scale: 1.25 },
        { phase: "Exhala", duration: 4, scale: 0.85 },
        { phase: "Mantén", duration: 4, scale: 0.85 }
    ],
    "478": [
        { phase: "Inhala", duration: 4, scale: 1.25 },
        { phase: "Mantén", duration: 7, scale: 1.25 },
        { phase: "Exhala", duration: 8, scale: 0.85 }
    ],
    "55": [
        { phase: "Inhala", duration: 5, scale: 1.25 },
        { phase: "Exhala", duration: 5, scale: 0.85 }
    ]
};

function startBreathing(type) {
    if (!breathTechniques[type]) return;

    // Detener cualquier ejercicio previo activo
    clearInterval(breathInterval);

    // Deshabilitar botones mientras inicia el conteo
    breathButtons.forEach(btn => btn.disabled = true);

    // 1. CUENTA REGRESIVA DE INICIO (3, 2, 1)
    let prepSeconds = 3;
    breathText.textContent = "¡Prepárate!";
    breathTimer.textContent = prepSeconds;
    breathingCircle.style.transform = "scale(1)";

    const prepInterval = setInterval(() => {
        prepSeconds--;
        if (prepSeconds > 0) {
            breathTimer.textContent = prepSeconds;
        } else {
            clearInterval(prepInterval);
            breathText.textContent = "¡Empieza!";
            breathTimer.textContent = "GO";
            
            // Habilitar botones de nuevo y comenzar la secuencia en 1 segundo
            setTimeout(() => {
                breathButtons.forEach(btn => btn.disabled = false);
                runBreathingCycle(type);
            }, 1000);
        }
    }, 1000);
}

function runBreathingCycle(type) {
    const sequence = breathTechniques[type];
    let stepIndex = 0;
    let currentSeconds = sequence[stepIndex].duration;

    const updateStep = () => {
        const currentStep = sequence[stepIndex];
        breathText.textContent = currentStep.phase;
        breathTimer.textContent = currentSeconds;
        breathingCircle.style.transform = `scale(${currentStep.scale})`;
    };

    updateStep();

    breathInterval = setInterval(() => {
        currentSeconds--;

        if (currentSeconds > 0) {
            breathTimer.textContent = currentSeconds;
        } else {
            // Avanzar a la siguiente fase de la secuencia
            stepIndex = (stepIndex + 1) % sequence.length;
            currentSeconds = sequence[stepIndex].duration;
            updateStep();
        }
    }, 1000);

    // Registrar la actividad en las estadísticas
    breathingCount++;
    localStorage.setItem("breathingCount", breathingCount);
    if (typeof updateStats === "function") updateStats();
}

breathButtons.forEach(btn => {
    btn.addEventListener("click", () => startBreathing(btn.dataset.type));
});

// =====================================
// ANALÍTICAS (CHART.JS)
// =====================================
const chartCanvas = document.getElementById("emotionChart");
let emotionChart;

function updateChart() {
    const labels = Object.keys(emotionStats);
    const dataValues = Object.values(emotionStats);

    if (emotionChart) emotionChart.destroy();

    emotionChart = new Chart(chartCanvas, {
        type: "doughnut",
        data: {
            labels: labels,
            datasets: [{
                data: dataValues,
                backgroundColor: ['#eab308', '#10b981', '#ef4444', '#8e44ad', '#f97316', '#3b82f6']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: "bottom" }
            }
        }
    });
}

function updateStats() {
    document.getElementById("statRegistros").textContent = completedDays.length;
    document.getElementById("statDiarios").textContent = entries.length;
    document.getElementById("statBreaths").textContent = breathingCount;
}

// =====================================
// MAPA INTERACTIVO DE BIENESTAR (LEAFLET)
// =====================================
function initMap() {
    const map = L.map('map').setView([19.7000, -101.1850], 14);
    window.mapInstance = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    const actividades = [
        {
            nombre: "Paseo Consciente y Running",
            tipo: "correr",
            coordenadas: [19.7025, -101.1820],
            descripcion: "Trota o camina liberando endorfinas.",
            beneficio: "Combate la ansiedad."
        },
        {
            nombre: "Lectura y Desconexión",
            tipo: "naturaleza",
            coordenadas: [19.6980, -101.1870],
            descripcion: "Sombra natural para despejar la mente.",
            beneficio: "Reduce niveles de estrés."
        },
        {
            nombre: "Espacio de Meditación",
            tipo: "meditar",
            coordenadas: [19.7050, -101.1900],
            descripcion: "Área tranquila para respiración.",
            beneficio: "Fomenta la calma interior."
        }
    ];

    const sidebar = document.getElementById('sidebar-map');
    sidebar.innerHTML = '';

    actividades.forEach((act) => {
        const marker = L.marker(act.coordenadas).addTo(map);
        marker.bindPopup(`<b>${act.nombre}</b><br><p>${act.descripcion}</p>`);

        const card = document.createElement('div');
        card.className = 'card-map';
        card.innerHTML = `
            <h3>${act.nombre}</h3>
            <p>${act.descripcion}</p>
            <span class="tag tag-${act.tipo}">${act.tipo.toUpperCase()}</span>
        `;

        card.onclick = () => {
            map.flyTo(act.coordenadas, 16, { duration: 1.5 });
            marker.openPopup();
        };

        sidebar.appendChild(card);
    });
}

// =====================================
// BOTÓN EMERGENCIA
// =====================================
document.querySelector(".emergency-btn").addEventListener("click", (event) => {
    const confirmHelp = confirm("¿Deseas llamar a una línea de ayuda inmediata?");
    if (!confirmHelp) event.preventDefault();
});

// INICIALIZACIÓN
drawWheel();
renderCalendar();
renderEntries();
updateChart();
updateStats();
initMap();