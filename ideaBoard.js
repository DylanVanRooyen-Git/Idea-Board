const viewport = document.querySelector(".viewport");
const board = document.querySelector(".board");
const svg = document.querySelector(".connections");

let connections = [];
let selectedCard = null;


let panX = -4500; 
let panY = -4500;
let scale = 1;
let isPanning = false;
let panStartX = 0;
let panStartY = 0;


updateBoardTransform();

function updateBoardTransform() {
    board.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
    updateLines();
}


const featuresBtn = document.getElementById("featuresBtn");
const featuresDropdown = document.getElementById("featuresDropdown");

featuresBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    featuresDropdown.classList.toggle("show");
});


document.addEventListener("click", (e) => {
    if (!featuresDropdown.contains(e.target) && e.target !== featuresBtn) {
        featuresDropdown.classList.remove("show");
    }
});


featuresDropdown.addEventListener("click", (e) => {
    e.stopPropagation();
});


viewport.addEventListener("mousedown", (e) => {

    if (e.target === viewport || e.target === board || e.target.classList.contains('grid-background')) {
        isPanning = true;
        panStartX = e.clientX - panX;
        panStartY = e.clientY - panY;
        viewport.classList.add("panning");
    }
});

document.addEventListener("mousemove", (e) => {
    if (isPanning) {
        panX = e.clientX - panStartX;
        panY = e.clientY - panStartY;
        updateBoardTransform();
    }
});

document.addEventListener("mouseup", () => {
    if (isPanning) {
        isPanning = false;
        viewport.classList.remove("panning");
    }
});


viewport.addEventListener("wheel", (e) => {
    e.preventDefault();
    
    const rect = viewport.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    

    const beforeX = (mouseX - panX) / scale;
    const beforeY = (mouseY - panY) / scale;
    

    const zoomSpeed = 0.001;
    const delta = -e.deltaY;
    const newScale = Math.min(Math.max(0.1, scale + delta * zoomSpeed), 3);
    scale = newScale;
    

    const afterX = (mouseX - panX) / scale;
    const afterY = (mouseY - panY) / scale;
    

    panX += (afterX - beforeX) * scale;
    panY += (afterY - beforeY) * scale;
    
    updateBoardTransform();
}, { passive: false });

function initCard(card) {
    card.style.position = "absolute";
    if (!card.style.left) card.style.left = "5000px";
    if (!card.style.top) card.style.top = "5000px";

    let offsetX = 0, offsetY = 0, isDragging = false;

    card.addEventListener("mousedown", (e) => {

        if (e.target.tagName === "BUTTON" || e.target.tagName === "INPUT") return;
        
        isDragging = true;
        const rect = card.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        card.style.cursor = "grabbing";
        card.style.zIndex = "1000";
        

        e.stopPropagation();
    });

    document.addEventListener("mousemove", (e) => {
        if (!isDragging) return;
        
        const boardRect = board.getBoundingClientRect();
        let newLeft = (e.clientX - boardRect.left) / scale - offsetX / scale;
        let newTop = (e.clientY - boardRect.top) / scale - offsetY / scale;
        
   
        newLeft = Math.max(0, Math.min(newLeft, 10000 - card.offsetWidth));
        newTop = Math.max(0, Math.min(newTop, 10000 - card.offsetHeight));
        
        card.style.left = `${newLeft}px`;
        card.style.top = `${newTop}px`;
        updateLines();
    });

    document.addEventListener("mouseup", () => {
        if (isDragging) {
            isDragging = false;
            card.style.cursor = "grab";
            card.style.zIndex = "1";
        }
    });

    card.addEventListener("dblclick", (e) => {

        if (e.target.tagName === "BUTTON") return;
        
        e.stopPropagation();
        if (selectedCard === card) {
            card.style.outline = "none";
            selectedCard = null;
            return;
        }
        if (!selectedCard) {
            selectedCard = card;
            card.style.outline = "3px dashed white";
            return;
        }
        createConnection(selectedCard, card);
        selectedCard.style.outline = "none";
        selectedCard = null;
    });

    const idea = card.querySelector(".idea");
    const img = card.querySelector("img");


    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "✖";
    deleteBtn.style.position = "absolute";
    deleteBtn.style.background = "rgba(255, 255, 255, 0.3)";
    deleteBtn.style.border = "none";
    deleteBtn.style.borderRadius = "4px";
    deleteBtn.style.cursor = "pointer";
    deleteBtn.style.padding = "4px 6px";
    deleteBtn.style.fontSize = "14px";
    deleteBtn.style.color = "white";
    deleteBtn.style.fontWeight = "bold";

    if (idea) {
        deleteBtn.style.top = "5px";
        deleteBtn.style.right = "5px";
    } else if (img) {
        deleteBtn.style.top = "5px";
        deleteBtn.style.left = "5px";
    }

    card.appendChild(deleteBtn);

    deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        connections = connections.filter(conn => {
            if (conn.cardA === card || conn.cardB === card) {
                svg.removeChild(conn.line);
                return false;
            }
            return true;
        });
        if (selectedCard === card) {
            selectedCard = null;
        }
        board.removeChild(card);
    });


    if (idea) {
        const editBtn = document.createElement("button");
        editBtn.textContent = "✏️";
        editBtn.style.position = "absolute";
        editBtn.style.top = "5px";
        editBtn.style.left = "5px";
        editBtn.style.background = "rgba(255, 255, 255, 0.2)";
        editBtn.style.border = "none";
        editBtn.style.borderRadius = "4px";
        editBtn.style.cursor = "pointer";
        editBtn.style.padding = "2px 6px";
        editBtn.style.fontSize = "12px";
        card.appendChild(editBtn);

        editBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            editBtn.style.display = "none";
            const currentText = idea.textContent;
            const input = document.createElement("input");
            input.type = "text";
            input.value = currentText;
            input.style.width = "100%";
            input.style.fontFamily = "inherit";
            input.style.fontSize = "inherit";
            input.style.border = "1px solid #fff";
            input.style.borderRadius = "4px";
            input.style.padding = "4px";
            input.style.textAlign = "center";
            input.style.color = "white";
            input.style.background = "rgba(255, 255, 255, 0.1)";

            card.replaceChild(input, idea);
            input.focus();
            input.select();

            function save() {
                idea.textContent = input.value || "Empty Idea";
                card.replaceChild(idea, input);
                editBtn.style.display = "block";
            }

            input.addEventListener("keydown", (ev) => { 
                if (ev.key === "Enter") save(); 
                if (ev.key === "Escape") save();
            });
            input.addEventListener("blur", save);
        });
    }


    if (img) {
        const folderBtn = document.createElement("button");
        folderBtn.textContent = "📁";
        folderBtn.style.position = "absolute";
        folderBtn.style.top = "5px";
        folderBtn.style.right = "5px";
        folderBtn.style.background = "rgba(255, 255, 255, 0.2)";
        folderBtn.style.border = "none";
        folderBtn.style.borderRadius = "4px";
        folderBtn.style.cursor = "pointer";
        folderBtn.style.padding = "2px 6px";
        folderBtn.style.fontSize = "14px";
        card.appendChild(folderBtn);

        folderBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            const fileInput = document.createElement("input");
            fileInput.type = "file";
            fileInput.accept = "image/*";
            fileInput.addEventListener("change", () => {
                if (fileInput.files && fileInput.files[0]) {
                    const reader = new FileReader();
                    reader.onload = (event) => { 
                        img.src = event.target.result; 
                    };
                    reader.readAsDataURL(fileInput.files[0]);
                }
            });
            fileInput.click();
        });
    }
}

function createConnection(cardA, cardB) {

    const exists = connections.some(conn => 
        (conn.cardA === cardA && conn.cardB === cardB) || 
        (conn.cardA === cardB && conn.cardB === cardA)
    );
    
    if (exists) return;
    
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("stroke", "white");
    line.setAttribute("stroke-width", "3");
    svg.appendChild(line);
    connections.push({ cardA, cardB, line });
    updateLines();
}

function updateLines() {
    const boardRect = board.getBoundingClientRect();
    connections.forEach(conn => {
        const rectA = conn.cardA.getBoundingClientRect();
        const rectB = conn.cardB.getBoundingClientRect();
        
        const x1 = (rectA.left + rectA.width / 2 - boardRect.left) / scale;
        const y1 = (rectA.top + rectA.height / 2 - boardRect.top) / scale;
        const x2 = (rectB.left + rectB.width / 2 - boardRect.left) / scale;
        const y2 = (rectB.top + rectB.height / 2 - boardRect.top) / scale;
        
        conn.line.setAttribute("x1", x1);
        conn.line.setAttribute("y1", y1);
        conn.line.setAttribute("x2", x2);
        conn.line.setAttribute("y2", y2);
    });
}

document.querySelectorAll(".card").forEach(initCard);


function getViewportCenter() {
    const viewportRect = viewport.getBoundingClientRect();
    const boardRect = board.getBoundingClientRect();
    const centerX = (viewportRect.width / 2 - boardRect.left) / scale;
    const centerY = (viewportRect.height / 2 - boardRect.top) / scale;
    return { x: centerX, y: centerY };
}


const imgButton = document.getElementById("imgBut");
imgButton.addEventListener("click", () => {
    const newCard = document.createElement("div");
    newCard.className = "card";
    const img = document.createElement("img");
    img.src = "TempImg.png";
    img.alt = "Idea image";
    img.style.maxWidth = "100%";
    img.style.borderRadius = "8px";
    newCard.appendChild(img);
    
 
    const center = getViewportCenter();
    newCard.style.left = `${center.x - 100}px`;
    newCard.style.top = `${center.y - 100}px`;
    
    board.appendChild(newCard);
    initCard(newCard);
});


const txtButton = document.getElementById("txtBut");
txtButton.addEventListener("click", () => {
    const newCard = document.createElement("div");
    newCard.className = "card";
    const p = document.createElement("p");
    p.className = "idea";
    p.textContent = "New Idea";
    newCard.appendChild(p);
    

    const center = getViewportCenter();
    newCard.style.left = `${center.x - 100}px`;
    newCard.style.top = `${center.y - 100}px`;
    
    board.appendChild(newCard);
    initCard(newCard);
});


window.addEventListener("resize", updateLines);